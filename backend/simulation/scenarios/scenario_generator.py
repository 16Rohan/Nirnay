import random
from typing import Dict, Any, Optional
from datetime import datetime
from backend.models.scenario import Scenario, WorldState, WorldStateDomain, ScenarioMetadata
from backend.schemas.scenario import ScenarioContract

def generate_scenario(contract: ScenarioContract, seed: Optional[int] = None, configuration: Dict[str, Any] = None) -> Scenario:
    if seed is not None:
        random.seed(seed)
    else:
        seed = random.randint(0, 1000000)
        random.seed(seed)
        
    config = configuration or {}
    
    # Deterministic generation logic
    # Initialize domains to 1.0 (perfect status) unless specified in contract
    def init_domain(domain_name: str) -> WorldStateDomain:
        status = contract.environment.get(domain_name, {}).get("status", 1.0)
        return WorldStateDomain(
            status=status,
            changes=[],
            confidence=1.0,
            relevant_events=[],
            source="generator",
            timestamp=datetime.utcnow()
        )
        
    world_state = WorldState(
        political=init_domain("political"),
        diplomatic=init_domain("diplomatic"),
        military=init_domain("military"),
        economic=init_domain("economic"),
        geographic=init_domain("geographic"),
        humanitarian=init_domain("humanitarian"),
        infrastructure=init_domain("infrastructure"),
        information=init_domain("information"),
        environmental=init_domain("environmental"),
        scenario_id=contract.scenario_id,
        parent_scenario_id=contract.parent_scenario,
        version=1,
        timestamp=datetime.utcnow(),
        assumptions=[],
        constraints=contract.constraints,
        objectives=contract.objectives,
        blue_state=contract.blue_state,
        red_state=contract.red_state,
        outstanding_issues=contract.outstanding_issues,
        active_events=[e.get("id") for e in contract.events if "id" in e]
    )
    
    lineage = []
    if contract.parent_scenario:
        # In a real implementation, we would load the parent scenario and append to its lineage
        lineage = [contract.parent_scenario]
    lineage.append(contract.scenario_id)
    
    metadata = ScenarioMetadata(
        created_at=datetime.utcnow(),
        seed=seed,
        configuration=config
    )
    
    scenario = Scenario(
        id=contract.scenario_id,
        parent_id=contract.parent_scenario,
        lineage=lineage,
        world_state=world_state,
        metadata=metadata
    )
    
    return scenario
