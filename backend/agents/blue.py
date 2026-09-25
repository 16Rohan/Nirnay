from typing import Optional, Dict, Any, List
from rich import print

from backend.schemas.contracts import (
    ScenarioContract,
    EnvironmentOutput,
    BlueTeamOutput,
    BlueDecision,
    ActionPayload,
    SimulationOutput,
)
from backend.llm.wrapper import invoke_structured, is_fallback_allowed


class BlueTeamAgent:
    def __init__(self):
        self.role = "blue_team"

    def _deterministic_fallback(
        self,
        contract: ScenarioContract,
        human_guidance: Optional[str] = None,
        previous_sim_output: Optional[SimulationOutput] = None,
        previous_blue_output: Optional[BlueTeamOutput] = None,
    ) -> BlueTeamOutput:
        """Deterministic resilient context-aware fallback for Blue Team plan."""
        b_units = contract.forces.get("blue", [])
        active_b_units = [u for u in b_units if u.get("strength", 0) > 0]
        unit_id = active_b_units[0].get("id", "BLUE-BDE-1") if active_b_units else (b_units[0].get("id", "BLUE-BDE-1") if b_units else "BLUE-BDE-1")
        is_subsequent = "." in contract.scenario_id or (contract.parent_scenario_id is not None)
        
        guidance_lower = (human_guidance or "").lower()

        # Adapt Course of Action based on human guidance directives
        if any(kw in guidance_lower for kw in ["withdraw", "abandon", "fall back", "retreat"]):
            coa_name = "Tactical Withdrawal & Delaying Screen"
            intent = "Execute orderly retrograde movement from LOC-ALPHA to rear defensive positions, conserving forces and avoiding decisive engagement."
            act_type = "HOLD"
            target_loc = "LOC-REAR"
            rationale = "Operator directive explicitly mandates abandonment of Alpha and tactical withdrawal."
        elif any(kw in guidance_lower for kw in ["reconnaissance", "recon", "bravo", "probe"]):
            coa_name = "Targeted Reconnaissance & Observation Screen"
            intent = "Prioritize forward observation toward LOC-BRAVO to detect adversarial crossing preparations while conserving main body combat power."
            act_type = "RECON"
            target_loc = "LOC-BRAVO"
            rationale = "Operator directive prioritizes intelligence gathering and reconnaissance toward Bravo."
        elif any(kw in guidance_lower for kw in ["conserve fuel", "avoid direct engagement", "economy of force", "defensive only", "do not initiate"]):
            coa_name = "Defensive Economy of Force & Standoff"
            intent = "Minimise vehicular movement and ammunition expenditure, holding fortified positions without initiating offensive actions."
            act_type = "HOLD"
            target_loc = "LOC-ALPHA"
            rationale = "Strict compliance with operator mandate to conserve logistics and avoid unprovoked escalation."
        elif any(kw in guidance_lower for kw in ["prioritize campaign survival", "survival over territorial"]):
            coa_name = "Strategic Force Preservation"
            intent = "Prioritize unit survivability and logistical integrity over fixed geographic retention."
            act_type = "DEFEND"
            target_loc = "LOC-ALPHA"
            rationale = "Operator directive prioritizes force preservation over territorial defense."
        elif is_subsequent:
            coa_name = "Active Defense & Sector Monitoring"
            intent = "Maintain established fortification at Alpha while monitoring adversary flanking routes."
            act_type = "DEFEND"
            target_loc = "LOC-ALPHA"
            rationale = "Continuation of defensive anchor justified by ongoing adversary concentration north of the river."
        else:
            coa_name = "Defensive Redoubt & Sector Anchor"
            intent = "Entrench forces at Forward Logistics Point Alpha and deny river crossing breakout."
            act_type = "FORTIFY"
            target_loc = "LOC-ALPHA"
            rationale = f"Aligns with initial operational mission '{human_guidance or 'Preserve defensive line'}'."

        actions = [
            ActionPayload(
                action_id=f"ACT-B{contract.scenario_id.replace('.', '_')}-01",
                actor="blue",
                unit_id=unit_id,
                action_type=act_type,
                target_location=target_loc,
                resource_requirements={"fuel": 10 if act_type == "HOLD" else 15, "ammo": 5 if act_type == "HOLD" else 10},
                expected_effect=f"Executes {coa_name} preserving unit cohesion."
            )
        ]

        return BlueTeamOutput(
            agent="blue_team",
            scenario_id=contract.scenario_id,
            decision=BlueDecision(
                course_of_action_id=f"BLUE-COA-{contract.scenario_id}",
                name=coa_name,
                intent=intent,
                priority="HIGH"
            ),
            actions=actions,
            resource_allocation={"fuel": 10 if act_type == "HOLD" else 15, "ammo": 5 if act_type == "HOLD" else 10},
            expected_effects=[
                "Maintains tactical discipline and respects operator guidance",
                "Prevents adversary from exploiting unexpected defense collapse"
            ],
            assumptions=["Adversary cannot break through without committing heavy armor"],
            risks=["Static or conservative posture risks conceding operational initiative"],
            decision_rationale=[rationale],
            information_gaps=["Adversary crossing timelines and artillery resupply"],
            dynamic={"source": "Deterministic Fallback", "mode": "FALLBACK"}
        )

    def plan_course_of_action(
        self,
        contract: ScenarioContract,
        env_assessment: Optional[EnvironmentOutput] = None,
        human_guidance: Optional[str] = None,
        previous_sim_output: Optional[SimulationOutput] = None,
        previous_blue_output: Optional[BlueTeamOutput] = None,
    ) -> BlueTeamOutput:
        system_prompt = (
            "You are the BLUE TEAM COMMAND AGENT in the NIRNAY strategic wargaming platform.\n"
            "Develop an optimal friendly course of action respecting hard constraints, operator directives, and previous outcomes.\n"
            "INTELLIGENCE REQUIREMENTS:\n"
            "1. Consequence Awareness: Account for remaining fuel, ammo, and unit strength.\n"
            "2. Non-repetition: If repeating a previous strategy, provide explicit operational justification.\n"
            "3. Human Intent Hierarchy: Explicit human directives override tactical preferences. If instructed to withdraw or avoid engagement, strictly obey.\n"
            "4. Feasibility: Never propose actions for destroyed units or using unavailable resources.\n"
            "Output MUST strictly adhere to the BlueTeamOutput schema."
        )

        env_data = env_assessment.model_dump() if env_assessment else {}
        user_prompt = (
            f"Scenario ID: {contract.scenario_id}\n"
            f"Objectives: {contract.objectives.model_dump()}\n"
            f"Constraints: {contract.constraints.model_dump()}\n"
            f"Friendly Forces: {contract.forces.get('blue', [])}\n"
            f"Environmental Assessment: {env_data}\n"
            f"Operator Guidance: {human_guidance or 'Preserve defensive line.'}\n"
            f"Previous Simulation Metrics: {previous_sim_output.metrics if previous_sim_output else 'None (Turn 1)'}\n"
            f"Previous Blue Stance: {previous_blue_output.decision.name if previous_blue_output else 'None (Turn 1)'}\n"
        )

        try:
            output = invoke_structured(
                role=self.role,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                schema=BlueTeamOutput,
                temperature=0.3
            )
            output.dynamic = {"source": "NVIDIA NIM", "model": "nvidia/nemotron-3-super-120b-a12b", "mode": "LIVE"}
            return output
        except Exception as e:
            if not is_fallback_allowed():
                raise e
            print(f"[bold yellow][AGENT WARNING][/bold yellow] Blue Team LLM failed: {e}. Using deterministic fallback.")
            return self._deterministic_fallback(contract, human_guidance, previous_sim_output, previous_blue_output)
