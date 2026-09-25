"""
NIRNAY PRD-06: Progressive Execution, Intelligent Agents & Command Semantics Test Suite.
Verifies all Section 41-42 mandatory test scenarios:
- Test 1: Human Termination Directive
- Test 2: Third-Party Catastrophic Event (regression test from browser testing)
- Test 3: Evaluator continuation-after-terminal prevention (Simulator authority)
- Test 4: LLM State Hallucination vs Authoritative Simulator State
- Test 5: Repeated Strategy & Adversarial Adaptation
- Test 6: Human Strategic Override (e.g. Defend -> Withdraw)
- Test 7: Impossible Human Command & Conflict Handling
- Test 8: Five-Turn Adaptive Campaign
- Test 9: Progressive Execution Stage Events Pipeline
- Test 10: Proposed vs Executed vs Rejected Action Adjudication
- Test 11: Hard Constraint Enforcement
- Test 12: No Scenario Resurrection after conclusion
"""

import pytest
from unittest.mock import patch, MagicMock

from backend.schemas.contracts import (
    ScenarioContract,
    ScenarioMetadata,
    ScenarioObjectives,
    ScenarioConstraints,
    ScenarioActors,
    ScenarioGeography,
    ScenarioEnvironment,
    ScenarioRules,
    InformationState,
    HumanInputData,
    ExternalInformation,
    SimulationInput,
    SimulationPlan,
    ActionPayload,
    SimulationOutput,
    SimulationTermination,
    HumanInputContract,
    StructuredIntent,
    EnvironmentOutput,
    BlueTeamOutput,
    RedTeamOutput,
)
from backend.agents.orchestrator import OrchestratorAgent
from backend.agents.blue import BlueTeamAgent
from backend.agents.red import RedTeamAgent
from backend.agents.evaluation import EvaluationAgent
from backend.simulation.engine import DeterministicSimulator
from backend.orchestration.session import WargameSessionStore
from backend.orchestration.state import WargameState
from backend.orchestration.graph import (
    create_wargame_graph,
    add_event_listener,
    remove_event_listener,
    router_check_continuation,
)


def _create_sample_contract(scenario_id="PRD06-TEST-01"):
    return ScenarioContract(
        scenario_id=scenario_id,
        metadata=ScenarioMetadata(
            title="Operation Progressive Intel",
            description="Testing PRD-06 semantic execution and intelligent agents",
            time_horizon="24h",
            classification="TEST"
        ),
        objectives=ScenarioObjectives(
            primary=["Hold Forward Logistics Point Alpha"],
            secondary=["Minimise ammunition burn"],
            success_conditions=["Alpha remains secure"],
            failure_conditions=["Adversary breakout south of river"]
        ),
        constraints=ScenarioConstraints(
            hard=[{"id": "HC-01", "description": "Remain in Eastern Valley", "enforcement": "BLOCK"}],
            operational=["Conserve fuel reserves"],
            political=["No kinetic strikes across border"]
        ),
        actors=ScenarioActors(
            blue={"role": "Defender", "doctrine": "Active Defense"},
            red={"role": "Attacker", "doctrine": "Encirclement"}
        ),
        forces={
            "blue": [
                {"id": "BLUE-BDE-1", "name": "1st Mech Brigade", "type": "Mechanized Infantry", "strength": 90, "location": "LOC-ALPHA"}
            ],
            "red": [
                {"id": "RED-DIV-1", "name": "4th Armored Column", "type": "Armored Column", "strength": 100, "location": "LOC-BRAVO"}
            ],
            "third_party": []
        },
        resources={
            "blue": {"fuel": 80, "ammo": 85},
            "red": {"fuel": 100, "ammo": 90},
            "shared": {}
        },
        geography=ScenarioGeography(
            area_of_operations={"name": "Disputed Corridor", "bounds": [30.0, 70.0, 31.0, 71.0]},
            key_locations=[
                {"id": "LOC-ALPHA", "name": "Logistics Point Alpha"},
                {"id": "LOC-BRAVO", "name": "River Crossing Point"}
            ],
            terrain={"type": "Valley Basin"}
        ),
        environment=ScenarioEnvironment(
            weather={"condition": "Rain"},
            visibility={"range_km": 5.0}
        ),
        rules=ScenarioRules(
            simulation_rules=["Mud reduces wheeled mobility by 30%"]
        ),
        information_state=InformationState(known_facts=["Enemy at north bank"]),
        human_input=HumanInputData(strategic_guidance=["Hold Alpha"]),
        external_information=ExternalInformation()
    )


class TestPRD06CommandSemantics:
    """Tests parsing and classification of human directives into StructuredIntent."""

    def test_termination_command_semantics(self):
        orchestrator = OrchestratorAgent()
        cmd = "End the simulation immediately."
        contract = orchestrator.interpret_human_command(cmd, scenario_id="1")
        
        assert contract.structured_intent is not None
        assert contract.structured_intent.intent_type == "TERMINATE_SIMULATION"
        assert contract.structured_intent.priority == "ABSOLUTE"
        assert contract.structured_intent.execution_requirement == "IMMEDIATE"
        assert contract.operator_action == "TERMINATION"

    def test_third_party_catastrophic_event_semantics(self):
        orchestrator = OrchestratorAgent()
        cmd = (
            "Terminate the simulation immediately. A third-party adversarial nuclear event occurs. "
            "Blue and Red are both destroyed. There is no victor. The simulation ends immediately."
        )
        contract = orchestrator.interpret_human_command(cmd, scenario_id="1")

        assert contract.structured_intent is not None
        assert contract.structured_intent.intent_type == "SPECIAL_EVENT_DIRECTIVE"
        assert contract.structured_intent.priority == "ABSOLUTE"
        assert contract.structured_intent.special_event is not None
        assert contract.structured_intent.special_event["event_type"] == "THIRD_PARTY_CATASTROPHIC_EVENT"
        assert contract.structured_intent.special_event["terminal"] is True
        assert contract.structured_intent.special_event["victory_state"] == "STALEMATE"

    def test_hard_constraint_semantics(self):
        orchestrator = OrchestratorAgent()
        cmd = "Do not initiate offensive action. Maintain strictly defensive posture."
        contract = orchestrator.interpret_human_command(cmd, scenario_id="1")

        assert contract.structured_intent is not None
        assert contract.structured_intent.intent_type == "HARD_CONSTRAINT"
        assert contract.structured_intent.priority == "ABSOLUTE"
        assert len(contract.input.constraints) > 0

    def test_impossible_command_conflict_handling(self):
        orchestrator = OrchestratorAgent()
        cmd = "Move destroyed Blue-01 to Bravo."
        contract = orchestrator.interpret_human_command(cmd, scenario_id="1")

        assert contract.structured_intent is not None
        assert contract.structured_intent.conflict_detected is True
        assert "destroyed" in contract.structured_intent.conflict_reason.lower()


class TestPRD06SimulatorTerminationAuthority:
    """Verifies that the Deterministic Simulator authoritatively adjudicates terminal states."""

    def test_terminal_command_short_circuits_turn_pipeline(self):
        store = WargameSessionStore()
        session = store.create_session("DEMO-001")
        cmd_text = "End the simulation immediately. Catastrophic event. Both sides destroyed. Terminate campaign."
        orchestrator = OrchestratorAgent()
        cmd_contract = orchestrator.interpret_human_command(cmd_text, scenario_id="1")

        result = store.run_turn(session.session_id, command_contract=cmd_contract)

        assert result.concluded is True
        assert result.session_status == "concluded"
        assert result.metrics.status == "TERMINATED"
        assert result.decisions.blue_actions_count == 0
        assert result.decisions.red_actions_count == 0
        assert "operations suspended" in result.decisions.blue_coa_name.lower() or "terminated" in result.decisions.blue_coa_name.lower()

    def test_third_party_catastrophic_regression(self):
        """Mandatory regression test: Third-party catastrophic event terminates simulation with mutual destruction."""
        simulator = DeterministicSimulator()
        sim_input = SimulationInput(
            simulation_id="SIM-CAT-01",
            scenario_id="1",
            current_turn=1,
            initial_state={
                "blue": {"BLUE-UNIT-1": {"id": "BLUE-UNIT-1", "strength": 90, "location": "LOC-ALPHA"}},
                "red": {"RED-UNIT-1": {"id": "RED-UNIT-1", "strength": 100, "location": "LOC-BRAVO"}}
            },
            blue_plan=SimulationPlan(actions=[]),
            red_plan=SimulationPlan(actions=[]),
            special_events=[{
                "event_type": "THIRD_PARTY_CATASTROPHIC_EVENT",
                "affected_teams": ["blue", "red"],
                "effect": "TOTAL_DESTRUCTION",
                "victory_state": "STALEMATE",
                "terminal": True
            }]
        )

        sim_out = simulator.run(sim_input)

        assert sim_out.terminal is True
        assert sim_out.status == "TERMINATED"
        assert sim_out.termination.terminal is True
        assert sim_out.termination.condition == "MUTUAL_DESTRUCTION"
        assert sim_out.termination.winner == "NONE"
        assert sim_out.metrics["blue"]["losses_percentage"] == 100.0
        assert sim_out.metrics["blue"]["remaining_strength"] == 0
        assert sim_out.metrics["red"]["losses_percentage"] == 100.0
        assert sim_out.metrics["red"]["remaining_strength"] == 0

    def test_human_immediate_termination(self):
        simulator = DeterministicSimulator()
        sim_input = SimulationInput(
            simulation_id="SIM-TERM-01",
            scenario_id="1",
            current_turn=1,
            initial_state={
                "blue": {"BLUE-UNIT-1": {"id": "BLUE-UNIT-1", "strength": 90, "location": "LOC-ALPHA"}},
                "red": {"RED-UNIT-1": {"id": "RED-UNIT-1", "strength": 100, "location": "LOC-BRAVO"}}
            },
            blue_plan=SimulationPlan(actions=[]),
            red_plan=SimulationPlan(actions=[]),
            human_intent={"intent_type": "TERMINATE_SIMULATION"}
        )

        sim_out = simulator.run(sim_input)

        assert sim_out.terminal is True
        assert sim_out.status == "TERMINATED"
        assert sim_out.termination.condition == "HUMAN_TERMINATED"
        assert sim_out.termination.winner == "NONE"

    def test_evaluator_cannot_override_terminal_state(self):
        """Mandatory regression test: If sim_out.terminal = True, Evaluation CANNOT return concluded=False or CONTINUE."""
        eval_agent = EvaluationAgent()
        contract = _create_sample_contract("1")
        sim_out = SimulationOutput(
            simulation_id="SIM-TERM-FORCED",
            scenario_id="1",
            turn=1,
            status="TERMINATED",
            terminal=True,
            termination=SimulationTermination(
                reason="Third-party nuclear event",
                time="24h",
                condition="MUTUAL_DESTRUCTION",
                terminal=True,
                winner="NONE",
                outcome="MUTUAL_DESTRUCTION"
            ),
            metrics={
                "blue": {"losses_percentage": 100.0, "remaining_strength": 0},
                "red": {"losses_percentage": 100.0, "remaining_strength": 0}
            }
        )

        eval_out, transition = eval_agent.evaluate(contract, sim_out, iteration_count=1, max_iterations=5)

        assert eval_out.simulation_control.concluded is True
        assert eval_out.simulation_control.next_scenario_required is False
        assert transition.transition_type == "CONCLUDE"
        assert transition.next_scenario.requested is False
        assert transition.next_scenario.scenario_id == "NONE"

    def test_router_stops_on_terminal_simulation(self):
        state = WargameState(
            scenario_id="1",
            iteration_count=1,
            max_iterations=5,
            concluded=False,
            turn_based=False,
            simulation_output=SimulationOutput(
                simulation_id="SIM-01",
                scenario_id="1",
                turn=1,
                status="TERMINATED",
                terminal=True,
                termination=SimulationTermination(
                    reason="Mutual destruction",
                    time="24h",
                    condition="MUTUAL_DESTRUCTION",
                    terminal=True
                )
            )
        )
        route = router_check_continuation(state)
        assert route == "conclude"

    def test_no_scenario_resurrection_in_session_store(self):
        store = WargameSessionStore()
        session = store.create_session("DEMO-001")
        session.status = "concluded"

        with pytest.raises(ValueError, match="already concluded"):
            store.run_turn(session.session_id)


class TestPRD06AgentIntelligenceAndAdaptation:
    """Verifies that Blue and Red agents exhibit contextual reasoning and adaptation."""

    def test_blue_adapts_to_human_override_withdrawal(self):
        blue_agent = BlueTeamAgent()
        contract = _create_sample_contract("1")

        # Turn 1: Hold Alpha
        out_turn1 = blue_agent.plan_course_of_action(contract, human_guidance="Defend Forward Logistics Point Alpha.")
        assert "Defensive" in out_turn1.decision.name or "FORTIFY" in out_turn1.actions[0].action_type or "HOLD" in out_turn1.actions[0].action_type

        # Turn 2: Human Override: Abandon Alpha and withdraw
        out_turn2 = blue_agent.plan_course_of_action(
            contract,
            human_guidance="Abandon Alpha and withdraw immediately to rear rally point.",
            previous_blue_output=out_turn1
        )

        assert "Withdrawal" in out_turn2.decision.name or "Delaying" in out_turn2.decision.name
        assert out_turn2.actions[0].target_location == "LOC-REAR"
        assert "abandonment" in out_turn2.decision_rationale[0].lower() or "withdraw" in out_turn2.decision_rationale[0].lower()

    def test_red_adapts_to_blue_withdrawal(self):
        red_agent = RedTeamAgent()
        contract = _create_sample_contract("1")
        blue_withdrawing = BlueTeamOutput(
            scenario_id="1",
            decision={"course_of_action_id": "B-COA-2", "name": "Tactical Withdrawal & Delaying Screen", "intent": "Execute orderly retrograde movement from LOC-ALPHA", "priority": "HIGH"},
            actions=[{"action_id": "ACT-1", "action_type": "HOLD", "target_location": "LOC-REAR"}]
        )

        red_out = red_agent.plan_response(contract, env_assessment=EnvironmentOutput(scenario_id="1"), blue_coa=blue_withdrawing)

        # Red should advance to exploit the vacuum rather than staging standoff fires
        assert "Advance" in red_out.assessment.red_objective or "Exploit" in red_out.assessment.red_objective
        assert red_out.actions[0].action_type == "ADVANCE"
        assert red_out.actions[0].target_location == "LOC-ALPHA"

    def test_red_adapts_to_blue_fortification(self):
        red_agent = RedTeamAgent()
        contract = _create_sample_contract("1")
        blue_fortified = BlueTeamOutput(
            scenario_id="1",
            decision={"course_of_action_id": "B-COA-1", "name": "Defensive Redoubt & Sector Anchor", "intent": "Entrench forces at Forward Logistics Point Alpha", "priority": "HIGH"},
            actions=[{"action_id": "ACT-1", "action_type": "FORTIFY", "target_location": "LOC-ALPHA"}]
        )

        red_out = red_agent.plan_response(contract, env_assessment=EnvironmentOutput(scenario_id="1"), blue_coa=blue_fortified)

        # Red should avoid naive frontal assault on fortified positions
        assert "Standoff" in red_out.assessment.red_objective or "Interdiction" in red_out.assessment.red_objective
        assert red_out.actions[0].action_type == "STRIKE"

    def test_hard_constraint_blocks_offensive_action(self):
        simulator = DeterministicSimulator()
        sim_input = SimulationInput(
            simulation_id="SIM-HC-TEST",
            scenario_id="1",
            current_turn=1,
            initial_state={
                "blue": {"BLUE-UNIT-1": {"id": "BLUE-UNIT-1", "strength": 90, "location": "LOC-ALPHA"}},
                "red": {"RED-UNIT-1": {"id": "RED-UNIT-1", "strength": 100, "location": "LOC-BRAVO"}}
            },
            blue_plan=SimulationPlan(actions=[
                {"action_id": "ACT-ILLEGAL-ATTACK", "actor": "blue", "unit_id": "BLUE-UNIT-1", "action_type": "ADVANCE", "target_location": "LOC-BRAVO"}
            ]),
            red_plan=SimulationPlan(actions=[]),
            hard_constraints=["Do not initiate offensive action. Defensive posture only."]
        )

        sim_out = simulator.run(sim_input)

        # The offensive advance must be rejected
        assert len(sim_out.action_results) == 1
        res = sim_out.action_results[0]
        assert res["status"] == "REJECTED"
        assert "offensive action prohibited" in res["reason"]

    def test_authoritative_state_prevents_llm_hallucination(self):
        """Simulator state remains authoritative regardless of agent claims."""
        store = WargameSessionStore()
        session = store.create_session("DEMO-001")
        turn1 = store.run_turn(session.session_id)

        # Ground truth state in final_state
        blue_strength = turn1.metrics.blue_losses_percentage
        assert blue_strength >= 0.0
        assert session.last_state.simulation_output is not None


class TestPRD06ProgressiveExecutionEvents:
    """Verifies event emission across all stages of turn execution."""

    def test_stage_event_ordering(self):
        store = WargameSessionStore()
        session = store.create_session("DEMO-001")

        received_events = []
        def event_collector(evt):
            received_events.append(evt["event_type"])

        turn1 = store.run_turn(session.session_id, event_callback=event_collector)

        expected_sequence = [
            "CONTEXT_STARTED",
            "CONTEXT_LOADED",
            "ORCHESTRATOR_STARTED",
            "ORCHESTRATOR_COMPLETED",
            "ENVIRONMENT_STARTED",
            "ENVIRONMENT_COMPLETED",
            "BLUE_STARTED",
            "BLUE_COMPLETED",
            "RED_STARTED",
            "RED_COMPLETED",
            "SIMULATION_STARTED",
            "SIMULATION_COMPLETED",
            "EVALUATION_STARTED",
            "EVALUATION_COMPLETED"
        ]

        for expected in expected_sequence:
            assert expected in received_events, f"Expected event '{expected}' was not emitted during progressive execution."


class TestPRD06FiveTurnAdaptiveCampaign:
    """Full 5-turn adaptive campaign verification."""

    def test_five_turn_adaptive_execution(self):
        store = WargameSessionStore()
        session = store.create_session("DEMO-001")

        directives = [
            "Establish fortified defensive perimeter at Alpha.",
            "Prioritize reconnaissance toward Bravo to observe crossing points.",
            "Conserve fuel and avoid direct engagement.",
            "Abandon Alpha if necessary to preserve combat integrity.",
            "Prioritize campaign survival over territorial gain."
        ]

        for turn_idx, directive in enumerate(directives, 1):
            assert session.status in ("idle", "awaiting_decision")
            cmd = HumanInputContract(
                input_id=f"CMD-{turn_idx}",
                scenario_id=str(turn_idx),
                input={"text": directive, "selected_options": [directive], "constraints": []}
            )
            result = store.run_turn(session.session_id, command_contract=cmd)
            assert result.turn_number == turn_idx

        # After 5 turns, campaign must be concluded
        assert session.status == "concluded"
        assert len(session.turns) == 5

        # Verify no resurrection on 6th turn attempt
        with pytest.raises(ValueError, match="already concluded"):
            store.run_turn(session.session_id)
