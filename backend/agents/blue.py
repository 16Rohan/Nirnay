"""
Blue Team Agent.
Generates friendly courses of action (COA) constrained by scenario objectives, rules, and environment.
Produces strictly structured BlueTeamOutput contract.
"""

from typing import Optional
from rich import print

from backend.schemas.contracts import (
    ScenarioContract,
    EnvironmentOutput,
    BlueTeamOutput,
    BlueDecision,
)
from backend.llm.wrapper import invoke_structured, is_fallback_allowed


class BlueTeamAgent:
    def __init__(self):
        self.role = "blue_team"

    def _deterministic_fallback(
        self,
        contract: ScenarioContract,
        human_guidance: Optional[str]
    ) -> BlueTeamOutput:
        """Deterministic resilient fallback for Blue Team plan."""
        b_units = contract.forces.get("blue", [])
        unit_id = b_units[0].get("id", "BLUE-BDE-1") if b_units else "BLUE-BDE-1"
        return BlueTeamOutput(
            agent="blue_team",
            scenario_id=contract.scenario_id,
            decision=BlueDecision(
                course_of_action_id=f"BLUE-COA-{contract.scenario_id}",
                name="Defensive Redoubt & Sector Anchor",
                intent="Entrench forces at Forward Logistics Point Alpha and deny river crossing breakout.",
                priority="HIGH"
            ),
            actions=[
                {
                    "action_id": "ACT-B01",
                    "unit_id": unit_id,
                    "action_type": "FORTIFY",
                    "target_location": "LOC-ALPHA"
                }
            ],
            resource_allocation={"fuel": 20, "ammo": 15},
            expected_effects=[
                "Preserves 90%+ combat readiness at Alpha",
                "Prevents adversary from establishing uncontested bridgehead"
            ],
            assumptions=["Adversary cannot cross river without committing heavy armor to chokepoints"],
            risks=["Static posture limits initiative if adversary attempts deep flanking"],
            decision_rationale=[
                f"Matches operator guidance '{human_guidance or 'Preserve defensive line'}' without risking escalation"
            ],
            information_gaps=["Adversary bridging equipment arrival timeline"],
            dynamic={"source": "deterministic_fallback"}
        )

    def plan_course_of_action(
        self,
        contract: ScenarioContract,
        env_assessment: EnvironmentOutput,
        human_guidance: Optional[str] = None
    ) -> BlueTeamOutput:
        system_prompt = (
            "You are the BLUE TEAM COMMAND AGENT in the NIRNAY strategic wargaming platform.\n"
            "Develop an optimal friendly course of action respecting hard constraints and operator guidance.\n"
            "Output MUST strictly adhere to the BlueTeamOutput schema."
        )

        user_prompt = (
            f"Scenario ID: {contract.scenario_id}\n"
            f"Objectives: {contract.objectives.model_dump()}\n"
            f"Constraints: {contract.constraints.model_dump()}\n"
            f"Friendly Forces: {contract.forces.get('blue', [])}\n"
            f"Environmental Assessment: {env_assessment.model_dump()}\n"
            f"Operator Guidance: {human_guidance or 'Preserve defensive line.'}\n"
        )

        try:
            return invoke_structured(
                role=self.role,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                schema=BlueTeamOutput,
                temperature=0.3
            )
        except Exception as e:
            if not is_fallback_allowed():
                raise e
            print(f"[bold yellow][AGENT WARNING][/bold yellow] Blue Team LLM failed: {e}. Using deterministic fallback.")
            return self._deterministic_fallback(contract, human_guidance)
