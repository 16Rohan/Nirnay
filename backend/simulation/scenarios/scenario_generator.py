"""
Deterministic Scenario Generator.
Supports both:
1. Multi-Agent Wargaming Pipeline entity materialization (ScenarioGenerator)
2. Domain WorldState Model scenario generation (generate_scenario)
"""

import re
import random
from typing import Dict, Any, Optional
from datetime import datetime

from backend.models.scenario import Scenario, WorldState, WorldStateDomain, ScenarioMetadata
from backend.schemas.scenario import ScenarioContract as ModelScenarioContract
from backend.schemas.contracts import ScenarioContract as AgentScenarioContract, SimulationInput, SimulationPlan


def _parse_strength(val: Any, default: float = 100.0) -> float:
    """Safely extracts a numeric float from numbers or strings like '2 battalions' or '94%'."""
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        match = re.search(r"[-+]?\d*\.?\d+", val)
        if match:
            return float(match.group())
    return default


class ScenarioGenerator:
    def __init__(self):
        pass

    def materialize(self, contract: AgentScenarioContract, seed: int = 42) -> Dict[str, Any]:
        """
        Converts contract into concrete simulation entity state.
        """
        initial_blue = {}
        for idx, unit in enumerate(contract.forces.get("blue", [])):
            uid = unit.get("id", f"BLUE-UNIT-{idx+1}")
            strength_val = _parse_strength(unit.get("strength"), 100.0)
            initial_blue[uid] = {
                "id": uid,
                "name": unit.get("name", uid),
                "type": unit.get("type", "Mechanized Infantry"),
                "strength": strength_val,
                "max_strength": strength_val,
                "location": unit.get("location", "Sector-4"),
                "status": "READY"
            }

        initial_red = {}
        for idx, unit in enumerate(contract.forces.get("red", [])):
            uid = unit.get("id", f"RED-UNIT-{idx+1}")
            strength_val = _parse_strength(unit.get("strength"), 100.0)
            initial_red[uid] = {
                "id": uid,
                "name": unit.get("name", uid),
                "type": unit.get("type", "Armored Column"),
                "strength": strength_val,
                "max_strength": strength_val,
                "location": unit.get("location", "Sector-1"),
                "status": "READY"
            }

        sim_state = {
            "scenario_id": contract.scenario_id,
            "seed": seed,
            "blue_forces": initial_blue,
            "red_forces": initial_red,
            "resources": {
                "blue": dict(contract.resources.get("blue", {})),
                "red": dict(contract.resources.get("red", {})),
                "shared": dict(contract.resources.get("shared", {}))
            },
            "environment": {
                "weather": contract.environment.weather,
                "terrain": contract.geography.terrain,
                "visibility_km": contract.environment.visibility.get("range_km", 8.0)
            },
            "rules": {
                "rules_of_engagement": list(contract.rules.rules_of_engagement),
                "engagement_rules": list(contract.rules.engagement_rules),
                "movement_rules": list(contract.rules.movement_rules)
            }
        }
        return sim_state


def generate_scenario(contract: ModelScenarioContract, seed: Optional[int] = None, configuration: Dict[str, Any] = None) -> Scenario:
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
