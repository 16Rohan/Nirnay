"""
Deterministic Scenario Generator.
Materializes the validated ScenarioContract into concrete runtime simulation entities.
Given the same contract and seed, it deterministically produces identical initial states.
"""

import re
from typing import Dict, Any
from backend.schemas.contracts import ScenarioContract, SimulationInput, SimulationPlan


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

    def materialize(self, contract: ScenarioContract, seed: int = 42) -> Dict[str, Any]:
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
