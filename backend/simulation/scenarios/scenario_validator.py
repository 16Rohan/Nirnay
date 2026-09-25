"""
Deterministic Scenario Validator.
Enforces hard constraints, schema compliance, and boundary invariants.
The Orchestrator is never permitted to bypass validation or violate hard constraints.
"""

from typing import Tuple, List
from backend.schemas.contracts import ScenarioContract, HardConstraint


class ScenarioValidationError(Exception):
    pass


class ScenarioValidator:
    def __init__(self):
        pass

    def validate(self, contract: ScenarioContract) -> Tuple[bool, List[str]]:
        """
        Deterministically validates the scenario contract.
        Returns (is_valid, list_of_violations).
        """
        violations: List[str] = []

        # 1. Mandatory Identity & Metadata
        if not contract.scenario_id or not contract.scenario_id.strip():
            violations.append("CONTRACT_REJECTED: Missing mandatory scenario_id.")

        # 2. Hard Constraints Enforcement
        # PRD Invariant 7: Hard constraints cannot be overridden by Dynamic
        for hc in contract.constraints.hard:
            hc_desc = ""
            if isinstance(hc, HardConstraint):
                hc_desc = hc.description
            elif isinstance(hc, dict):
                hc_desc = hc.get("description", "")
            else:
                hc_desc = str(hc)

            # Check if Dynamic attempts to override or bypass
            if "override_constraints" in contract.dynamic or "bypass_hard_constraints" in contract.dynamic:
                violations.append("CONTRACT_REJECTED: Dynamic section attempted to override hard constraints.")

        # 3. Resource Validity
        for side in ["blue", "red"]:
            res_dict = contract.resources.get(side, {})
            for res_name, val in res_dict.items():
                if isinstance(val, (int, float)) and val < 0:
                    violations.append(f"CONTRACT_REJECTED: Negative resource '{res_name}' for side {side}: {val}")

        # 4. Forces non-emptiness check
        blue_forces = contract.forces.get("blue", [])
        red_forces = contract.forces.get("red", [])
        if not blue_forces:
            violations.append("CONTRACT_REJECTED: Blue forces cannot be empty.")
        if not red_forces:
            violations.append("CONTRACT_REJECTED: Red forces cannot be empty.")

        # 5. Geographical Boundary check
        ao = contract.geography.area_of_operations
        bounds = ao.get("bounds")
        if bounds and len(bounds) == 4:
            lat_min, lon_min, lat_max, lon_max = bounds
            if lat_min >= lat_max or lon_min >= lon_max:
                violations.append(f"CONTRACT_REJECTED: Invalid area_of_operations bounds: {bounds}")

        is_valid = len(violations) == 0
        return is_valid, violations
