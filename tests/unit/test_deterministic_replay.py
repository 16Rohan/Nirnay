"""
Unit tests verifying deterministic replay and state-transition pipeline behavior for NIRNAY simulator (PRD-03).
Ensures:
1. Identical seeds and initial contracts produce 100% bit-exact simulation outcomes.
2. Action validation correctly executes valid actions and rejects invalid or under-resourced actions.
3. Multi-turn state inheritance strictly decrements resources and preserves unit state.
"""

from backend.simulation.engine import DeterministicSimulator
from backend.schemas.contracts import SimulationInput, SimulationPlan, ActionPayload


def test_deterministic_simulation_replay():
    simulator = DeterministicSimulator()

    sim_input = SimulationInput(
        simulation_id="SIM-TEST-REPLAY",
        scenario_id="1",
        current_turn=1,
        initial_state={
            "blue": {
                "BLUE-1": {"id": "BLUE-1", "type": "Mechanized", "strength": 94, "location": "LOC-ALPHA"}
            },
            "red": {
                "RED-1": {"id": "RED-1", "type": "Armored", "strength": 108, "location": "LOC-BRAVO"}
            }
        },
        resources={
            "blue": {"fuel": 80, "ammo": 85},
            "red": {"fuel": 115, "ammo": 90}
        },
        environment={"weather": {"condition": "Rain"}, "visibility_km": 6.5, "mobility": {"tracked": 0.8}},
        blue_plan=SimulationPlan(
            course_of_action_id="COA-DEFEND",
            actions=[{"action_id": "A1", "unit_id": "BLUE-1", "action_type": "FORTIFY", "target_location": "LOC-ALPHA", "resource_requirements": {"fuel": 15, "ammo": 10}}],
            resource_allocation={"fuel": 15, "ammo": 10}
        ),
        red_plan=SimulationPlan(
            response_id="RESP-ADVANCE",
            actions=[{"action_id": "A2", "unit_id": "RED-1", "action_type": "ADVANCE", "target_location": "LOC-BRAVO", "resource_requirements": {"fuel": 25, "ammo": 20}}],
            resource_allocation={"fuel": 25, "ammo": 20}
        ),
        rules={"rules": ["Defender terrain bonus +15%"]},
        time_horizon="24h",
        seed=42
    )

    out1 = simulator.run(sim_input)
    out2 = simulator.run(sim_input)

    # Verify deterministic replay invariants
    assert out1.status == out2.status
    assert out1.metrics == out2.metrics
    assert out1.objective_results == out2.objective_results
    assert out1.termination.condition == out2.termination.condition
    assert len(out1.events) == len(out2.events)
    for e1, e2 in zip(out1.events, out2.events):
        assert e1 == e2


def test_action_validation_success_and_failure():
    simulator = DeterministicSimulator()

    # Case 1: Non-existent unit action should fail validation
    sim_input_invalid_unit = SimulationInput(
        simulation_id="SIM-TEST-VAL-1",
        scenario_id="1",
        current_turn=1,
        initial_state={
            "blue": {
                "BLUE-1": {"id": "BLUE-1", "type": "Mechanized", "strength": 94, "location": "LOC-ALPHA"}
            },
            "red": {
                "RED-1": {"id": "RED-1", "type": "Armored", "strength": 108, "location": "LOC-BRAVO"}
            }
        },
        resources={"blue": {"fuel": 80, "ammo": 85}, "red": {"fuel": 100, "ammo": 100}},
        blue_plan=SimulationPlan(
            actions=[
                ActionPayload(
                    action_id="ACT-INVALID",
                    actor="blue",
                    unit_id="BLUE-NONEXISTENT",
                    action_type="FORTIFY",
                    target_location="LOC-ALPHA"
                )
            ]
        ),
        red_plan=SimulationPlan(actions=[]),
        seed=42
    )
    out_invalid = simulator.run(sim_input_invalid_unit)
    rejected_action = next(a for a in out_invalid.action_results if a["action_id"] == "ACT-INVALID")
    assert rejected_action["status"] == "REJECTED"
    assert "not found" in rejected_action["reason"]

    # Case 2: Insufficient resources should fail validation
    sim_input_low_resources = SimulationInput(
        simulation_id="SIM-TEST-VAL-2",
        scenario_id="1",
        current_turn=1,
        initial_state={
            "blue": {
                "BLUE-1": {"id": "BLUE-1", "type": "Mechanized", "strength": 94, "location": "LOC-ALPHA"}
            },
            "red": {
                "RED-1": {"id": "RED-1", "type": "Armored", "strength": 108, "location": "LOC-BRAVO"}
            }
        },
        resources={"blue": {"fuel": 5, "ammo": 5}, "red": {"fuel": 100, "ammo": 100}},
        blue_plan=SimulationPlan(
            actions=[
                ActionPayload(
                    action_id="ACT-EXPENSIVE",
                    actor="blue",
                    unit_id="BLUE-1",
                    action_type="ADVANCE",
                    target_location="LOC-BRAVO",
                    resource_requirements={"fuel": 50, "ammo": 30}
                )
            ]
        ),
        red_plan=SimulationPlan(actions=[]),
        seed=42
    )
    out_low_res = simulator.run(sim_input_low_resources)
    rejected_res = next(a for a in out_low_res.action_results if a["action_id"] == "ACT-EXPENSIVE")
    assert rejected_res["status"] == "REJECTED"
    assert "Insufficient" in rejected_res["reason"]


def test_multi_turn_state_and_resource_persistence():
    simulator = DeterministicSimulator()

    # --- TURN 1 ---
    t1_input = SimulationInput(
        simulation_id="SIM-TURN-1",
        scenario_id="1",
        current_turn=1,
        initial_state={
            "blue": {
                "BLUE-1": {"id": "BLUE-1", "type": "Mechanized", "strength": 100, "location": "LOC-ALPHA", "status": "READY"}
            },
            "red": {
                "RED-1": {"id": "RED-1", "type": "Armored", "strength": 100, "location": "LOC-BRAVO", "status": "READY"}
            }
        },
        resources={
            "blue": {"fuel": 80, "ammo": 85},
            "red": {"fuel": 115, "ammo": 90}
        },
        blue_plan=SimulationPlan(
            actions=[
                ActionPayload(
                    action_id="ACT-T1-B",
                    actor="blue",
                    unit_id="BLUE-1",
                    action_type="FORTIFY",
                    target_location="LOC-ALPHA",
                    resource_requirements={"fuel": 15, "ammo": 10}
                )
            ]
        ),
        red_plan=SimulationPlan(
            actions=[
                ActionPayload(
                    action_id="ACT-T1-R",
                    actor="red",
                    unit_id="RED-1",
                    action_type="ADVANCE",
                    target_location="LOC-BRAVO",
                    resource_requirements={"fuel": 25, "ammo": 20}
                )
            ]
        ),
        seed=42
    )

    t1_output = simulator.run(t1_input)
    assert t1_output.turn == 1
    t1_blue_fuel = t1_output.final_state["resources"]["blue"]["fuel"]
    t1_blue_strength = t1_output.final_state["blue"]["BLUE-1"]["strength"]
    assert t1_blue_fuel == 65  # 80 - 15
    assert t1_blue_strength < 100  # sustained skirmish casualties

    # --- TURN 2 (Inheriting Turn 1 final state) ---
    t2_input = SimulationInput(
        simulation_id="SIM-TURN-2",
        scenario_id="2",
        current_turn=2,
        initial_state={
            "blue": t1_output.final_state["blue"],
            "red": t1_output.final_state["red"]
        },
        resources=t1_output.final_state["resources"],
        blue_plan=SimulationPlan(
            actions=[
                ActionPayload(
                    action_id="ACT-T2-B",
                    actor="blue",
                    unit_id="BLUE-1",
                    action_type="RECON",
                    target_location="LOC-BRAVO",
                    resource_requirements={"fuel": 15, "ammo": 5}
                )
            ]
        ),
        red_plan=SimulationPlan(
            actions=[
                ActionPayload(
                    action_id="ACT-T2-R",
                    actor="red",
                    unit_id="RED-1",
                    action_type="STRIKE",
                    target_location="LOC-ALPHA",
                    resource_requirements={"fuel": 20, "ammo": 25}
                )
            ]
        ),
        seed=42
    )

    t2_output = simulator.run(t2_input)
    assert t2_output.turn == 2
    t2_blue_fuel = t2_output.final_state["resources"]["blue"]["fuel"]
    t2_blue_strength = t2_output.final_state["blue"]["BLUE-1"]["strength"]

    # Invariant: Turn 2 resources < Turn 1 resources
    assert t2_blue_fuel < t1_blue_fuel
    assert t2_blue_fuel == 50  # 65 - 15
    assert t2_blue_strength <= t1_blue_strength
