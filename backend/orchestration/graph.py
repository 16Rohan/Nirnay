"""
LangGraph orchestration graph for NIRNAY strategic wargaming platform.
Implements the full closed-loop architecture:
Load Context -> Orchestrator -> Validate -> Generator -> Environment -> Blue -> Red -> Simulator -> Evaluation -> Persist Memory -> Route (End / Next Scenario).
Includes real-time flush logging for immediate CLI responsiveness.
"""

import sys
import time
from typing import Dict, Any, Literal, Optional, List
from langgraph.graph import StateGraph, START, END
from rich import print as rprint

from backend.orchestration.state import WargameState
from backend.schemas.contracts import (
    ContextRequest,
    SimulationInput,
    SimulationPlan,
    MemoryWriteContract,
    MemoryWriteContent,
    MemoryProvenance,
    BlueTeamOutput,
    BlueDecision,
    RedTeamOutput,
    RedAssessment,
)
from backend.memory.storage.markdown import MarkdownStorage
from backend.memory.resolver import MemoryResolver
from backend.memory.budgeter import ContextBudgeter
from backend.memory.assembler import ContextAssembler
from backend.memory.writer import MemoryWriter

from backend.agents.orchestrator import OrchestratorAgent
from backend.agents.environment import EnvironmentAgent
from backend.agents.blue import BlueTeamAgent
from backend.agents.red import RedTeamAgent
from backend.agents.evaluation import EvaluationAgent

from backend.simulation.scenarios.scenario_validator import ScenarioValidator
from backend.simulation.scenarios.scenario_generator import ScenarioGenerator
from backend.simulation.engine import DeterministicSimulator


# Initialize shared services
storage = MarkdownStorage()
resolver = MemoryResolver(storage)
budgeter = ContextBudgeter()
assembler = ContextAssembler(resolver, budgeter)
writer = MemoryWriter(storage)

validator = ScenarioValidator()
generator = ScenarioGenerator()
simulator = DeterministicSimulator()

orchestrator_agent = OrchestratorAgent()
environment_agent = EnvironmentAgent()
blue_agent = BlueTeamAgent()
red_agent = RedTeamAgent()
from datetime import datetime

evaluation_agent = EvaluationAgent()


_log_listeners = []
_event_listeners = []


def add_log_listener(listener):
    if listener not in _log_listeners:
        _log_listeners.append(listener)


def remove_log_listener(listener):
    if listener in _log_listeners:
        _log_listeners.remove(listener)


def add_event_listener(listener):
    if listener not in _event_listeners:
        _event_listeners.append(listener)


def remove_event_listener(listener):
    if listener in _event_listeners:
        _event_listeners.remove(listener)


def _emit_stage_event(event_type: str, stage: str, state: WargameState, payload: Optional[Dict[str, Any]] = None):
    evt = {
        "type": "stage_event",
        "event_type": event_type,
        "scenario_id": state.scenario_id,
        "turn": state.iteration_count,
        "stage": stage,
        "timestamp": datetime.utcnow().isoformat(),
        "payload": payload or {}
    }
    for listener in list(_event_listeners):
        try:
            listener(evt)
        except Exception:
            pass


def is_termination_active(state: WargameState) -> bool:
    if state.human_intent_contract:
        if state.human_intent_contract.structured_intent:
            s = state.human_intent_contract.structured_intent
            if getattr(s, "termination_requested", False):
                return True
            if s.intent_type in ("TERMINATE_SIMULATION", "TERMINATION_DIRECTIVE", "SPECIAL_EVENT_DIRECTIVE"):
                return True
            if s.special_event and s.special_event.get("terminal"):
                return True
        if state.human_intent_contract.operator_action == "TERMINATION":
            return True
    if state.human_guidance:
        lower = state.human_guidance.lower()
        if any(kw in lower for kw in ["terminate the simulation", "end the simulation", "terminate simulation", "end simulation", "terminate campaign", "end campaign", "abort simulation", "abort campaign", "mutual destruction", "catastrophic event", "both destroyed", "both are destroyed"]):
            return True
    return False


def _log(msg: str):
    rprint(msg)
    for listener in list(_log_listeners):
        try:
            listener(msg)
        except Exception:
            pass


def node_load_context(state: WargameState) -> Dict[str, Any]:
    _emit_stage_event("CONTEXT_STARTED", "context", state)
    _log(f"\n[bold magenta]>> [MEMORY][/bold magenta] Resolving logical context for Scenario {state.scenario_id}...")
    req = ContextRequest(
        agent="orchestrator",
        scenario_id=state.scenario_id,
        context_profile="ORCHESTRATOR_CONTEXT",
        requirements=["constraints", "active_context", "decisions", "events", "intelligence"],
        max_context_tokens=8000,
        include_history=True,
        history_depth=2
    )
    resolved = assembler.assemble(req)
    log = f"[MEMORY] Resolved logical context for Scenario {state.scenario_id} (Token estimate: {resolved.token_estimate})"
    _log(f"   [MEMORY] Context assembled: {len(resolved.context)} dimensions loaded.")
    _emit_stage_event("CONTEXT_LOADED", "context", state, {"token_estimate": resolved.token_estimate, "dimensions": len(resolved.context)})
    return {"context": resolved, "step_logs": state.step_logs + [log]}


def node_orchestrator(state: WargameState) -> Dict[str, Any]:
    _emit_stage_event("ORCHESTRATOR_STARTED", "orchestrator", state)
    _log(f"[bold blue]>> [ORCHESTRATOR][/bold blue] Synthesizing Dynamic Scenario Contract for Scenario {state.scenario_id}...")
    t0 = time.time()
    contract = orchestrator_agent.generate_scenario_contract(
        scenario_id=state.scenario_id,
        parent_scenario_id=state.parent_scenario_id,
        context=state.context,
        transition=state.scenario_transition,
        human_guidance=state.human_guidance
    )

    # Invariant: If previous turn simulation output exists, ground truth forces & resources strictly persist
    if state.previous_simulation_output and state.previous_simulation_output.final_state:
        prev_final = state.previous_simulation_output.final_state
        if "blue" in prev_final and prev_final["blue"]:
            contract.forces["blue"] = list(prev_final["blue"].values())
        if "red" in prev_final and prev_final["red"]:
            contract.forces["red"] = list(prev_final["red"].values())
        if "resources" in prev_final and prev_final["resources"]:
            contract.resources["blue"] = dict(prev_final["resources"].get("blue", contract.resources.get("blue", {})))
            contract.resources["red"] = dict(prev_final["resources"].get("red", contract.resources.get("red", {})))

    elapsed = time.time() - t0
    source = "[yellow](Fallback)[/yellow]" if contract.metadata.classification == "FALLBACK" else "[green](Live NIM LLM)[/green]"
    log = f"[ORCHESTRATOR] Generated Dynamic Scenario Contract {contract.scenario_id} in {elapsed:.2f}s {source}: '{contract.metadata.title}'"
    _log(f"   [ORCHESTRATOR] Contract finalized in {elapsed:.2f}s {source}: '{contract.metadata.title}' (Forces: {len(contract.forces.get('blue', []))} Blue, {len(contract.forces.get('red', []))} Red)")
    _emit_stage_event("ORCHESTRATOR_COMPLETED", "orchestrator", state, {
        "title": contract.metadata.title,
        "classification": contract.metadata.classification,
        "blue_forces": len(contract.forces.get("blue", [])),
        "red_forces": len(contract.forces.get("red", [])),
        "duration_s": round(elapsed, 2)
    })
    return {"scenario_contract": contract, "step_logs": state.step_logs + [log]}


def node_validate_contract(state: WargameState) -> Dict[str, Any]:
    _log(f"[bold green]>> [VALIDATION][/bold green] Deterministically validating Scenario Contract {state.scenario_contract.scenario_id}...")
    is_valid, violations = validator.validate(state.scenario_contract)
    if not is_valid:
        log = f"[VALIDATION] CONTRACT FAILED validation with {len(violations)} errors: {violations}"
        _log(f"   [VALIDATION] FAILED: {violations}")
        return {"validation_passed": False, "validation_errors": violations, "step_logs": state.step_logs + [log]}
    log = f"[VALIDATION] Scenario Contract {state.scenario_contract.scenario_id} passed all deterministic constraints."
    _log(f"   [VALIDATION] Passed: All hard constraints satisfied.")
    return {"validation_passed": True, "validation_errors": [], "step_logs": state.step_logs + [log]}


# node_materialize_scenario REMOVED: its output was never stored in WargameState
# and was therefore never consumed by node_simulation. The force state is already
# carried correctly through scenario_contract (overwritten with prev_final_state
# in node_orchestrator for Turn N>1). Removing this dead node saves one compute
# call per turn and eliminates the misleading log entry.


def node_environment(state: WargameState) -> Dict[str, Any]:
    _emit_stage_event("ENVIRONMENT_STARTED", "environment", state)
    _log(f"[bold yellow]>> [ENVIRONMENT][/bold yellow] Analyzing terrain, weather, and mobility implications...")
    t0 = time.time()
    env_out = environment_agent.analyze(state.scenario_contract)
    elapsed = time.time() - t0
    source = "[yellow](Fallback)[/yellow]" if env_out.dynamic.get("source") == "deterministic_fallback" else "[green](Live NIM LLM)[/green]"
    log = f"[ENVIRONMENT] Completed environmental assessment in {elapsed:.2f}s {source}: weather='{env_out.environment_assessment.get('weather', {}).get('condition', 'Overcast')}', visibility={env_out.environment_assessment.get('visibility_km', 8.0)}km"
    _log(f"   [ENVIRONMENT] Assessment complete in {elapsed:.2f}s {source}: visibility {env_out.environment_assessment.get('visibility_km', 8.0)}km, mobility tracked={env_out.environment_assessment.get('mobility', {}).get('tracked', 0.8)}.")
    _emit_stage_event("ENVIRONMENT_COMPLETED", "environment", state, {
        "weather": env_out.environment_assessment.get("weather", {}),
        "visibility_km": env_out.environment_assessment.get("visibility_km", 8.0),
        "provenance": env_out.dynamic,
        "duration_s": round(elapsed, 2)
    })
    return {"environment_output": env_out, "step_logs": state.step_logs + [log]}


def node_blue_team(state: WargameState) -> Dict[str, Any]:
    _emit_stage_event("BLUE_STARTED", "blue_team", state)
    t0 = time.time()
    if is_termination_active(state):
        _log(f"[bold dodger_blue1]>> [BLUE TEAM][/bold dodger_blue1] Termination directive active. Suspending operational actions...")
        blue_out = BlueTeamOutput(
            agent="blue_team",
            scenario_id=state.scenario_id,
            decision=BlueDecision(
                course_of_action_id=f"COA-TERM-{state.scenario_id}",
                name="Operations Suspended - Immediate Termination Enforced",
                intent="Halt all tactical operations per operator termination directive."
            ),
            actions=[],
            resource_allocation={},
            decision_rationale=["Operator termination directive active. Friendly operations suspended."],
            dynamic={"source": "deterministic_termination", "mode": "TERMINAL"}
        )
        elapsed = time.time() - t0
        log = f"[BLUE TEAM] Operations suspended in {elapsed:.2f}s (Deterministic Termination): '{blue_out.decision.name}'"
        _log(f"   [BLUE TEAM] Suspended in {elapsed:.2f}s: '{blue_out.decision.name}'")
        _emit_stage_event("BLUE_COMPLETED", "blue_team", state, {
            "coa_name": blue_out.decision.name,
            "intent": blue_out.decision.intent,
            "actions_count": 0,
            "actions": [],
            "rationale": blue_out.decision_rationale,
            "duration_s": round(elapsed, 2),
            "provenance": blue_out.dynamic
        })
        return {
            "blue_output": blue_out,
            "previous_blue_output": blue_out,
            "step_logs": state.step_logs + [log]
        }

    _log(f"[bold dodger_blue1]>> [BLUE TEAM][/bold dodger_blue1] Generating friendly Course of Action (COA)...")
    blue_out = blue_agent.plan_course_of_action(
        contract=state.scenario_contract,
        env_assessment=state.environment_output,
        human_guidance=state.human_guidance,
        previous_sim_output=state.previous_simulation_output,
        previous_blue_output=state.previous_blue_output,
    )
    elapsed = time.time() - t0
    source = "[yellow](Fallback)[/yellow]" if blue_out.dynamic.get("mode") == "FALLBACK" or blue_out.dynamic.get("source") == "deterministic_fallback" else "[green](Live NIM LLM)[/green]"
    log = f"[BLUE TEAM] Formulated Course of Action in {elapsed:.2f}s {source}: '{blue_out.decision.name}' (Actions: {len(blue_out.actions)})"
    _log(f"   [BLUE TEAM] COA finalized in {elapsed:.2f}s {source}: '{blue_out.decision.name}' ({blue_out.decision.intent})")
    _emit_stage_event("BLUE_COMPLETED", "blue_team", state, {
        "coa_name": blue_out.decision.name,
        "intent": blue_out.decision.intent,
        "actions_count": len(blue_out.actions),
        "actions": [act.model_dump() if hasattr(act, "model_dump") else act for act in blue_out.actions],
        "rationale": blue_out.decision_rationale,
        "duration_s": round(elapsed, 2),
        "provenance": blue_out.dynamic
    })
    return {
        "blue_output": blue_out,
        "previous_blue_output": blue_out,
        "step_logs": state.step_logs + [log]
    }


def node_red_team(state: WargameState) -> Dict[str, Any]:
    _emit_stage_event("RED_STARTED", "red_team", state)
    t0 = time.time()
    if is_termination_active(state):
        _log(f"[bold red]>> [RED TEAM][/bold red] Theater termination active. Adversary movements halted...")
        red_out = RedTeamOutput(
            agent="red_team",
            scenario_id=state.scenario_id,
            response_id=f"RED-TERM-{state.scenario_id}",
            assessment=RedAssessment(
                blue_coa_reference=f"COA-TERM-{state.scenario_id}",
                red_objective="NONE",
                intent="Adversary movement ceased per theater termination."
            ),
            actions=[],
            counter_actions=[],
            resource_allocation={},
            decision_rationale=["Theater operations concluded per operator termination directive."],
            dynamic={"source": "deterministic_termination", "mode": "TERMINAL"}
        )
        elapsed = time.time() - t0
        log = f"[RED TEAM] Adversary movements halted in {elapsed:.2f}s (Deterministic Termination): '{red_out.assessment.intent}'"
        _log(f"   [RED TEAM] Movements ceased in {elapsed:.2f}s: '{red_out.assessment.intent}'")
        _emit_stage_event("RED_COMPLETED", "red_team", state, {
            "red_objective": red_out.assessment.red_objective,
            "intent": red_out.assessment.intent,
            "actions_count": 0,
            "actions": [],
            "counter_actions": [],
            "rationale": red_out.decision_rationale,
            "duration_s": round(elapsed, 2),
            "provenance": red_out.dynamic
        })
        return {
            "red_output": red_out,
            "previous_red_output": red_out,
            "step_logs": state.step_logs + [log]
        }

    _log(f"[bold red]>> [RED TEAM][/bold red] Generating adaptive adversarial response...")
    red_out = red_agent.plan_response(
        contract=state.scenario_contract,
        env_assessment=state.environment_output,
        blue_coa=state.blue_output,
        previous_sim_output=state.previous_simulation_output,
        previous_red_output=state.previous_red_output,
    )
    elapsed = time.time() - t0
    source = "[yellow](Fallback)[/yellow]" if red_out.dynamic.get("mode") == "FALLBACK" or red_out.dynamic.get("source") == "deterministic_fallback" else "[green](Live NIM LLM)[/green]"
    log = f"[RED TEAM] Formulated Adaptive Response in {elapsed:.2f}s {source}: '{red_out.assessment.intent}' (Actions: {len(red_out.actions)})"
    _log(f"   [RED TEAM] Response formulated in {elapsed:.2f}s {source}: '{red_out.assessment.intent}'")
    _emit_stage_event("RED_COMPLETED", "red_team", state, {
        "red_objective": red_out.assessment.red_objective,
        "intent": red_out.assessment.intent,
        "actions_count": len(red_out.actions),
        "actions": [act.model_dump() if hasattr(act, "model_dump") else act for act in red_out.actions],
        "counter_actions": red_out.counter_actions,
        "rationale": red_out.decision_rationale,
        "duration_s": round(elapsed, 2),
        "provenance": red_out.dynamic
    })
    return {
        "red_output": red_out,
        "previous_red_output": red_out,
        "step_logs": state.step_logs + [log]
    }


def node_simulation(state: WargameState) -> Dict[str, Any]:
    _emit_stage_event("SIMULATION_STARTED", "simulation", state)
    _log(f"[bold green3]>> [SIMULATOR][/bold green3] Executing deterministic rule-based simulation engine (Seed: 42, Turn: {state.iteration_count})...")
    t0 = time.time()
    contract = state.scenario_contract
    initial_entities_blue = {
        u.get("id", f"BLUE-UNIT-{i+1}"): u
        for i, u in enumerate(contract.forces.get("blue", []))
    }
    initial_entities_red = {
        u.get("id", f"RED-UNIT-{i+1}"): u
        for i, u in enumerate(contract.forces.get("red", []))
    }

    hard_constraints = []
    if contract.constraints and contract.constraints.hard:
        for c in contract.constraints.hard:
            desc = c.description if hasattr(c, "description") else (c.get("description") if isinstance(c, dict) else str(c))
            hard_constraints.append(desc)

    special_events = []
    human_intent_dict = None
    if state.human_intent_contract:
        if state.human_intent_contract.input.constraints:
            hard_constraints.extend(state.human_intent_contract.input.constraints)
        if state.human_intent_contract.structured_intent:
            s_intent = state.human_intent_contract.structured_intent
            human_intent_dict = s_intent.model_dump()
            if s_intent.special_event:
                special_events.append(s_intent.special_event)
            if s_intent.constraints:
                hard_constraints.extend(s_intent.constraints)

    if is_termination_active(state):
        if not human_intent_dict:
            human_intent_dict = {"intent_type": "TERMINATE_SIMULATION", "termination_requested": True}
        else:
            human_intent_dict["termination_requested"] = True

    sim_input = SimulationInput(
        simulation_id=f"SIM-{state.scenario_id}",
        scenario_id=state.scenario_id,
        current_turn=state.iteration_count,
        initial_state={"blue": initial_entities_blue, "red": initial_entities_red},
        environment=state.environment_output.environment_assessment,
        resources=contract.resources,
        blue_plan=SimulationPlan(
            course_of_action_id=state.blue_output.decision.course_of_action_id,
            actions=state.blue_output.actions,
            resource_allocation=state.blue_output.resource_allocation
        ),
        red_plan=SimulationPlan(
            response_id=state.red_output.response_id,
            actions=state.red_output.actions,
            resource_allocation=state.red_output.resource_allocation
        ),
        rules={"rules": contract.rules.simulation_rules},
        previous_actions=state.previous_simulation_output.action_results if state.previous_simulation_output else [],
        time_horizon=contract.metadata.time_horizon,
        # Use iteration_count as seed offset so each turn is reproducible but unique.
        # The DeterministicSimulator further multiplies: turn_seed = seed + turn * 101
        seed=state.iteration_count,
        special_events=special_events,
        human_intent=human_intent_dict,
        hard_constraints=hard_constraints
    )

    sim_out = simulator.run(sim_input)
    elapsed = time.time() - t0
    b_loss = sim_out.metrics.get("blue", {}).get("losses_percentage", 0.0)
    r_loss = sim_out.metrics.get("red", {}).get("losses_percentage", 0.0)
    log = f"[SIMULATOR] Deterministic run finished in {elapsed:.2f}s (Turn {state.iteration_count}): Blue attrition: {b_loss}%, Red attrition: {r_loss}%, Condition: {sim_out.termination.condition}"
    _log(f"   [SIMULATOR] Result calculated in {elapsed:.2f}s: Blue attrition {b_loss}%, Red attrition {r_loss}%. Condition: {sim_out.termination.condition}")

    if sim_out.terminal or (sim_out.termination and sim_out.termination.terminal):
        _emit_stage_event("TERMINAL_EVENT", "simulation", state, {
            "condition": sim_out.termination.condition,
            "winner": sim_out.termination.winner,
            "outcome": sim_out.termination.outcome,
            "reason": sim_out.termination.reason
        })

    _emit_stage_event("SIMULATION_COMPLETED", "simulation", state, {
        "blue_losses_percentage": b_loss,
        "red_losses_percentage": r_loss,
        "termination_condition": sim_out.termination.condition,
        "terminal": sim_out.terminal,
        "action_results": sim_out.action_results,
        "status": sim_out.status,
        "duration_s": round(elapsed, 2)
    })

    return {"simulation_input": sim_input, "simulation_output": sim_out, "step_logs": state.step_logs + [log]}


def node_evaluation(state: WargameState) -> Dict[str, Any]:
    _emit_stage_event("EVALUATION_STARTED", "evaluation", state)
    _log(f"[bold purple]>> [EVALUATION][/bold purple] Analyzing tactical outcomes, risks, trade-offs, and emergent events...")
    t0 = time.time()
    eval_out, transition = evaluation_agent.evaluate(
        contract=state.scenario_contract,
        sim_output=state.simulation_output,
        iteration_count=state.iteration_count,
        max_iterations=state.max_iterations
    )
    elapsed = time.time() - t0
    source = "[yellow](Fallback)[/yellow]" if eval_out.dynamic.get("source") == "deterministic_fallback" else "[green](Live NIM LLM)[/green]"
    status_str = "EVALUATED"
    log = f"[EVALUATION] Completed outcome evaluation in {elapsed:.2f}s {source}. Decision: {status_str}"
    _log(f"   [EVALUATION] Strategic assessment in {elapsed:.2f}s {source}: {status_str}")
    _emit_stage_event("EVALUATION_COMPLETED", "evaluation", state, {
        "conclusion": eval_out.strategic_conclusion,
        "risks": eval_out.assessment.risks if eval_out.assessment else [],
        "duration_s": round(elapsed, 2)
    })

    return {
        "evaluation_output": eval_out,
        "scenario_transition": transition,
        "concluded": False,  # Evaluation does not control campaign termination
        "step_logs": state.step_logs + [log]
    }


def node_persist_memory(state: WargameState) -> Dict[str, Any]:
    _log(f"[bold dark_orange]>> [PERSISTENT MEMORY][/bold dark_orange] Appending scenario outcomes to strategic Markdown records...")
    eval_out = state.evaluation_output
    events_list = [f"[{e.type.upper()}] {e.description}" for e in eval_out.emergent_events]
    for sim_ev in state.simulation_output.events:
        events_list.append(f"[SIM_EVENT] {sim_ev.get('name')}: Blue loss={sim_ev.get('blue_losses')}, Red loss={sim_ev.get('red_losses')}")

    decisions_list = [
        f"Blue Plan: {state.blue_output.decision.name}",
        f"Red Plan: {state.red_output.assessment.intent}"
    ]

    outcomes_list = [
        eval_out.strategic_conclusion,
        f"Termination condition: {state.simulation_output.termination.condition}"
    ]

    assessment = eval_out.assessment
    unresolved_list = getattr(assessment, "risks", None) or (assessment.get("risks", []) if isinstance(assessment, dict) else [])

    write_contract = MemoryWriteContract(
        memory_write_id=f"MW-{state.scenario_id}",
        scenario_id=state.scenario_id,
        source_agent="evaluation",
        memory_type="scenario_outcome",
        operation="APPEND",
        content=MemoryWriteContent(
            events=events_list,
            decisions=decisions_list,
            outcomes=outcomes_list,
            unresolved_issues=unresolved_list,
            human_interventions=[state.human_guidance]
        ),
        provenance=MemoryProvenance(
            source="evaluation_agent",
            simulation_id=state.simulation_output.simulation_id
        )
    )

    writer.write(write_contract)
    log = f"[PERSISTENT MEMORY] Appended scenario {state.scenario_id} outcomes to persistent strategic markdown records."
    _log(f"   [PERSISTENT MEMORY] Memory updated in 'memory/scenarios/{state.scenario_id}.md'")
    return {"step_logs": state.step_logs + [log]}


def node_prepare_next_iteration(state: WargameState) -> Dict[str, Any]:
    next_id = state.scenario_transition.next_scenario.scenario_id
    parent_id = state.scenario_transition.next_scenario.parent_scenario_id
    _log(f"\n=======================================================")
    _log(f"   ADVANCING SCENARIO LINEAGE: {state.scenario_id} -> {next_id}")
    _log(f"=======================================================\n")
    log = f"[ORCHESTRATOR] Advancing wargame from Scenario {state.scenario_id} to Scenario {next_id}..."
    return {
        "scenario_id": next_id,
        "parent_scenario_id": parent_id,
        "iteration_count": state.iteration_count + 1,
        "previous_simulation_output": state.simulation_output,
        "step_logs": state.step_logs + [log]
    }


def node_generate_report(state: WargameState) -> Dict[str, Any]:
    _log(f"\n[bold green]>> [REPORT AGENT][/bold green] Generating final Strategic Decision Report...")
    eval_out = state.evaluation_output
    report_lines = [
        f"# NIRNAY STRATEGIC DECISION REPORT",
        f"**Scenario Run**: {state.scenario_id}",
        f"**Parent Scenario**: {state.parent_scenario_id or 'Root'}",
        f"**Date**: 2026-09-25",
        f"\n## 1. Executive Strategic Assessment",
        eval_out.strategic_conclusion,
        f"\n## 2. Objective Results",
    ]
    for obj in state.simulation_output.objective_results:
        report_lines.append(f"- **{obj.get('objective')}**: {obj.get('status')} (Score: {obj.get('score', 1.0)})")

    report_lines.extend([
        f"\n## 3. Forces & Attrition",
        f"- **Blue Losses**: {state.simulation_output.metrics.get('blue', {}).get('losses_percentage')}%",
        f"- **Red Losses**: {state.simulation_output.metrics.get('red', {}).get('losses_percentage')}%",
        f"\n## 4. Key Decisions & Responses",
        f"- **Blue Course of Action**: {state.blue_output.decision.name} ({state.blue_output.decision.intent})",
        f"- **Red Adaptive Response**: {state.red_output.assessment.intent}",
        f"\n## 5. Strategic Risks & Trade-offs",
    ])
    assessment = eval_out.assessment
    risks = getattr(assessment, "risks", None) or (assessment.get("risks", []) if isinstance(assessment, dict) else [])
    tradeoffs = getattr(assessment, "tradeoffs", None) or (assessment.get("tradeoffs", []) if isinstance(assessment, dict) else [])
    uncertainties = getattr(assessment, "uncertainties", None) or (assessment.get("uncertainties", []) if isinstance(assessment, dict) else [])
    strategic_implications = getattr(assessment, "strategic_implications", None) or (assessment.get("strategic_implications", []) if isinstance(assessment, dict) else [])

    for r in risks:
        report_lines.append(f"- **Risk**: {r}")
    for t in tradeoffs:
        report_lines.append(f"- **Trade-off**: {t}")
    for u in uncertainties:
        report_lines.append(f"- **Uncertainty**: {u}")
    for s in strategic_implications:
        report_lines.append(f"- **Strategic Implication**: {s}")

    report_lines.extend([
        f"\n## 6. Emergent Developments",
    ])
    for ev in eval_out.emergent_events:
        report_lines.append(f"- **{ev.type.upper()}**: {ev.description} (Impact: {ev.impact})")

    report_text = "\n".join(report_lines)
    log = f"[REPORT AGENT] Final Strategic Decision Report compiled."
    return {"strategic_report": report_text, "step_logs": state.step_logs + [log]}


def router_check_continuation(state: WargameState) -> Literal["continue_loop", "conclude"]:
    is_terminal = False
    if state.simulation_output and (state.simulation_output.terminal or getattr(state.simulation_output.termination, "terminal", False)):
        is_terminal = True
    if state.turn_based or state.concluded or is_terminal or state.iteration_count >= state.max_iterations:
        return "conclude"
    return "continue_loop"



def create_wargame_graph():
    graph = StateGraph(WargameState)

    graph.add_node("load_context", node_load_context)
    graph.add_node("orchestrator", node_orchestrator)
    graph.add_node("validate_contract", node_validate_contract)
    # materialize_scenario removed: was a dead node (output never stored/consumed)
    graph.add_node("environment", node_environment)
    graph.add_node("blue_team", node_blue_team)
    graph.add_node("red_team", node_red_team)
    graph.add_node("simulation", node_simulation)
    graph.add_node("evaluation", node_evaluation)
    graph.add_node("persist_memory", node_persist_memory)
    graph.add_node("prepare_next_iteration", node_prepare_next_iteration)
    graph.add_node("generate_report", node_generate_report)

    # Edge definitions
    graph.add_edge(START, "load_context")
    graph.add_edge("load_context", "orchestrator")
    graph.add_edge("orchestrator", "validate_contract")
    # validate_contract → environment (materialize_scenario removed from pipeline)
    graph.add_edge("validate_contract", "environment")
    graph.add_edge("environment", "blue_team")
    graph.add_edge("blue_team", "red_team")
    graph.add_edge("red_team", "simulation")
    graph.add_edge("simulation", "evaluation")
    graph.add_edge("evaluation", "persist_memory")

    graph.add_conditional_edges(
        "persist_memory",
        router_check_continuation,
        {
            "continue_loop": "prepare_next_iteration",
            "conclude": "generate_report"
        }
    )

    graph.add_edge("prepare_next_iteration", "load_context")
    graph.add_edge("generate_report", END)

    return graph.compile()
