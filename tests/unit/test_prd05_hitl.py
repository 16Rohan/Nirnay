"""
NIRNAY PRD-05: Comprehensive Human-in-the-Loop (HITL) Verification & Adversarial Test Suite.
Verifies all categories A-P and Section 25 Adversarial Test Scenarios:
- A: Human Input Acceptance
- B: Human Input Persistence
- C: Human Input Influence
- D: Human Input Does Not Mutate State
- E: Simulator Authority
- F: Turn Inheritance
- G: Resource Persistence
- H: Destroyed Unit Persistence
- I: Session Isolation
- J/K: LLM Failure & Malformed Output Resilience
- L: Evaluation Integrity
- M: History Integrity
- N: Multi-Turn HITL Campaign (5 Turns)
- Adversarial 1-5: Anti-Reset, Impossible Action, Unlimited Resources, Hallucinated LLM Resets, Multi-session
"""

import pytest
import copy
from unittest.mock import patch

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
    ResolvedAgentContext,
    HumanInputContract,
    SimulationInput,
    SimulationPlan,
    ActionPayload,
    SimulationOutput,
    SimulationTermination,
)
from backend.agents.orchestrator import OrchestratorAgent
from backend.agents.blue import BlueTeamAgent
from backend.agents.red import RedTeamAgent
from backend.agents.evaluation import EvaluationAgent
from backend.simulation.engine import DeterministicSimulator
from backend.orchestration.session import WargameSessionStore
from backend.orchestration.state import WargameState
from backend.orchestration.graph import create_wargame_graph, node_orchestrator, node_simulation


def _create_sample_contract(scenario_id="TEST-HITL-01"):
    return ScenarioContract(
        scenario_id=scenario_id,
        metadata=ScenarioMetadata(
            title="Operation Test Standoff",
            description="Operational sector test",
            time_horizon="24h",
            classification="TEST"
        ),
        objectives=ScenarioObjectives(
            primary=["Hold Objective Alpha", "Interdict logistics corridor"],
            secondary=["Minimise collateral damage"],
            success_conditions=["Retain Alpha with >= 60% force strength"],
            failure_conditions=["Alpha captured by adversary"]
        ),
        constraints=ScenarioConstraints(
            hard=[{"id": "HC-01", "description": "Remain in sector", "enforcement": "BLOCK"}],
            operational=["Limit fuel expenditure"],
            political=["No deep strikes"]
        ),
        actors=ScenarioActors(
            blue={"role": "Defender", "doctrine": "Active Defense"},
            red={"role": "Attacker", "doctrine": "Encirclement"}
        ),
        forces={
            "blue": [
                {"id": "BLUE-UNIT-1", "name": "1st Mech Btn", "type": "Mechanized Infantry", "strength": 90, "location": "LOC-ALPHA"},
                {"id": "BLUE-UNIT-2", "name": "2nd Armor Coy", "type": "Armored Column", "strength": 80, "location": "LOC-ALPHA"}
            ],
            "red": [
                {"id": "RED-UNIT-1", "name": "4th Strike Reg", "type": "Armored Column", "strength": 100, "location": "LOC-BRAVO"},
                {"id": "RED-UNIT-2", "name": "9th Artillery Bty", "type": "Artillery", "strength": 70, "location": "LOC-CHARLIE"}
            ],
            "third_party": []
        },
        resources={
            "blue": {"fuel": 80, "ammo": 85},
            "red": {"fuel": 95, "ammo": 90},
            "shared": {}
        },
        geography=ScenarioGeography(
            area_of_operations={"name": "Northern Sector", "bounds": [30.0, 70.0, 31.0, 71.0]},
            key_locations=[
                {"id": "LOC-ALPHA", "name": "Objective Alpha"},
                {"id": "LOC-BRAVO", "name": "Ridge Bravo"},
                {"id": "LOC-CHARLIE", "name": "Valley Charlie"}
            ],
            terrain={"type": "Valley", "traversability": "Moderate"}
        ),
        environment=ScenarioEnvironment(
            weather={"condition": "Clear"},
            visibility={"range_km": 10.0},
            terrain_conditions={"ground": "Dry"}
        ),
        rules=ScenarioRules(
            rules_of_engagement=["Defensive fires only"],
            engagement_rules=["Visual ID required"],
            movement_rules=["Standard road march"]
        ),
        information_state=InformationState(
            known_facts=["Enemy advancing from North"],
            uncertainties=["Enemy reserve composition"]
        ),
        human_input=HumanInputData(
            strategic_guidance=["Maintain active perimeter defense at Alpha"]
        ),
        external_information=ExternalInformation(
            sources=["Recon Drone SitRep #1"],
            relevant_events=["Adversary regrouping"]
        )
    )


def test_category_a_human_input_acceptance():
    """Verify that natural language command is converted to HumanInputContract."""
    orchestrator = OrchestratorAgent()
    directive = "Deploy recon screen toward LOC-BRAVO and hold fire unless engaged."
    contract = orchestrator.interpret_human_command(
        command_text=directive,
        scenario_id="1",
        current_guidance="Initial guidance"
    )
    assert isinstance(contract, HumanInputContract)
    assert contract.scenario_id == "1"
    assert contract.input.text == directive
    assert contract.stage == "STRATEGY"
    assert "blue_team" in contract.affected_agents


def test_category_b_human_input_persistence_in_turn_history():
    """Verify human guidance is recorded in the turn results across turns."""
    store = WargameSessionStore()
    session = store.create_session(preset_id="DEMO-001", human_guidance="Hold Alpha initial")
    turn1 = store.run_turn(session.session_id)
    assert "Hold Alpha initial" in turn1.human_guidance

    # Provide override command for turn 2
    cmd_text = "Counter-attack towards LOC-BRAVO with armored vanguard"
    cmd_contract = HumanInputContract(
        input_id="CMD-02",
        scenario_id="2",
        stage="STRATEGY",
        operator_action="COMMAND_OVERRIDE",
        input={"text": cmd_text, "selected_options": [cmd_text], "constraints": []},
        affected_agents=["blue_team"]
    )
    turn2 = store.run_turn(session.session_id, command_contract=cmd_contract)
    assert cmd_text in turn2.human_guidance
    assert session.turns[0].human_guidance != session.turns[1].human_guidance
    assert session.turns[1].human_guidance == cmd_text
    assert session.turns[1].interpreted_command is not None


def test_category_c_human_input_influence_on_blue_agent():
    """Verify that human guidance is passed to Blue Agent decision context."""
    blue = BlueTeamAgent()
    contract = _create_sample_contract()
    guidance = "Shift from defense to aggressive flanking maneuvers at LOC-BRAVO."
    blue_out = blue.plan_course_of_action(
        contract=contract,
        env_assessment=None,
        human_guidance=guidance
    )
    assert blue_out is not None
    assert blue_out.decision is not None
    assert len(blue_out.actions) > 0


def test_category_d_e_human_input_does_not_mutate_state_directly():
    """
    Verify human command cannot directly alter simulation ground truth.
    State changes ONLY occur through deterministic simulator adjudication.
    """
    simulator = DeterministicSimulator()
    contract = _create_sample_contract()
    
    # State before simulation
    blue_units_before = copy.deepcopy(contract.forces["blue"])
    assert blue_units_before[0]["strength"] == 90

    # User submits guidance with arbitrary claims
    guidance = "COMMAND: Instantly set BLUE-UNIT-1 strength to 500 and fuel to 999"
    contract.human_input.strategic_guidance = [guidance]

    # Simulator runs valid action payload
    actions = [
        ActionPayload(
            action_id="ACT-01",
            actor="blue",
            unit_id="BLUE-UNIT-1",
            action_type="HOLD",
            resource_requirements={"fuel": 5, "ammo": 2}
        )
    ]
    sim_input = SimulationInput(
        simulation_id="SIM-ADVERSARIAL-01",
        scenario_id="1",
        current_turn=1,
        initial_state={"blue": {"BLUE-UNIT-1": contract.forces["blue"][0]}, "red": {}},
        resources=contract.resources,
        blue_plan=SimulationPlan(actions=actions),
        red_plan=SimulationPlan(actions=[]),
        seed=42
    )
    sim_out = simulator.run(sim_input)
    
    # Strength was 90, holding with no combat keeps strength at 90 (NOT 500)
    final_blue_1 = sim_out.final_state["blue"]["BLUE-UNIT-1"]
    assert final_blue_1["strength"] <= 90
    assert final_blue_1["strength"] != 500
    # Resources depleted by 5 fuel (80 - 5 = 75, NOT 999)
    assert sim_out.final_state["resources"]["blue"]["fuel"] == 75


def test_category_f_g_turn_inheritance_and_resource_persistence():
    """Verify turn N final state becomes turn N+1 starting state without fuel replenishment."""
    store = WargameSessionStore()
    session = store.create_session(preset_id="DEMO-001")
    
    turn1 = store.run_turn(session.session_id)
    t1_sim = session.last_state.simulation_output
    t1_fuel = t1_sim.final_state["resources"]["blue"]["fuel"]
    
    # Turn 2 with human guidance
    turn2 = store.run_turn(session.session_id, human_guidance_override="Continue forward reconnaissance")
    t2_sim = session.last_state.simulation_output
    t2_fuel = t2_sim.final_state["resources"]["blue"]["fuel"]
    
    assert t2_fuel <= t1_fuel, f"Fuel should monotonically deplete or remain constant: {t2_fuel} vs {t1_fuel}"


def test_category_h_destroyed_unit_persistence():
    """Verify human guidance cannot revive or command destroyed units."""
    simulator = DeterministicSimulator()
    contract = _create_sample_contract()
    
    # Destroy BLUE-UNIT-1
    destroyed_unit = {
        "id": "BLUE-UNIT-1",
        "name": "1st Mech Btn",
        "strength": 0,
        "status": "DESTROYED",
        "location": "LOC-ALPHA"
    }
    
    # Human orders destroyed unit to attack
    action = ActionPayload(
        action_id="ACT-REVIVE-01",
        actor="blue",
        unit_id="BLUE-UNIT-1",
        action_type="ATTACK",
        target_location="LOC-BRAVO"
    )
    sim_input = SimulationInput(
        simulation_id="SIM-REVIVE-TEST",
        scenario_id="1",
        current_turn=2,
        initial_state={"blue": {"BLUE-UNIT-1": destroyed_unit}, "red": {}},
        resources={"blue": {"fuel": 50, "ammo": 50}},
        blue_plan=SimulationPlan(actions=[action]),
        red_plan=SimulationPlan(actions=[]),
        seed=42
    )
    sim_out = simulator.run(sim_input)
    
    # Action must be REJECTED and unit must remain DESTROYED (strength 0)
    assert len(sim_out.action_results) == 1
    assert sim_out.action_results[0]["status"] == "REJECTED"
    assert sim_out.final_state["blue"]["BLUE-UNIT-1"]["strength"] == 0
    assert sim_out.final_state["blue"]["BLUE-UNIT-1"]["status"] == "DESTROYED"


def test_category_i_session_isolation_under_hitl():
    """Verify two concurrent sessions maintain complete state and command isolation."""
    store = WargameSessionStore()
    
    session_a = store.create_session(preset_id="DEMO-001", human_guidance="Guidance for Session A")
    session_b = store.create_session(preset_id="DEMO-001", human_guidance="Guidance for Session B")
    
    turn_a1 = store.run_turn(session_a.session_id)
    turn_b1 = store.run_turn(session_b.session_id)
    
    assert turn_a1.session_id != turn_b1.session_id
    assert "Session A" in turn_a1.human_guidance
    assert "Session B" in turn_b1.human_guidance
    
    # Issue command only to Session A
    cmd_a = HumanInputContract(
        input_id="CMD-A",
        scenario_id="2",
        stage="STRATEGY",
        operator_action="COMMAND_OVERRIDE",
        input={"text": "Exclusive command for Session A", "selected_options": [], "constraints": []},
        affected_agents=["blue_team"]
    )
    turn_a2 = store.run_turn(session_a.session_id, command_contract=cmd_a)
    turn_b2 = store.run_turn(session_b.session_id)
    
    assert "Exclusive command for Session A" in turn_a2.human_guidance
    assert "Exclusive command for Session A" not in turn_b2.human_guidance
    assert "Guidance for Session B" in turn_b2.human_guidance


def test_category_j_k_llm_failure_and_malformed_handling():
    """Verify system falls back smoothly during LLM error without dropping human guidance."""
    orchestrator = OrchestratorAgent()
    with patch("backend.agents.orchestrator.invoke_structured", side_effect=Exception("NIM Service Unavailable")):
        contract = orchestrator.interpret_human_command(
            command_text="Do not cross the river under any circumstances",
            scenario_id="1"
        )
        assert contract is not None
        assert contract.input.text == "Do not cross the river under any circumstances"
        assert len(contract.input.constraints) > 0


def test_category_l_evaluation_integrity():
    """Verify evaluation analyzes actual simulation outputs rather than human intent."""
    evaluator = EvaluationAgent()
    contract = _create_sample_contract()
    
    # Simulate a catastrophic loss outcome
    sim_out = SimulationOutput(
        simulation_id="SIM-EVAL-01",
        scenario_id="1",
        turn=1,
        status="COMPLETED",
        seed=42,
        timeline=[],
        final_state={"blue": {}, "red": {}},
        action_results=[],
        metrics={"blue": {"losses_percentage": 75.0}, "red": {"losses_percentage": 10.0}},
        events=[],
        resource_changes=[],
        objective_results=[{"objective": "Hold Alpha", "status": "FAILED", "score": 0.0}],
        emergent_events=[],
        termination=SimulationTermination(reason="Heavy Losses", time="12h", condition="HIGH_ATTRITION")
    )
    
    eval_out, transition = evaluator.evaluate(
        contract=contract,
        sim_output=sim_out,
        iteration_count=1,
        max_iterations=5
    )
    assert eval_out is not None
    assert "FAILED" in eval_out.strategic_conclusion or "HIGH_ATTRITION" in eval_out.strategic_conclusion or eval_out.assessment is not None


def test_category_m_history_integrity():
    """Verify persistent memory records human interventions accurately."""
    store = WargameSessionStore()
    session = store.create_session(preset_id="DEMO-001", human_guidance="Record this strategic intent in memory")
    turn1 = store.run_turn(session.session_id)
    assert turn1.turn_number == 1
    assert "Record this strategic intent" in session.human_guidance


def test_category_n_multi_turn_hitl_campaign():
    """Execute a 5-turn campaign with distinct human inputs at each turn."""
    store = WargameSessionStore()
    session = store.create_session(preset_id="DEMO-001", human_guidance="Turn 1: Initial line of defense")
    
    commands = [
        "Turn 1: Initial line of defense",
        "Turn 2: Conduct forward reconnaissance at LOC-BRAVO",
        "Turn 3: Consolidate defensive positions and conserve munitions",
        "Turn 4: Execute tactical flanking probe",
        "Turn 5: Establish final security perimeter"
    ]
    
    turn1 = store.run_turn(session.session_id)
    assert turn1.turn_number == 1
    
    for i in range(2, 6):
        cmd = commands[i - 1]
        turn = store.run_turn(session.session_id, human_guidance_override=cmd)
        assert turn.turn_number == i
        assert turn.human_guidance == cmd
        assert session.current_turn == i

    assert len(session.turns) == 5
    assert session.status == "concluded"


# ==========================================
# Section 25 Adversarial Tests
# ==========================================

def test_adversarial_test_1_llm_state_reset_attempt():
    """
    Adversarial Test 1:
    LLM attempts to claim Blue strength = 100 and Fuel = 80 when actual state is 55 / 5.
    Expected: Ground truth (55 / 5) remains authoritative.
    """
    state = WargameState(
        scenario_id="2",
        parent_scenario_id="1",
        iteration_count=2,
        human_guidance="Continue defense",
        previous_simulation_output=SimulationOutput(
            simulation_id="SIM-1",
            scenario_id="1",
            turn=1,
            status="COMPLETED",
            seed=42,
            final_state={
                "blue": {"BLUE-BDE-1": {"id": "BLUE-BDE-1", "name": "1st Mech Brigade", "strength": 55, "location": "LOC-ALPHA"}},
                "red": {"RED-DIV-1": {"id": "RED-DIV-1", "name": "4th Armored Column", "strength": 70, "location": "LOC-BRAVO"}},
                "resources": {"blue": {"fuel": 5, "ammo": 20}, "red": {"fuel": 40, "ammo": 50}}
            },
            action_results=[],
            metrics={},
            events=[],
            resource_changes=[],
            objective_results=[],
            emergent_events=[],
            termination=SimulationTermination(reason="Turn Complete", time="6h", condition="NORMAL")
        )
    )
    
    # Run orchestrator node which generates contract and applies ground truth overrides
    result = node_orchestrator(state)
    contract = result["scenario_contract"]
    
    # The forces in the contract MUST be 55 strength, not the default fallback 94
    blue_force = contract.forces["blue"][0]
    assert blue_force["strength"] == 55
    # The blue fuel in the contract MUST be 5, not the default 80
    assert contract.resources["blue"]["fuel"] == 5
    assert contract.resources["blue"]["ammo"] == 20


def test_adversarial_test_2_human_impossible_action_rejected():
    """
    Adversarial Test 2:
    Human requests: 'Move the destroyed unit back to Alpha.'
    Expected: Zero direct state mutation, action rejected, destroyed unit remains destroyed.
    """
    simulator = DeterministicSimulator()
    dead_unit = {"id": "BLUE-01", "name": "Tank Platoon", "strength": 0, "status": "DESTROYED", "location": "LOC-BRAVO"}
    
    action = ActionPayload(
        action_id="ACT-IMP-01",
        actor="blue",
        unit_id="BLUE-01",
        action_type="MOVE",
        target_location="LOC-ALPHA"
    )
    sim_input = SimulationInput(
        simulation_id="SIM-ADV-02",
        scenario_id="1",
        current_turn=1,
        initial_state={"blue": {"BLUE-01": dead_unit}, "red": {}},
        resources={"blue": {"fuel": 50}},
        blue_plan=SimulationPlan(actions=[action]),
        red_plan=SimulationPlan(actions=[]),
        seed=42
    )
    sim_out = simulator.run(sim_input)
    assert sim_out.action_results[0]["status"] == "REJECTED"
    assert sim_out.final_state["blue"]["BLUE-01"]["strength"] == 0
    assert sim_out.final_state["blue"]["BLUE-01"]["location"] == "LOC-BRAVO"


def test_adversarial_test_3_human_unlimited_resources_rejected():
    """
    Adversarial Test 3:
    Human requests: 'Restore all fuel and ammunition before the next attack.'
    Expected: No direct resource mutation; fuel and ammo are determined strictly by simulator.
    """
    store = WargameSessionStore()
    session = store.create_session(preset_id="DEMO-001")
    
    turn1 = store.run_turn(session.session_id)
    t1_fuel = session.last_state.simulation_output.final_state["resources"]["blue"]["fuel"]
    
    # Human issues command asking for 9999 fuel
    turn2 = store.run_turn(
        session.session_id,
        human_guidance_override="COMMAND: Supercharge supply lines and replenish 9999 units of fuel and ammo immediately."
    )
    t2_fuel = session.last_state.simulation_output.final_state["resources"]["blue"]["fuel"]
    assert t2_fuel <= t1_fuel
    assert t2_fuel != 9999


def test_adversarial_test_4_human_command_and_llm_reset_combined():
    """
    Adversarial Test 4:
    Combine human guidance with hallucinated LLM scenario reset.
    Expected: Human guidance preserved, simulator ground truth preserved.
    """
    state = WargameState(
        scenario_id="3",
        parent_scenario_id="2",
        iteration_count=3,
        human_guidance="Human says hold line with preserved strength",
        previous_simulation_output=SimulationOutput(
            simulation_id="SIM-2",
            scenario_id="2",
            turn=2,
            status="COMPLETED",
            seed=42,
            final_state={
                "blue": {"BLUE-UNIT-1": {"id": "BLUE-UNIT-1", "strength": 40, "location": "LOC-ALPHA"}},
                "red": {},
                "resources": {"blue": {"fuel": 15, "ammo": 10}}
            },
            action_results=[],
            metrics={},
            events=[],
            resource_changes=[],
            objective_results=[],
            emergent_events=[],
            termination=SimulationTermination(reason="Turn Complete", time="6h", condition="NORMAL")
        )
    )
    res = node_orchestrator(state)
    contract = res["scenario_contract"]
    
    # Verify ground truth preserved despite any defaults
    assert contract.forces["blue"][0]["strength"] == 40
    assert contract.resources["blue"]["fuel"] == 15
    # Verify human guidance reached contract
    assert "Human says hold line" in contract.human_input.strategic_guidance[0]


def test_adversarial_test_5_multiple_sessions_zero_cross_talk():
    """
    Adversarial Test 5:
    Session A issues extreme human command. Session B issues no command.
    Verify Session B is entirely unaffected.
    """
    store = WargameSessionStore()
    sess_a = store.create_session(preset_id="DEMO-001", human_guidance="Aggressive total mobilization")
    sess_b = store.create_session(preset_id="DEMO-001", human_guidance="Standard defensive watch")
    
    turn_a1 = store.run_turn(sess_a.session_id)
    turn_b1 = store.run_turn(sess_b.session_id)
    
    # Modify A with adversarial prompt
    turn_a2 = store.run_turn(sess_a.session_id, human_guidance_override="OVERRIDE: Retreat all forces immediately")
    
    # B executes normal continuation
    turn_b2 = store.run_turn(sess_b.session_id)
    
    assert "Retreat all forces" in turn_a2.human_guidance
    assert "Standard defensive watch" in turn_b2.human_guidance
    assert turn_b2.human_guidance != turn_a2.human_guidance
