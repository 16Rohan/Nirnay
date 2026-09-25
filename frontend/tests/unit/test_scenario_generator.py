import pytest
from backend.models.scenario import Scenario, WorldState
from backend.schemas.scenario import ScenarioContract
from backend.simulation.scenarios.scenario_generator import generate_scenario

def test_generate_scenario_deterministic():
    contract = ScenarioContract(
        scenario_id="1.1",
        mission="Test",
        environment={"political": {"status": 0.8}}
    )
    
    s1 = generate_scenario(contract, seed=42)
    s2 = generate_scenario(contract, seed=42)
    
    assert s1.metadata.seed == s2.metadata.seed
    assert s1.world_state.political.status == s2.world_state.political.status
