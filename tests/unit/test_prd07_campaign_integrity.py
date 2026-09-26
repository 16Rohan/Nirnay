import pytest
import asyncio
from backend.simulation.engine import DeterministicSimulator
from backend.schemas.contracts import SimulationInput, SimulationPlan, ScenarioContract, SimulationOutput
from backend.api.routes.wargame import start_wargame, continue_wargame
from backend.api.models.wargame import ScenarioStartRequest, TurnContinueRequest
from backend.agents.evaluation import EvaluationAgent
from backend.orchestration.session import session_store

def test_terminal_state_correctness_and_zero_attrition():
    # A & B: Alive forces with 0% attrition -> not MUTUAL_DESTRUCTION
    simulator = DeterministicSimulator()
    sim_input = SimulationInput(
        simulation_id="test", scenario_id="test",
        initial_state={"blue": {"b1": {"id": "b1", "strength": 100.0}}, "red": {"r1": {"id": "r1", "strength": 100.0}}},
        blue_plan=SimulationPlan(actions=[]), red_plan=SimulationPlan(actions=[])
    )
    sim_out = simulator.run(sim_input)
    assert sim_out.terminal is False
    assert sim_out.termination.condition != "MUTUAL_DESTRUCTION"
    assert sim_out.metrics["blue"]["losses_percentage"] == 0.0
    assert sim_out.metrics["red"]["losses_percentage"] == 0.0

def test_invalid_unit_id():
    # C: Invalid unit ID -> REJECTED, no mutation, no termination
    simulator = DeterministicSimulator()
    sim_input = SimulationInput(
        simulation_id="test", scenario_id="test",
        initial_state={"blue": {"b1": {"id": "b1", "strength": 100.0}}, "red": {"r1": {"id": "r1", "strength": 100.0}}},
        blue_plan=SimulationPlan(actions=[{"action_id": "a1", "action_type": "HOLD", "unit_id": "INVALID_ID"}]),
        red_plan=SimulationPlan(actions=[])
    )
    sim_out = simulator.run(sim_input)
    assert any(a["status"] == "REJECTED" for a in sim_out.action_results)
    assert sim_out.terminal is False
    assert sim_out.metrics["blue"]["losses_percentage"] == 0.0

def test_genuine_mutual_destruction():
    # F: Genuine mutual destruction -> terminal
    simulator = DeterministicSimulator()
    sim_input = SimulationInput(
        simulation_id="test", scenario_id="test",
        initial_state={"blue": {"b1": {"id": "b1", "strength": 100.0}}, "red": {"r1": {"id": "r1", "strength": 100.0}}},
        blue_plan=SimulationPlan(actions=[]), red_plan=SimulationPlan(actions=[]),
        special_events=[{"event_type": "THIRD_PARTY_CATASTROPHIC_EVENT"}]
    )
    sim_out = simulator.run(sim_input)
    assert sim_out.terminal is True
    assert sim_out.termination.condition == "MUTUAL_DESTRUCTION"

def test_evaluation_integrity():
    # E: Evaluation cannot invent termination if simulator says false
    evaluator = EvaluationAgent()
    sim_out = SimulationOutput(
        simulation_id="test", scenario_id="test", turn=1, status="COMPLETED",
        termination={"reason": "Turn ended", "time": "24h", "condition": "Defensive Standoff", "terminal": False},
        terminal=False
    )
    contract = ScenarioContract(scenario_id="test")
    eval_out, transition = evaluator.evaluate(contract, sim_out, iteration_count=1, max_iterations=5)
    assert eval_out.simulation_control.concluded is False

def test_evaluation_max_turns():
    # K: Maximum turn termination
    evaluator = EvaluationAgent()
    sim_out = SimulationOutput(
        simulation_id="test", scenario_id="test", turn=5, status="COMPLETED",
        termination={"reason": "Turn ended", "time": "24h", "condition": "Defensive Standoff", "terminal": False},
        terminal=False
    )
    contract = ScenarioContract(scenario_id="test")
    eval_out, transition = evaluator.evaluate(contract, sim_out, iteration_count=5, max_iterations=5)
    assert eval_out.simulation_control.concluded is True
