from typing import Optional, Dict, Any, List
from rich import print

from backend.schemas.contracts import (
    ScenarioContract,
    EnvironmentOutput,
    BlueTeamOutput,
    RedTeamOutput,
    RedAssessment,
    ActionPayload,
    SimulationOutput,
)
from backend.llm.wrapper import invoke_structured, is_fallback_allowed


class RedTeamAgent:
    def __init__(self):
        self.role = "red_team"

    def _deterministic_fallback(
        self,
        contract: ScenarioContract,
        blue_coa: Optional[BlueTeamOutput],
        previous_sim_output: Optional[SimulationOutput] = None,
        previous_red_output: Optional[RedTeamOutput] = None,
    ) -> RedTeamOutput:
        """Deterministic resilient adaptive fallback for Red Team plan."""
        r_units = contract.forces.get("red", [])
        active_r_units = [u for u in r_units if u.get("strength", 0) > 0]
        unit_id = active_r_units[0].get("id", "RED-DIV-1") if active_r_units else (r_units[0].get("id", "RED-DIV-1") if r_units else "RED-DIV-1")
        
        if blue_coa:
            blue_name = blue_coa.decision.name.lower()
            blue_intent = blue_coa.decision.intent.lower()
        else:
            blue_name = "unknown"
            blue_intent = "unknown"

        # Strategic Adaptation based on Blue's observed Course of Action
        if any(kw in blue_name or kw in blue_intent for kw in ["withdraw", "delaying", "retrograde"]):
            red_obj = "Exploit Blue Retrograde & Advance Vanguard"
            red_intent = "Capitalize on Blue withdrawal from Alpha; advance vanguard forces to occupy high ground and seal river crossing corridors."
            act_type = "ADVANCE"
            target_loc = "LOC-ALPHA"
            rationale = "Blue is withdrawing from primary anchor, creating an operational vacuum to exploit."
        elif any(kw in blue_name or kw in blue_intent for kw in ["recon", "surveillance", "observation"]):
            red_obj = "Counter-Reconnaissance Ambush & Electronic Denial"
            red_intent = "Engage Blue reconnaissance elements with concealed ambush screen and activate tactical electronic warfare."
            act_type = "HOLD"
            target_loc = "LOC-BRAVO"
            rationale = "Direct assault into monitored zone is unfavorable; counter-recon ambush strips Blue observation."
        elif any(kw in blue_name or kw in blue_intent for kw in ["fortify", "redoubt", "entrench"]):
            red_obj = "Standoff Artillery Interdiction & Bypass Probing"
            red_intent = "Avoid frontal assault against fortified redoubt at Alpha; conduct standoff artillery bombardment and probe eastern bypass."
            act_type = "STRIKE"
            target_loc = "LOC-ALPHA"
            rationale = "Frontal assault on fortified positions incurs heavy casualties; standoff interdiction softens defense."
        elif any(kw in blue_name or kw in blue_intent for kw in ["economy of force", "conserve", "preservation"]):
            red_obj = "Seize Bridgehead & Consolidate River Crossing"
            red_intent = "Exploit Blue operational passivity to consolidate crossing infrastructure on the river northern bank."
            act_type = "ADVANCE"
            target_loc = "LOC-BRAVO"
            rationale = "Blue passivity allows uncontested consolidation of bridgehead assets."
        else:
            red_obj = "Contest River Line & Probe Alpha Defenses"
            red_intent = "Pin Blue forces at Alpha with forward vanguard while preparing alternate crossing axes."
            act_type = "ADVANCE"
            target_loc = "LOC-BRAVO"
            rationale = "Establish offensive presence along river boundary to force Blue commitment."

        actions = [
            ActionPayload(
                action_id=f"ACT-R{contract.scenario_id.replace('.', '_')}-01",
                actor="red",
                unit_id=unit_id,
                action_type=act_type,
                target_location=target_loc,
                resource_requirements={"fuel": 20 if act_type == "STRIKE" else 25, "ammo": 25 if act_type == "STRIKE" else 15},
                expected_effect=f"Executes {red_obj} adapting to observed Blue posture."
            )
        ]

        return RedTeamOutput(
            agent="red_team",
            scenario_id=contract.scenario_id,
            response_id=f"RED-RESP-{contract.scenario_id}",
            assessment=RedAssessment(
                blue_coa_reference=blue_coa.decision.course_of_action_id if blue_coa else "UNKNOWN",
                red_objective=red_obj,
                intent=red_intent
            ),
            actions=actions,
            counter_actions=[
                "Deploy electronic jamming against Blue communication nodes",
                "Reposition secondary armored echelons to reinforce axis of advance"
            ],
            resource_allocation={"fuel": 20 if act_type == "STRIKE" else 25, "ammo": 25 if act_type == "STRIKE" else 15},
            expected_effects=[
                "Maintains operational pressure while avoiding costly frontal traps",
                "Forces Blue to react to Red tactical adaptation"
            ],
            assumptions=["Blue forces cannot simultaneously defend Alpha and contest northern river bank"],
            risks=["Supply lines exposed if Blue mounts sudden localized counter-attack"],
            decision_rationale=[rationale],
            information_gaps=["Blue reserve echelon deployment status south of Alpha"],
            dynamic={"source": "Deterministic Fallback", "mode": "FALLBACK"}
        )

    def plan_response(
        self,
        contract: ScenarioContract,
        env_assessment: EnvironmentOutput,
        blue_coa: Optional[BlueTeamOutput],
        previous_sim_output: Optional[SimulationOutput] = None,
        previous_red_output: Optional[RedTeamOutput] = None,
    ) -> RedTeamOutput:
        system_prompt = (
            "You are the RED TEAM OPPOSING FORCE AGENT in the NIRNAY strategic wargaming platform.\n"
            "Formulate an adaptive, strategically coherent response independently. "
            "INTELLIGENCE REQUIREMENTS:\n"
            "1. Adversarial Adaptation: Base your planning on previous intelligence and current environment.\n"
            "2. Exploit Vulnerabilities: If Blue withdraws or preserves fuel, advance aggressively to seize terrain.\n"
            "3. Non-repetition: Avoid repeating identical actions unless explicitly justified by tactical battlefield state.\n"
            "Output MUST strictly adhere to the RedTeamOutput schema."
        )

        user_prompt = (
            f"Scenario ID: {contract.scenario_id}\n"
            f"Red Doctrine & Forces: {contract.forces.get('red', [])}\n"
            f"Previously Observed Blue Course of Action: {blue_coa.decision.name if blue_coa else 'None'} - {blue_coa.decision.intent if blue_coa else 'None'}\n"
            f"Previous Blue Actions: {blue_coa.actions if blue_coa else 'None'}\n"
            f"Environmental Assessment: {env_assessment.operational_implications.red if env_assessment else 'None'}\n"
            f"Previous Combat Metrics: {previous_sim_output.metrics if previous_sim_output else 'None (Turn 1)'}\n"
            f"Previous Red Stance: {previous_red_output.assessment.intent if previous_red_output else 'None (Turn 1)'}\n"
        )

        try:
            output = invoke_structured(
                role=self.role,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                schema=RedTeamOutput,
                temperature=0.3
            )
            output.dynamic = {"source": "NVIDIA NIM", "model": "nvidia/nemotron-3-super-120b-a12b", "mode": "LIVE"}
            return output
        except Exception as e:
            if not is_fallback_allowed():
                raise e
            print(f"[bold yellow][AGENT WARNING][/bold yellow] Red Team LLM failed: {e}. Using deterministic fallback.")
            return self._deterministic_fallback(contract, blue_coa, previous_sim_output, previous_red_output)
