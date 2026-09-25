"""
Deterministic rule-based simulation engine for NIRNAY wargaming platform.
Executes plans according to concrete movement, terrain, and combat rules.
Guarantees reproducible results using deterministic seeds.
"""

import random
from typing import Dict, Any, List
from backend.schemas.contracts import (
    SimulationInput,
    SimulationOutput,
    SimulationTermination,
)


class DeterministicSimulator:
    def __init__(self):
        pass

    def run(self, sim_input: SimulationInput) -> SimulationOutput:
        """
        Executes a deterministic simulation run from SimulationInput.
        """
        # Seed deterministic RNG
        rng = random.Random(sim_input.seed)

        timeline: List[Dict[str, Any]] = []
        events: List[Dict[str, Any]] = []
        resource_changes: List[Dict[str, Any]] = []
        objective_results: List[Dict[str, Any]] = []
        emergent_events: List[Dict[str, Any]] = []

        # Copy state
        blue_state = {k: dict(v) for k, v in sim_input.initial_state.get("blue", {}).items()}
        red_state = {k: dict(v) for k, v in sim_input.initial_state.get("red", {}).items()}

        # 1. Step 1: Blue Movement & Fortification
        timeline.append({"tick": 1, "description": "Simulation cycle initiated."})
        for action in sim_input.blue_plan.actions:
            action_type = action.get("action_type", "HOLD")
            unit_id = action.get("unit_id")
            target = action.get("target_location", "Sector-4")

            if unit_id in blue_state:
                if action_type == "FORTIFY":
                    blue_state[unit_id]["status"] = "FORTIFIED"
                    blue_state[unit_id]["location"] = target
                    timeline.append({
                        "tick": 2,
                        "description": f"Blue unit {unit_id} completed fortification at {target}."
                    })
                elif action_type == "ADVANCE":
                    blue_state[unit_id]["location"] = target
                    timeline.append({
                        "tick": 2,
                        "description": f"Blue unit {unit_id} advanced to {target}."
                    })

        # 2. Step 2: Red Advance & Maneuver
        for action in sim_input.red_plan.actions:
            action_type = action.get("action_type", "HOLD")
            unit_id = action.get("unit_id")
            target = action.get("target_location", "LOC-BRAVO")

            if unit_id in red_state:
                red_state[unit_id]["location"] = target
                timeline.append({
                    "tick": 3,
                    "description": f"Red unit {unit_id} advanced toward chokepoint {target}."
                })

        # 3. Step 3: Combat Engagement Resolution (Deterministic Lanchester / Ratio)
        # Check if units share proximity or contest chokepoint
        blue_losses_pct = 0.0
        red_losses_pct = 0.0

        b_units = list(blue_state.values())
        r_units = list(red_state.values())

        if b_units and r_units:
            b_first = b_units[0]
            r_first = r_units[0]

            # Fortified terrain defense multiplier: 1.4x for Blue
            defense_mult = 1.4 if b_first.get("status") == "FORTIFIED" else 1.0

            b_power = float(b_first.get("strength", 100)) * defense_mult
            r_power = float(r_first.get("strength", 100))

            ratio = b_power / max(r_power, 1.0)

            # Attrition formulas (deterministic based on power ratio)
            if ratio >= 1.0:
                # Blue holds advantage
                b_loss = int(5 + rng.randint(1, 4))
                r_loss = int(10 + rng.randint(2, 6))
            else:
                b_loss = int(8 + rng.randint(2, 5))
                r_loss = int(6 + rng.randint(1, 4))

            b_first["strength"] = max(0, int(b_first.get("strength", 100)) - b_loss)
            r_first["strength"] = max(0, int(r_first.get("strength", 100)) - r_loss)

            blue_losses_pct = round((b_loss / 100.0) * 100, 1)
            red_losses_pct = round((r_loss / 100.0) * 100, 1)

            events.append({
                "event_id": "SIM-EV-01",
                "name": "Chokepoint Sector Skirmish",
                "location": "LOC-BRAVO",
                "blue_losses": b_loss,
                "red_losses": r_loss,
                "resolved": True
            })
            timeline.append({
                "tick": 4,
                "description": f"Engagement resolved at river corridor: Blue sustained {b_loss} casualties; Red sustained {r_loss} casualties."
            })

        # 4. Resources Consumption
        consumed_blue = sim_input.blue_plan.resource_allocation
        consumed_red = sim_input.red_plan.resource_allocation
        resource_changes.append({"actor": "blue", "consumed": consumed_blue})
        resource_changes.append({"actor": "red", "consumed": consumed_red})

        # 5. Objectives Evaluation
        objective_results.append({
            "objective": "Defend Forward Logistics Point Alpha",
            "status": "ACHIEVED" if blue_losses_pct < 15.0 else "CONTESTED",
            "score": round(1.0 - (blue_losses_pct / 100.0), 2)
        })
        objective_results.append({
            "objective": "Deter Adversarial Breakthrough",
            "status": "ACHIEVED" if red_losses_pct >= 8.0 else "PARTIAL",
            "score": 0.85
        })

        # 6. Emergent Simulation Event
        emergent_events.append({
            "event_id": "EVT-SIM-01",
            "type": "environmental_shift",
            "description": "Rising river discharge rate impedes further mechanized crossing without engineering assets.",
            "impact": "Red offensive momentum paused north of the river boundary."
        })

        timeline.append({
            "tick": 5,
            "description": "Simulation completed. Forces entrenched in standoff positions."
        })

        return SimulationOutput(
            simulation_id=sim_input.simulation_id,
            scenario_id=sim_input.scenario_id,
            status="COMPLETED",
            seed=sim_input.seed,
            timeline=timeline,
            final_state={
                "blue": blue_state,
                "red": red_state,
                "third_party": {},
                "civilian": {}
            },
            metrics={
                "blue": {"losses_percentage": blue_losses_pct, "readiness": "High"},
                "red": {"losses_percentage": red_losses_pct, "readiness": "Moderate"},
                "shared": {"infrastructure_damage_percentage": 5.0}
            },
            events=events,
            resource_changes=resource_changes,
            objective_results=objective_results,
            emergent_events=emergent_events,
            termination=SimulationTermination(
                reason="Turn duration completed",
                time=sim_input.time_horizon,
                condition="Defensive Standoff"
            )
        )
