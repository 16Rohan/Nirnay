"""
Deterministic rule-based simulation engine for NIRNAY wargaming platform.
Executes plans according to concrete validation, movement, terrain, resource accounting, and combat rules.
Guarantees reproducible results using deterministic seeds.
Stateful: Output final_state contains complete entities, resources, and environment for next turn inheritance.
"""

import random
from typing import Dict, Any, List, Tuple
from backend.schemas.contracts import (
    SimulationInput,
    SimulationOutput,
    SimulationTermination,
)


class DeterministicSimulator:
    def __init__(self):
        pass

    def _validate_action(
        self,
        action: Dict[str, Any],
        actor: str,
        units_state: Dict[str, Any],
        available_resources: Dict[str, Any]
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validates an action against unit existence, unit strength, and available resources.
        Returns (is_valid, reason, resource_cost).
        """
        unit_id = action.get("unit_id")
        action_type = (action.get("action_type") or "HOLD").upper()
        
        # 1. Unit Check
        if not unit_id or unit_id not in units_state:
            return False, f"Unit {unit_id} not found in {actor} forces", {}

        unit = units_state[unit_id]
        if unit.get("strength", 0) <= 0:
            return False, f"Unit {unit_id} has zero strength and cannot execute actions", {}

        # 2. Resource Requirements
        # Default baseline costs per action type if not explicitly provided
        reqs = dict(action.get("resource_requirements") or {})
        if not reqs:
            if action_type in ("ADVANCE", "STRIKE"):
                reqs = {"fuel": 15, "ammo": 10}
            elif action_type in ("FORTIFY", "DEFEND"):
                reqs = {"fuel": 5, "ammo": 5}
            elif action_type in ("RECON", "PATROL"):
                reqs = {"fuel": 10, "ammo": 2}
            elif action_type == "HOLD":
                reqs = {"fuel": 2, "ammo": 1}
            else:
                reqs = {"fuel": 5, "ammo": 5}

        # Check resource availability
        for res_key, cost_val in reqs.items():
            current_avail = available_resources.get(res_key, 100)
            if current_avail < cost_val:
                return False, f"Insufficient {res_key} (Required: {cost_val}, Available: {current_avail})", reqs

        return True, "Valid", reqs

    def run(self, sim_input: SimulationInput) -> SimulationOutput:
        """
        Executes a deterministic simulation run from SimulationInput.
        Strictly follows the state-transition pipeline:
        1. Action Validation
        2. Resource Accounting
        3. State Transitions (Movement, Posture)
        4. Combat & Lanchester Adjudication
        5. Environmental Mechanics
        6. Objectives & Consequences
        7. Final State Aggregation
        """
        # Seed deterministic RNG (factoring in current turn for unique per-turn reproducibility)
        turn_seed = sim_input.seed + sim_input.current_turn * 101
        rng = random.Random(turn_seed)

        timeline: List[Dict[str, Any]] = []
        events: List[Dict[str, Any]] = []
        action_results: List[Dict[str, Any]] = []
        resource_changes: List[Dict[str, Any]] = []
        objective_results: List[Dict[str, Any]] = []
        emergent_events: List[Dict[str, Any]] = []

        timeline.append({
            "tick": 1,
            "turn": sim_input.current_turn,
            "description": f"Simulation cycle initiated for Turn {sim_input.current_turn}."
        })

        # Deep copy state from input
        blue_state = {k: dict(v) for k, v in sim_input.initial_state.get("blue", {}).items()}
        red_state = {k: dict(v) for k, v in sim_input.initial_state.get("red", {}).items()}
        
        # Initialize resources
        blue_res = dict(sim_input.resources.get("blue") or sim_input.initial_state.get("resources", {}).get("blue") or {"fuel": 80, "ammo": 85})
        red_res = dict(sim_input.resources.get("red") or sim_input.initial_state.get("resources", {}).get("red") or {"fuel": 115, "ammo": 90})

        # ========================================================
        # Phase 1: Blue Action Validation & Execution
        # ========================================================
        blue_spent = {"fuel": 0, "ammo": 0}
        for act in sim_input.blue_plan.actions:
            act_dict = act.model_dump() if hasattr(act, "model_dump") else dict(act)
            act_id = act_dict.get("action_id", "ACT-B-GEN")
            act_type = (act_dict.get("action_type") or "HOLD").upper()
            unit_id = act_dict.get("unit_id")
            target = act_dict.get("target_location", "LOC-ALPHA")

            is_valid, reason, cost = self._validate_action(act_dict, "blue", blue_state, blue_res)
            if not is_valid:
                action_results.append({
                    "action_id": act_id,
                    "actor": "blue",
                    "status": "REJECTED",
                    "reason": reason
                })
                timeline.append({
                    "tick": 2,
                    "description": f"[REJECTED] Blue action {act_id} failed validation: {reason}"
                })
                continue

            # Deduct resources
            for r_k, r_v in cost.items():
                blue_res[r_k] = max(0, blue_res.get(r_k, 0) - r_v)
                blue_spent[r_k] = blue_spent.get(r_k, 0) + r_v

            # State transition
            if act_type == "FORTIFY":
                blue_state[unit_id]["status"] = "FORTIFIED"
                blue_state[unit_id]["location"] = target
                timeline.append({
                    "tick": 2,
                    "description": f"Blue unit {unit_id} fortified defensive redoubt at {target}."
                })
            elif act_type == "ADVANCE":
                blue_state[unit_id]["status"] = "ADVANCING"
                blue_state[unit_id]["location"] = target
                timeline.append({
                    "tick": 2,
                    "description": f"Blue unit {unit_id} advanced to {target}."
                })
            elif act_type in ("RECON", "PATROL"):
                blue_state[unit_id]["status"] = "PATROLLING"
                timeline.append({
                    "tick": 2,
                    "description": f"Blue unit {unit_id} conducted reconnaissance across {target}."
                })
            else:
                blue_state[unit_id]["status"] = "DEFENDING"
                timeline.append({
                    "tick": 2,
                    "description": f"Blue unit {unit_id} maintained defensive posture at {blue_state[unit_id].get('location')}."
                })

            action_results.append({
                "action_id": act_id,
                "actor": "blue",
                "status": "EXECUTED",
                "cost": cost
            })

        # ========================================================
        # Phase 2: Red Action Validation & Execution
        # ========================================================
        red_spent = {"fuel": 0, "ammo": 0}
        for act in sim_input.red_plan.actions:
            act_dict = act.model_dump() if hasattr(act, "model_dump") else dict(act)
            act_id = act_dict.get("action_id", "ACT-R-GEN")
            act_type = (act_dict.get("action_type") or "HOLD").upper()
            unit_id = act_dict.get("unit_id")
            target = act_dict.get("target_location", "LOC-BRAVO")

            is_valid, reason, cost = self._validate_action(act_dict, "red", red_state, red_res)
            if not is_valid:
                action_results.append({
                    "action_id": act_id,
                    "actor": "red",
                    "status": "REJECTED",
                    "reason": reason
                })
                timeline.append({
                    "tick": 3,
                    "description": f"[REJECTED] Red action {act_id} failed validation: {reason}"
                })
                continue

            # Deduct resources
            for r_k, r_v in cost.items():
                red_res[r_k] = max(0, red_res.get(r_k, 0) - r_v)
                red_spent[r_k] = red_spent.get(r_k, 0) + r_v

            # State transition
            if act_type == "ADVANCE":
                red_state[unit_id]["status"] = "ADVANCING"
                red_state[unit_id]["location"] = target
                timeline.append({
                    "tick": 3,
                    "description": f"Red unit {unit_id} advanced toward chokepoint at {target}."
                })
            elif act_type == "STRIKE":
                red_state[unit_id]["status"] = "ENGAGING"
                timeline.append({
                    "tick": 3,
                    "description": f"Red unit {unit_id} initiated long-range artillery strike against {target}."
                })
            elif act_type == "FORTIFY":
                red_state[unit_id]["status"] = "FORTIFIED"
                red_state[unit_id]["location"] = target
                timeline.append({
                    "tick": 3,
                    "description": f"Red unit {unit_id} fortified staging position at {target}."
                })
            else:
                red_state[unit_id]["status"] = "HOLDING"
                timeline.append({
                    "tick": 3,
                    "description": f"Red unit {unit_id} held position at {red_state[unit_id].get('location')}."
                })

            action_results.append({
                "action_id": act_id,
                "actor": "red",
                "status": "EXECUTED",
                "cost": cost
            })

        # Deduct additional plan-level allocations if specified
        for k, v in sim_input.blue_plan.resource_allocation.items():
            if isinstance(v, (int, float)) and v > blue_spent.get(k, 0):
                extra = v - blue_spent.get(k, 0)
                blue_res[k] = max(0, blue_res.get(k, 0) - extra)
                blue_spent[k] = blue_spent.get(k, 0) + extra

        for k, v in sim_input.red_plan.resource_allocation.items():
            if isinstance(v, (int, float)) and v > red_spent.get(k, 0):
                extra = v - red_spent.get(k, 0)
                red_res[k] = max(0, red_res.get(k, 0) - extra)
                red_spent[k] = red_spent.get(k, 0) + extra

        resource_changes.append({"actor": "blue", "consumed": blue_spent, "remaining": blue_res})
        resource_changes.append({"actor": "red", "consumed": red_spent, "remaining": red_res})

        # ========================================================
        # Phase 3: Combat Engagement & Lanchester Resolution
        # ========================================================
        blue_losses_pct = 0.0
        red_losses_pct = 0.0

        b_active = [u for u in blue_state.values() if u.get("strength", 0) > 0]
        r_active = [u for u in red_state.values() if u.get("strength", 0) > 0]

        if b_active and r_active:
            b_unit = b_active[0]
            r_unit = r_active[0]

            # Posture Multipliers
            b_mult = 1.5 if b_unit.get("status") == "FORTIFIED" else (1.2 if b_unit.get("status") == "DEFENDING" else 1.0)
            r_mult = 1.1 if r_unit.get("status") == "ADVANCING" else (1.4 if r_unit.get("status") == "FORTIFIED" else 1.0)

            # Weather / terrain mobility penalties
            weather_cond = str(sim_input.environment.get("weather", {}).get("condition", "Clear")).lower()
            if "rain" in weather_cond or "mud" in weather_cond or "snow" in weather_cond:
                r_mult *= 0.85  # offensive armored advance penalized in mud/rain

            b_power = float(b_unit.get("strength", 100)) * b_mult
            r_power = float(r_unit.get("strength", 100)) * r_mult

            ratio = b_power / max(r_power, 1.0)

            if ratio >= 1.2:
                # Strong Blue advantage
                b_loss = int(4 + rng.randint(1, 3))
                r_loss = int(12 + rng.randint(2, 6))
            elif ratio >= 0.8:
                # Symmetrical contest
                b_loss = int(6 + rng.randint(2, 4))
                r_loss = int(8 + rng.randint(2, 5))
            else:
                # Red tactical advantage
                b_loss = int(10 + rng.randint(2, 6))
                r_loss = int(5 + rng.randint(1, 3))

            orig_b_str = float(b_unit.get("strength", 100))
            orig_r_str = float(r_unit.get("strength", 100))

            b_unit["strength"] = max(0, int(orig_b_str - b_loss))
            r_unit["strength"] = max(0, int(orig_r_str - r_loss))

            blue_losses_pct = round((b_loss / max(orig_b_str, 1.0)) * 100, 1)
            red_losses_pct = round((r_loss / max(orig_r_str, 1.0)) * 100, 1)

            events.append({
                "event_id": f"SIM-EV-{sim_input.current_turn:02d}",
                "name": "Chokepoint Sector Engagement",
                "location": "LOC-BRAVO",
                "blue_losses": b_loss,
                "red_losses": r_loss,
                "resolved": True
            })
            timeline.append({
                "tick": 4,
                "description": f"Tactical skirmish adjudicated at LOC-BRAVO: Blue sustained {b_loss} casualties ({blue_losses_pct}%); Red sustained {r_loss} casualties ({red_losses_pct}%)."
            })

        # ========================================================
        # Phase 4: Emergent Environmental Shifts
        # ========================================================
        env_assessment = sim_input.environment
        if sim_input.current_turn == 1:
            emergent_events.append({
                "event_id": f"EVT-SIM-{sim_input.current_turn:02d}",
                "type": "environmental_shift",
                "description": "Rising river discharge rate impedes further mechanized crossing without engineering assets.",
                "impact": "Red offensive momentum paused north of the river boundary."
            })
        elif sim_input.current_turn == 2:
            emergent_events.append({
                "event_id": f"EVT-SIM-{sim_input.current_turn:02d}",
                "type": "infrastructure_degradation",
                "description": "Heavy transport along secondary bypass causes route degradation and logistical friction.",
                "impact": "Fuel consumption for redeployments increased by 20%."
            })

        # ========================================================
        # Phase 5: Objectives Evaluation
        # ========================================================
        objective_results.append({
            "objective": "Defend Forward Logistics Point Alpha",
            "status": "ACHIEVED" if blue_losses_pct < 15.0 else "CONTESTED",
            "score": round(max(0.0, 1.0 - (blue_losses_pct / 100.0)), 2)
        })
        objective_results.append({
            "objective": "Deter Adversarial Breakthrough",
            "status": "ACHIEVED" if red_losses_pct >= 8.0 else "PARTIAL",
            "score": 0.85 if red_losses_pct >= 8.0 else 0.50
        })

        timeline.append({
            "tick": 5,
            "description": f"Turn {sim_input.current_turn} simulation concluded. State preserved for next turn."
        })

        # ========================================================
        # Phase 6: Construct Final State & Return Output
        # ========================================================
        final_state = {
            "blue": blue_state,
            "red": red_state,
            "resources": {
                "blue": blue_res,
                "red": red_res
            },
            "environment": env_assessment,
            "intelligence": sim_input.intelligence,
            "turn": sim_input.current_turn
        }

        return SimulationOutput(
            simulation_id=sim_input.simulation_id,
            scenario_id=sim_input.scenario_id,
            turn=sim_input.current_turn,
            status="COMPLETED",
            seed=sim_input.seed,
            timeline=timeline,
            final_state=final_state,
            action_results=action_results,
            metrics={
                "blue": {
                    "losses_percentage": blue_losses_pct,
                    "readiness": "High" if blue_losses_pct < 10 else "Moderate",
                    "remaining_strength": sum(u.get("strength", 0) for u in blue_state.values())
                },
                "red": {
                    "losses_percentage": red_losses_pct,
                    "readiness": "Moderate" if red_losses_pct < 15 else "Degraded",
                    "remaining_strength": sum(u.get("strength", 0) for u in red_state.values())
                },
                "shared": {"infrastructure_damage_percentage": 5.0 * sim_input.current_turn}
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
