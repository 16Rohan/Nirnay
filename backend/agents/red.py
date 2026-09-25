"""
Red Team Agent.
Models an adaptive, strategically coherent opposing force response to Blue's course of action.
Produces strictly structured RedTeamOutput contract.
"""

from rich import print

from backend.schemas.contracts import (
    ScenarioContract,
    EnvironmentOutput,
    BlueTeamOutput,
    RedTeamOutput,
    RedAssessment,
)
from backend.llm.wrapper import invoke_structured, is_fallback_allowed


class RedTeamAgent:
    def __init__(self):
        self.role = "red_team"

    def _deterministic_fallback(
        self,
        contract: ScenarioContract,
        blue_coa: BlueTeamOutput
    ) -> RedTeamOutput:
        """Deterministic resilient fallback for Red Team plan."""
        r_units = contract.forces.get("red", [])
        unit_id = r_units[0].get("id", "RED-DIV-1") if r_units else "RED-DIV-1"
        return RedTeamOutput(
            agent="red_team",
            scenario_id=contract.scenario_id,
            response_id=f"RED-RESP-{contract.scenario_id}",
            assessment=RedAssessment(
                blue_coa_reference=blue_coa.decision.course_of_action_id,
                red_objective="Contest River Line and Probe Alpha Defenses",
                intent="Pin Blue forces at Alpha with forward vanguard while preparing flanking axes."
            ),
            actions=[
                {
                    "action_id": "ACT-R01",
                    "unit_id": unit_id,
                    "action_type": "ADVANCE",
                    "target_location": "LOC-BRAVO"
                }
            ],
            counter_actions=[
                "Deploy electronic jamming against Blue forward observation posts"
            ],
            resource_allocation={"fuel": 30, "ammo": 25},
            expected_effects=[
                "Establish fire control over north bank of LOC-BRAVO",
                "Force Blue to expend defensive reserves"
            ],
            assumptions=["Blue forces are fixed at LOC-ALPHA and cannot mount counter-offensive"],
            risks=["Chokepoint vulnerability at river crossing due to mud"],
            decision_rationale=[
                "Capitalize on Blue's defensive hesitation to consolidate northern bank bridgehead"
            ],
            information_gaps=["Depth of Blue defensive obstacle belts around Alpha"],
            dynamic={"source": "deterministic_fallback"}
        )

    def plan_response(
        self,
        contract: ScenarioContract,
        env_assessment: EnvironmentOutput,
        blue_coa: BlueTeamOutput
    ) -> RedTeamOutput:
        system_prompt = (
            "You are the RED TEAM OPPOSING FORCE AGENT in the NIRNAY strategic wargaming platform.\n"
            "Formulate an adaptive, tactical response to Blue's plan within scenario rules.\n"
            "Output MUST strictly adhere to the RedTeamOutput schema."
        )

        user_prompt = (
            f"Scenario ID: {contract.scenario_id}\n"
            f"Red Doctrine & Forces: {contract.forces.get('red', [])}\n"
            f"Observed Blue Course of Action: {blue_coa.decision.name} - {blue_coa.decision.intent}\n"
            f"Blue Actions: {blue_coa.actions}\n"
            f"Environmental Assessment: {env_assessment.operational_implications.red}\n"
        )

        try:
            return invoke_structured(
                role=self.role,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                schema=RedTeamOutput,
                temperature=0.3
            )
        except Exception as e:
            if not is_fallback_allowed():
                raise e
            print(f"[bold yellow][AGENT WARNING][/bold yellow] Red Team LLM failed: {e}. Using deterministic fallback.")
            return self._deterministic_fallback(contract, blue_coa)
