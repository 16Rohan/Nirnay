"""
Environment Agent.
Analyzes geography, terrain, weather, and infrastructure of the ScenarioContract.
Produces structured EnvironmentOutput contract.
"""

from rich import print

from backend.schemas.contracts import (
    ScenarioContract,
    EnvironmentOutput,
    OperationalImplications,
)
from backend.llm.wrapper import invoke_structured, is_fallback_allowed


class EnvironmentAgent:
    def __init__(self):
        self.role = "environment"

    def _deterministic_fallback(self, contract: ScenarioContract) -> EnvironmentOutput:
        """Deterministic resilient fallback for Environment assessment."""
        weather = contract.environment.weather
        terrain = contract.geography.terrain
        return EnvironmentOutput(
            agent="environment",
            scenario_id=contract.scenario_id,
            environment_assessment={
                "weather": weather,
                "terrain": terrain,
                "mobility": {"tracked": 0.80, "wheeled": 0.60},
                "visibility_km": contract.environment.visibility.get("range_km", 7.0),
                "environmental_factors": ["High water velocity at River Crossing Point LOC-BRAVO"]
            },
            operational_implications=OperationalImplications(
                blue=["Hillside elevation at LOC-ALPHA grants defensive observation advantage"],
                red=["Mechanized advance slowed by riverbank mud saturation"],
                shared=["LOC-BRAVO bridge is the single critical logistical chokepoint"]
            ),
            constraints=["Heavy aerial surveillance degraded under cloud ceiling"],
            opportunities=["Channel opposing force into defiles along river approach"],
            uncertainties=["Potential flooding along low-lying supply trails"],
            sources=["Regional Meteorological Center (Fallback Model)"],
            dynamic={"source": "deterministic_fallback"}
        )

    def analyze(self, contract: ScenarioContract) -> EnvironmentOutput:
        system_prompt = (
            "You are the ENVIRONMENT AGENT in the NIRNAY strategic wargaming platform.\n"
            "Analyze the geography, weather, mobility, and terrain for the current scenario contract.\n"
            "Return a strictly valid EnvironmentOutput contract."
        )

        user_prompt = (
            f"Analyze environment for Scenario {contract.scenario_id}.\n"
            f"Geography: {contract.geography.model_dump()}\n"
            f"Environment conditions: {contract.environment.model_dump()}\n"
            f"Forces: {contract.forces}\n"
        )

        try:
            return invoke_structured(
                role=self.role,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                schema=EnvironmentOutput,
                temperature=0.2
            )
        except Exception as e:
            if not is_fallback_allowed():
                raise e
            print(f"[bold yellow][AGENT WARNING][/bold yellow] Environment LLM failed: {e}. Using deterministic fallback.")
            return self._deterministic_fallback(contract)
