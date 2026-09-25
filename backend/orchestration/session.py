"""
In-memory turn-based session state manager for NIRNAY wargaming.
Manages wargame lifecycle, multi-turn state persistence, and execution bridging.
"""

import uuid
import time
from typing import Dict, Optional, List, Any, Callable
from datetime import datetime

from backend.orchestration.state import WargameState
from backend.orchestration.graph import create_wargame_graph, add_log_listener, remove_log_listener
from backend.config.presets import get_preset
from backend.schemas.contracts import HumanInputContract
from backend.api.models.wargame import (
    TurnResult,
    TurnMetrics,
    EvaluationSummary,
    TurnDecisions,
    SessionOverview,
)


class WargameSession:
    def __init__(
        self,
        session_id: str,
        preset_id: str,
        turn_duration: str,
        human_guidance: str,
        human_constraints: str,
        seed: int = 42
    ):
        self.session_id = session_id
        self.preset_id = preset_id
        self.turn_duration = turn_duration
        self.human_guidance = human_guidance
        self.human_constraints = human_constraints
        self.seed = seed
        self.created_at = datetime.utcnow().isoformat()
        
        self.current_turn = 0
        self.status = "idle"  # "idle" | "running" | "awaiting_decision" | "concluded" | "error"
        self.last_state: Optional[WargameState] = None
        self.turns: List[TurnResult] = []
        self.active_logs: List[str] = []
        self.last_interpreted_command: Optional[Dict[str, Any]] = None


class WargameSessionStore:
    def __init__(self):
        self._sessions: Dict[str, WargameSession] = {}
        self._graph = None

    def _get_graph(self):
        if self._graph is None:
            self._graph = create_wargame_graph()
        return self._graph

    def create_session(
        self,
        preset_id: str = "DEMO-001",
        turn_duration: str = "1m",
        human_guidance: Optional[str] = None,
        human_constraints: Optional[str] = None,
        seed: int = 42
    ) -> WargameSession:
        preset = get_preset(preset_id)
        session_id = f"WARGAME-{uuid.uuid4().hex[:8].upper()}"
        guidance = human_guidance or preset.default_objective
        constraints = human_constraints or preset.default_constraints

        session = WargameSession(
            session_id=session_id,
            preset_id=preset_id,
            turn_duration=turn_duration,
            human_guidance=guidance,
            human_constraints=constraints,
            seed=seed
        )
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[WargameSession]:
        return self._sessions.get(session_id)

    def list_sessions(self) -> List[SessionOverview]:
        overviews = []
        for s in self._sessions.values():
            preset = get_preset(s.preset_id)
            overviews.append(SessionOverview(
                session_id=s.session_id,
                preset_id=s.preset_id,
                theater=preset.theater,
                current_turn=s.current_turn,
                status=s.status,
                turn_duration=s.turn_duration,
                created_at=s.created_at,
                total_turns=len(s.turns),
                turns=s.turns
            ))
        return overviews

    def run_turn(
        self,
        session_id: str,
        human_guidance_override: Optional[str] = None,
        command_contract: Optional[HumanInputContract] = None,
        log_callback: Optional[Callable[[str], None]] = None
    ) -> TurnResult:
        """
        Executes exactly ONE turn of the wargame pipeline.
        Updates session state and persists strategic history.
        """
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found.")

        session.status = "running"
        turn_number = session.current_turn + 1
        
        # Determine scenario ID and lineage
        if session.last_state and session.last_state.scenario_transition:
            scenario_id = session.last_state.scenario_transition.next_scenario.scenario_id
            parent_id = session.last_state.scenario_id
        else:
            scenario_id = str(turn_number)
            parent_id = None

        # Update guidance if command provided
        guidance = session.human_guidance
        if human_guidance_override:
            guidance = human_guidance_override
            session.human_guidance = guidance
        elif command_contract and command_contract.input.text:
            guidance = f"{command_contract.input.text}"
            if command_contract.input.constraints:
                guidance += f" [Constraints: {'; '.join(command_contract.input.constraints)}]"
            session.human_guidance = guidance

        # Set up initial state for this turn, preserving previous simulation output
        prev_sim_output = session.last_state.simulation_output if session.last_state else None
        prev_transition = session.last_state.scenario_transition if session.last_state else None

        initial_state = WargameState(
            scenario_id=scenario_id,
            parent_scenario_id=parent_id,
            iteration_count=turn_number,
            max_iterations=10,  # Multi-turn campaign horizon
            human_guidance=guidance,
            turn_based=True,
            previous_simulation_output=prev_sim_output,
            scenario_transition=prev_transition,
            concluded=False
        )

        app = self._get_graph()
        
        # Attach log listener for real-time capture
        captured_logs: List[str] = []
        def listener(msg: str):
            captured_logs.append(msg)
            if log_callback:
                try:
                    log_callback(msg)
                except Exception:
                    pass

        add_log_listener(listener)
        final_state: Optional[WargameState] = None

        try:
            for step_output in app.stream(initial_state, stream_mode="values"):
                final_state = WargameState.model_validate(step_output)
        finally:
            remove_log_listener(listener)

        if not final_state:
            session.status = "error"
            raise RuntimeError(f"Turn execution produced no state for session {session_id}")

        session.last_state = final_state
        session.current_turn = turn_number
        is_concluded = final_state.concluded or turn_number >= 5
        session.status = "concluded" if is_concluded else "awaiting_decision"


        # Build TurnResult
        sim = final_state.simulation_output
        ev = final_state.evaluation_output

        metrics = TurnMetrics(
            blue_losses_percentage=sim.metrics.get("blue", {}).get("losses_percentage", 0.0) if sim else 0.0,
            red_losses_percentage=sim.metrics.get("red", {}).get("losses_percentage", 0.0) if sim else 0.0,
            termination_condition=sim.termination.condition if sim and sim.termination else "NORMAL",
            status=sim.status if sim else "COMPLETED",
            objectives=sim.objective_results if sim else []
        )

        eval_summary = EvaluationSummary()
        if ev:
            eval_summary.strategic_conclusion = ev.strategic_conclusion or ""
            assessment = ev.assessment
            if assessment:
                eval_summary.risks = getattr(assessment, "risks", None) or []
                eval_summary.tradeoffs = getattr(assessment, "tradeoffs", None) or []
                eval_summary.uncertainties = getattr(assessment, "uncertainties", None) or []
                eval_summary.strategic_implications = getattr(assessment, "strategic_implications", None) or []
            eval_summary.emergent_events = [
                {"type": e.type, "description": e.description, "impact": e.impact}
                for e in ev.emergent_events
            ]

        decisions = TurnDecisions()
        if final_state.blue_output:
            decisions.blue_coa_name = final_state.blue_output.decision.name
            decisions.blue_intent = final_state.blue_output.decision.intent
            decisions.blue_actions_count = len(final_state.blue_output.actions)
        if final_state.red_output:
            decisions.red_intent = final_state.red_output.assessment.intent
            decisions.red_actions_count = len(final_state.red_output.actions)

        interpreted_dict = None
        if command_contract:
            interpreted_dict = command_contract.model_dump()

        turn_result = TurnResult(
            session_id=session.session_id,
            turn_number=turn_number,
            scenario_id=final_state.scenario_id,
            parent_scenario_id=final_state.parent_scenario_id,
            human_guidance=final_state.human_guidance,
            concluded=is_concluded,
            session_status=session.status,
            metrics=metrics,
            evaluation=eval_summary,
            decisions=decisions,
            step_logs=final_state.step_logs,
            strategic_report=final_state.strategic_report,
            interpreted_command=interpreted_dict
        )

        session.turns.append(turn_result)
        return turn_result


# Global singleton instance
session_store = WargameSessionStore()
