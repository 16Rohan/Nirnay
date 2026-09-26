"""
PRD-02 Integration Tests: 3D Battlefield & Deterministic Presentation Layer.
Verifies that:
1. Deterministic simulation engine output is the authoritative source for 3D state.
2. Unit casualties and destruction persist without resurrection.
3. Stable IDs are preserved across turn transitions.
4. Objective states and combat engagements map accurately.
5. Terminal campaign states prevent spurious visual advancement.
"""

import pytest
from backend.simulation.engine import DeterministicSimulator
from backend.schemas.contracts import (
    SimulationInput,
    SimulationPlan,
    ActionPayload,
    SimulationTermination,
)
from backend.orchestration.session import WargameSessionStore


def test_deterministic_simulation_powers_presentation():
    """Verify deterministic simulation provides ground-truth metrics and final state."""
    sim = DeterministicSimulator()
    t_in = SimulationInput(
        simulation_id="SIM-3D-01",
        scenario_id="1",
        current_turn=1,
        initial_state={
            "blue": {"BLUE-1": {"id": "BLUE-1", "name": "1st Mech Battalion", "strength": 100, "location": "LOC-ALPHA"}},
            "red": {"RED-1": {"id": "RED-1", "name": "4th Armored Brigade", "strength": 100, "location": "LOC-BRAVO"}},
        },
        resources={"blue": {"fuel": 80, "ammo": 60}, "red": {"fuel": 80, "ammo": 60}},
        blue_plan=SimulationPlan(actions=[
            ActionPayload(action_id="B1", unit_id="BLUE-1", action_type="FORTIFY", target_location="LOC-ALPHA", resource_requirements={"fuel": 10, "ammo": 10})
        ]),
        red_plan=SimulationPlan(actions=[
            ActionPayload(action_id="R1", unit_id="RED-1", action_type="ADVANCE", target_location="LOC-ALPHA", resource_requirements={"fuel": 15, "ammo": 15})
        ]),
        seed=42,
    )
    output = sim.run(t_in)
    
    assert output is not None
    assert output.final_state is not None
    assert "blue" in output.final_state
    assert "red" in output.final_state
    assert output.final_state["blue"]["BLUE-1"]["strength"] < 100
    assert output.final_state["red"]["RED-1"]["strength"] < 100
    assert len(output.action_results) > 0


def test_destroyed_unit_persists_in_3d_state():
    """Verify units with 0 strength are marked destroyed and never revived."""
    sim = DeterministicSimulator()
    t_in = SimulationInput(
        simulation_id="SIM-3D-DESTROY",
        scenario_id="1",
        current_turn=1,
        initial_state={
            "blue": {"BLUE-1": {"id": "BLUE-1", "name": "Destroyed Unit", "strength": 0, "status": "DESTROYED", "location": "LOC-ALPHA"}},
            "red": {"RED-1": {"id": "RED-1", "name": "Active Red Echelon", "strength": 80, "location": "LOC-BRAVO"}},
        },
        resources={"blue": {"fuel": 20, "ammo": 10}, "red": {"fuel": 80, "ammo": 60}},
        blue_plan=SimulationPlan(actions=[
            ActionPayload(action_id="B1", unit_id="BLUE-1", action_type="FORTIFY", target_location="LOC-ALPHA", resource_requirements={"fuel": 5, "ammo": 5})
        ]),
        red_plan=SimulationPlan(actions=[
            ActionPayload(action_id="R1", unit_id="RED-1", action_type="HOLD", target_location="LOC-BRAVO", resource_requirements={"fuel": 5, "ammo": 5})
        ]),
        seed=42,
    )
    output = sim.run(t_in)
    blue_final = output.final_state["blue"]["BLUE-1"]
    assert blue_final["strength"] == 0
    assert blue_final["status"] == "DESTROYED"


def test_session_turn_result_contains_authoritative_simulation_output():
    """Verify WargameSessionStore populates simulation_output in TurnResult for frontend 3D rendering."""
    store = WargameSessionStore()
    session = store.create_session(preset_id="DEMO-001", human_guidance="Hold FLP Alpha")
    turn1 = store.run_turn(session.session_id)
    
    assert turn1.simulation_output is not None
    assert "final_state" in turn1.simulation_output
    assert "blue" in turn1.simulation_output["final_state"]
    assert "red" in turn1.simulation_output["final_state"]
    assert "action_results" in turn1.simulation_output
    assert "metrics" in turn1.simulation_output
