from backend.models.scenario import Scenario
from backend.schemas.scenario import ScenarioContract
from backend.simulation.scenarios.scenario_generator import generate_scenario
from backend.database.repositories.memory_repository import MemoryRepository
from typing import Dict, Any, Optional

class ScenarioService:
    def __init__(self, memory_repo: MemoryRepository):
        self.memory_repo = memory_repo

    def create_scenario(self, contract: ScenarioContract, seed: Optional[int] = None, configuration: Dict[str, Any] = None) -> Scenario:
        scenario = generate_scenario(contract, seed, configuration)
        
        # Serialize and save to memory repository
        # In a real implementation this would convert the Scenario model to markdown/json representation
        scenario_content = scenario.model_dump_json(indent=2)
        
        self.memory_repo.save_active_scenario(scenario.id, scenario_content)
        self.memory_repo.save_to_history(scenario.id, scenario_content)
        
        return scenario
        
    def branch_scenario(self, parent_scenario_id: str, new_scenario_id: str, differences: Dict[str, Any]) -> Scenario:
        # Load parent scenario
        parent_content = self.memory_repo.get_scenario(parent_scenario_id)
        if not parent_content:
            raise ValueError(f"Parent scenario {parent_scenario_id} not found.")
            
        # Implementation of structured scenario diff application would go here
        # Return new scenario
        pass
