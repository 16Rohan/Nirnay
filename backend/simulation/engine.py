"""
Deterministic rule-based simulation engine for NIRNAY wargaming platform.
Executes plans according to concrete validation, movement, terrain, resource accounting, and combat rules.
Guarantees reproducible results using deterministic seeds.
Stateful: Output final_state contains complete entities, resources, and environment for next turn inheritance.
"""

import random
from typing import Dict, Any, List, Tuple, Optional
from backend.schemas.contracts import (
    SimulationInput,
    SimulationOutput,
    SimulationTermination,
)
import re

def _parse_strength(val: Any, default: float = 100.0) -> float:
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        match = re.search(r"[-+]?\d*\.?\d+", val)
        if match:
            return float(match.group())
    return default


class DeterministicSimulator:
    def __init__(self):
        pass

    def _validate_action(
        self,
        action: Dict[str, Any],
        actor: str,
        units_state: Dict[str, Any],
        available_resources: Dict[str, Any],
        hard_constraints: Optional[List[str]] = None
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validates an action against unit existence, unit strength, available resources, and hard constraints.
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

        # 2. Hard Constraints Check
        if hard_constraints:
            for hc in hard_constraints:
                hc_lower = str(hc).lower()
                if any(kw in hc_lower for kw in ["no offensive", "do not initiate offensive", "defensive posture only", "prohibit attack", "no kinetic"]):
                    if actor == "blue" and action_type in ("ADVANCE", "STRIKE", "ATTACK"):
                        return False, "Contradicts operator hard constraint: offensive action prohibited", {}

        # 3. Resource Requirements
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

        # Deep copy state from input and ensure strength is numeric
        blue_state = {k: dict(v) for k, v in sim_input.initial_state.get("blue", {}).items()}
        for u in blue_state.values():
            u["strength"] = _parse_strength(u.get("strength"), 100.0)
            
        red_state = {k: dict(v) for k, v in sim_input.initial_state.get("red", {}).items()}
        for u in red_state.values():
            u["strength"] = _parse_strength(u.get("strength"), 100.0)
        
        # Initialize resources
        blue_res = dict(sim_input.resources.get("blue") or sim_input.initial_state.get("resources", {}).get("blue") or {"fuel": 80, "ammo": 85})
        red_res = dict(sim_input.resources.get("red") or sim_input.initial_state.get("resources", {}).get("red") or {"fuel": 115, "ammo": 90})

        # Check for catastrophic special events or explicit termination
        is_third_party_catastrophe = False
        if sim_input.special_events:
            for ev in sim_input.special_events:
                if ev.get("event_type") == "THIRD_PARTY_CATASTROPHIC_EVENT" or ev.get("effect") == "TOTAL_DESTRUCTION":
                    is_third_party_catastrophe = True
                    break

        if not is_third_party_catastrophe and sim_input.human_intent:
            intent_type = sim_input.human_intent.get("intent_type")
            special_ev = sim_input.human_intent.get("special_event") or {}
            if intent_type == "SPECIAL_EVENT_DIRECTIVE" or special_ev.get("event_type") == "THIRD_PARTY_CATASTROPHIC_EVENT":
                is_third_party_catastrophe = True

        if is_third_party_catastrophe:
            # All Blue and Red forces annihilated
            for u in blue_state.values():
                u["strength"] = 0
                u["status"] = "DESTROYED"
            for u in red_state.values():
                u["strength"] = 0
                u["status"] = "DESTROYED"

            timeline.append({
                "tick": 2,
                "description": "CRITICAL ADJUDICATION: Third-party adversarial nuclear / catastrophic event occurred. Mutual annihilation of both Blue and Red forces."
            })
            events.append({
                "event_id": f"EVT-CATASTROPHE-{sim_input.current_turn:02d}",
                "name": "Third-Party Catastrophic Detonation",
                "location": "DISPUTED_CORRIDOR",
                "blue_losses": 100,
                "red_losses": 100,
                "resolved": True
            })
            final_state = {
                "blue": blue_state,
                "red": red_state,
                "resources": {"blue": {"fuel": 0, "ammo": 0}, "red": {"fuel": 0, "ammo": 0}},
                "environment": sim_input.environment,
                "intelligence": sim_input.intelligence,
                "turn": sim_input.current_turn
            }
            term = SimulationTermination(
                reason="Third-party catastrophic event resulting in total mutual annihilation",
                time=sim_input.time_horizon,
                condition="MUTUAL_DESTRUCTION",
                terminal=True,
                winner="NONE",
                outcome="MUTUAL_DESTRUCTION"
            )
            return SimulationOutput(
                simulation_id=sim_input.simulation_id,
                scenario_id=sim_input.scenario_id,
                turn=sim_input.current_turn,
                status="TERMINATED",
                seed=sim_input.seed,
                timeline=timeline,
                final_state=final_state,
                action_results=[],
                metrics={
                    "blue": {"losses_percentage": 100.0, "readiness": "Destroyed", "remaining_strength": 0},
                    "red": {"losses_percentage": 100.0, "readiness": "Destroyed", "remaining_strength": 0},
                    "shared": {"infrastructure_damage_percentage": 100.0}
                },
                events=events,
                resource_changes=[{"actor": "all", "consumed": {"all": 100}, "remaining": {}}],
                objective_results=[
                    {"objective": "Campaign Survival", "status": "FAILED", "score": 0.0}
                ],
                emergent_events=[{
                    "event_id": f"EVT-EM-CAT-{sim_input.current_turn:02d}",
                    "type": "catastrophic_destruction",
                    "description": "Full theater devastation. Neither side retained operational cohesion.",
                    "impact": "Campaign concluded by external catastrophic shock."
                }],
                termination=term,
                terminal=True
            )

        # Check for Human Termination Directive
        is_human_terminated = False
        if sim_input.human_intent:
            if sim_input.human_intent.get("termination_requested") or sim_input.human_intent.get("intent_type") in ("TERMINATE_SIMULATION", "TERMINATION_DIRECTIVE"):
                is_human_terminated = True

        if is_human_terminated:
            timeline.append({
                "tick": 2,
                "description": "TERMINATION ENFORCED: Human operator issued absolute directive to terminate simulation immediately."
            })
            term = SimulationTermination(
                reason="Operator absolute termination directive",
                time=sim_input.time_horizon,
                condition="HUMAN_TERMINATED",
                terminal=True,
                winner="NONE",
                outcome="STALEMATE"
            )
            final_state = {
                "blue": blue_state,
                "red": red_state,
                "resources": {"blue": blue_res, "red": red_res},
                "environment": sim_input.environment,
                "intelligence": sim_input.intelligence,
                "turn": sim_input.current_turn
            }
            return SimulationOutput(
                simulation_id=sim_input.simulation_id,
                scenario_id=sim_input.scenario_id,
                turn=sim_input.current_turn,
                status="TERMINATED",
                seed=sim_input.seed,
                timeline=timeline,
                final_state=final_state,
                action_results=[],
                metrics={
                    "blue": {"losses_percentage": 0.0, "readiness": "Preserved", "remaining_strength": sum(u.get("strength", 0) for u in blue_state.values())},
                    "red": {"losses_percentage": 0.0, "readiness": "Preserved", "remaining_strength": sum(u.get("strength", 0) for u in red_state.values())},
                    "shared": {"infrastructure_damage_percentage": 0.0}
                },
                events=events,
                resource_changes=[],
                objective_results=[{"objective": "Orderly Termination", "status": "ACHIEVED", "score": 1.0}],
                emergent_events=[],
                termination=term,
                terminal=True
            )

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

            is_valid, reason, cost = self._validate_action(act_dict, "blue", blue_state, blue_res, hard_constraints=sim_input.hard_constraints)
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
        # All active units on each side contribute to the composite combat power.
        # Attrition is proportionally distributed across all active units.
        # This ensures multi-unit forces behave correctly (not just lead-unit combat).
        blue_losses_pct = 0.0
        red_losses_pct = 0.0

        b_active = [u for u in blue_state.values() if u.get("strength", 0) > 0]
        r_active = [u for u in red_state.values() if u.get("strength", 0) > 0]

        b_offensive = any(u.get("status") in ("ADVANCING", "ENGAGING", "STRIKE") for u in blue_state.values())
        r_offensive = any(u.get("status") in ("ADVANCING", "ENGAGING", "STRIKE") for u in red_state.values())

        if b_active and r_active and (b_offensive or r_offensive):
            # Composite force strength (sum of all active units)
            b_total_str = float(sum(u.get("strength", 0) for u in b_active))
            r_total_str = float(sum(u.get("strength", 0) for u in r_active))

            # Determine dominant posture for posture multiplier (use strongest unit's status)
            b_dominant = max(b_active, key=lambda u: u.get("strength", 0))
            r_dominant = max(r_active, key=lambda u: u.get("strength", 0))

            b_mult = 1.5 if b_dominant.get("status") == "FORTIFIED" else (1.2 if b_dominant.get("status") == "DEFENDING" else 1.0)
            r_mult = 1.1 if r_dominant.get("status") == "ADVANCING" else (1.4 if r_dominant.get("status") == "FORTIFIED" else 1.0)

            # Weather/terrain penalties on advancing forces
            weather_cond = str(sim_input.environment.get("weather", {}).get("condition", "Clear")).lower()
            if "rain" in weather_cond or "mud" in weather_cond or "snow" in weather_cond:
                r_mult *= 0.85  # Penalize advancing armored in adverse weather
                if b_offensive:  # Blue also penalized if advancing in bad weather
                    b_mult *= 0.90

            b_power = b_total_str * b_mult
            r_power = r_total_str * r_mult

            ratio = b_power / max(r_power, 1.0)

            if ratio >= 1.2:
                b_loss_pct_of_total = (4 + rng.randint(1, 3)) / max(b_total_str, 1.0)
                r_loss_pct_of_total = (12 + rng.randint(2, 6)) / max(r_total_str, 1.0)
            elif ratio >= 0.8:
                b_loss_pct_of_total = (6 + rng.randint(2, 4)) / max(b_total_str, 1.0)
                r_loss_pct_of_total = (8 + rng.randint(2, 5)) / max(r_total_str, 1.0)
            else:
                b_loss_pct_of_total = (10 + rng.randint(2, 6)) / max(b_total_str, 1.0)
                r_loss_pct_of_total = (5 + rng.randint(1, 3)) / max(r_total_str, 1.0)

            # Distribute attrition proportionally across all active units
            b_total_lost = 0
            for u in b_active:
                unit_str = float(u.get("strength", 0))
                unit_loss = int(unit_str * b_loss_pct_of_total)
                u["strength"] = max(0, int(unit_str - unit_loss))
                if u["strength"] <= 0:
                    u["status"] = "DESTROYED"
                b_total_lost += unit_loss

            r_total_lost = 0
            for u in r_active:
                unit_str = float(u.get("strength", 0))
                unit_loss = int(unit_str * r_loss_pct_of_total)
                u["strength"] = max(0, int(unit_str - unit_loss))
                if u["strength"] <= 0:
                    u["status"] = "DESTROYED"
                r_total_lost += unit_loss

            # Whole-force losses percentage (used for termination and metrics)
            blue_losses_pct = round((b_total_lost / max(b_total_str, 1.0)) * 100, 1)
            red_losses_pct = round((r_total_lost / max(r_total_str, 1.0)) * 100, 1)

            events.append({
                "event_id": f"SIM-EV-{sim_input.current_turn:02d}",
                "name": "Chokepoint Sector Engagement",
                "location": "LOC-BRAVO",
                "blue_losses": b_total_lost,
                "red_losses": r_total_lost,
                "resolved": True
            })
            timeline.append({
                "tick": 4,
                "description": f"Tactical engagement adjudicated at LOC-BRAVO: Blue sustained {b_total_lost} casualties ({blue_losses_pct}%); Red sustained {r_total_lost} casualties ({red_losses_pct}%)."
            })

        # ========================================================
        # Phase 4: State-Derived Environmental Events
        # ========================================================
        # Events must correspond to actual simulation state, NOT hardcoded scripts.
        # River crossing contested? Generate crossing impediment event.
        env_assessment = sim_input.environment
        river_level = env_assessment.get("river_level", "normal")
        weather_cond = str(env_assessment.get("weather", {}).get("condition", "Clear")).lower()

        # River crossing impediment: if any Red unit is advancing toward a crossing location
        red_crossing = any(
            u.get("status") in ("ADVANCING",) and "BRAVO" in str(u.get("location", "")).upper()
            for u in red_state.values()
        )
        if red_crossing and ("rain" in weather_cond or river_level in ("high", "flood")):
            emergent_events.append({
                "event_id": f"EVT-SIM-{sim_input.current_turn:02d}-RIVER",
                "type": "environmental_shift",
                "description": "Rising river discharge impedes mechanized crossing without engineering assets.",
                "impact": "Red offensive momentum slowed at river boundary."
            })

        # Route degradation: triggered if heavy vehicle activity has occurred in prior turns
        if sim_input.current_turn > 1 and sim_input.previous_actions:
            heavy_activity = sum(
                1 for act in sim_input.previous_actions
                if isinstance(act, dict) and act.get("status") == "EXECUTED"
                and act.get("actor") in ("blue", "red")
            )
            if heavy_activity >= 3:
                emergent_events.append({
                    "event_id": f"EVT-SIM-{sim_input.current_turn:02d}-ROUTE",
                    "type": "infrastructure_degradation",
                    "description": "Heavy vehicle traffic has caused route degradation on secondary bypass roads.",
                    "impact": "Resupply movement costs increased for this turn."
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

        b_rem = sum(u.get("strength", 0) for u in blue_state.values())
        r_rem = sum(u.get("strength", 0) for u in red_state.values())
        b_orig = sum(_parse_strength(u.get("strength", 100.0)) for u in sim_input.initial_state.get("blue", {}).values())
        r_orig = sum(_parse_strength(u.get("strength", 100.0)) for u in sim_input.initial_state.get("red", {}).values())
        
        is_terminal = False
        winner = "NONE"
        outcome = "CONTINUE"
        condition = "Defensive Standoff"
        term_reason = "Turn duration completed"

        # Only terminate if they actually had forces to begin with and they were destroyed
        if b_orig > 0 and r_orig > 0 and b_rem <= 0 and r_rem <= 0:
            is_terminal = True
            condition = "MUTUAL_DESTRUCTION"
            outcome = "MUTUAL_DESTRUCTION"
            winner = "NONE"
            term_reason = "Total mutual destruction of all forces"
        elif b_orig > 0 and b_rem <= 0:
            is_terminal = True
            condition = "RED_VICTORY"
            outcome = "RED_VICTORY"
            winner = "RED"
            term_reason = "Friendly forces completely eliminated"
        elif r_orig > 0 and r_rem <= 0:
            is_terminal = True
            condition = "BLUE_VICTORY"
            outcome = "BLUE_VICTORY"
            winner = "BLUE"
            term_reason = "Adversary forces completely eliminated"

        return SimulationOutput(
            simulation_id=sim_input.simulation_id,
            scenario_id=sim_input.scenario_id,
            turn=sim_input.current_turn,
            status="TERMINATED" if is_terminal else "COMPLETED",
            seed=sim_input.seed,
            timeline=timeline,
            final_state=final_state,
            action_results=action_results,
            metrics={
                "blue": {
                    "losses_percentage": blue_losses_pct,
                    "readiness": "High" if blue_losses_pct < 10 else ("Moderate" if b_rem > 0 else "Destroyed"),
                    "remaining_strength": b_rem
                },
                "red": {
                    "losses_percentage": red_losses_pct,
                    "readiness": "Moderate" if red_losses_pct < 15 else ("Degraded" if r_rem > 0 else "Destroyed"),
                    "remaining_strength": r_rem
                },
                "shared": {"infrastructure_damage_percentage": 5.0 * sim_input.current_turn}
            },
            events=events,
            resource_changes=resource_changes,
            objective_results=objective_results,
            emergent_events=emergent_events,
            termination=SimulationTermination(
                reason=term_reason,
                time=sim_input.time_horizon,
                condition=condition,
                terminal=is_terminal,
                winner=winner,
                outcome=outcome
            ),
            terminal=is_terminal
        )
