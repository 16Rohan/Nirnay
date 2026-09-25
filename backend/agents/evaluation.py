"""
Evaluation Agent.
Analyzes simulation results against objectives, constraints, and strategic stakes.
Detects emergent events, decides continuation vs conclusion, and produces ScenarioTransition.
"""

from typing import Tuple, Optional
from rich import print

from backend.schemas.contracts import (
    ScenarioContract,
    SimulationOutput,
    EvaluationOutput,
    EvaluationAssessment,
    SimulationControl,
    NextScenarioRecommendation,
    EmergentEvent,
    ScenarioTransition,
    TransitionNextScenario,
)
from backend.llm.wrapper import invoke_structured, is_fallback_allowed


class EvaluationAgent:
    def __init__(self):
        self.role = "evaluation"

    def _deterministic_fallback(
        self,
        contract: ScenarioContract,
        sim_output: SimulationOutput,
        iteration_count: int,
        max_iterations: int
    ) -> EvaluationOutput:
        """Deterministic resilient fallback for Evaluation assessment."""
        concluded = iteration_count >= max_iterations
        next_id = f"{contract.scenario_id}.1" if "." not in contract.scenario_id else f"{contract.scenario_id[:-1]}{int(contract.scenario_id[-1])+1}"

        return EvaluationOutput(
            agent="evaluation",
            scenario_id=contract.scenario_id,
            simulation_id=sim_output.simulation_id,
            assessment=EvaluationAssessment(
                objective_results=str(sim_output.objective_results),
                blue_performance=f"Losses: {sim_output.metrics.get('blue', {}).get('losses_percentage', 6.0)}% - TACTICAL_DEFENSE_SOUND",
                red_performance=f"Losses: {sim_output.metrics.get('red', {}).get('losses_percentage', 10.0)}% - OFFENSIVE_IMPEDED",
                resource_effects=str(sim_output.resource_changes),
                risks=[
                    "Stalemate at river line leaves supply road vulnerable to long-range harassment",
                    "Ammunition expenditure rate threatens sustained defensive posture in prolonged conflict"
                ],
                tradeoffs=[
                    "Static entrenchment protected personnel but conceded operational initiative north of the river",
                    "Concentrating forces at the bridgehead thinned coverage along secondary mountain routes"
                ],
                uncertainties=[
                    "Adversary reserve deployment along alternate mountain passes",
                    "Duration of monsoon-induced river swelling affecting bridging operations"
                ],
                strategic_implications=[
                    "Adversary offensive tempo significantly degraded for next 48 hours",
                    "Diplomatic leverage enhanced due to successful territorial defense"
                ]
            ),
            emergent_events=[
                EmergentEvent(
                    event_id="EVT-001",
                    type="diplomatic_development",
                    description="Third-party UN peace envoy proposes a 24-hour tactical pause.",
                    impact="May freeze current positions and allow replenishment.",
                    requires_response=True
                )
            ],
            simulation_control=SimulationControl(
                concluded=concluded,
                termination_reason="Target wargaming objectives and comparison threshold reached" if concluded else None,
                continue_reason="Unresolved standoff and emergent ceasefire offer require next scenario iteration" if not concluded else "",
                next_scenario_required=not concluded
            ),
            next_scenario=NextScenarioRecommendation(
                scenario_id=next_id,
                parent_scenario_id=contract.scenario_id,
                reason="Incorporate diplomatic mediation rules and evaluate Blue posture under ceasefire constraints.",
                required_changes=["Adjust Rules of Engagement", "Include UN mediator parameters"],
                required_information=["Red military command's adherence verification"]
            ),
            strategic_conclusion=(
                f"Scenario {contract.scenario_id} demonstrated that Blue's fortified redoubt at LOC-ALPHA successfully deterred the adversary from breaking across the river line. "
                "Casualties remained below the critical threshold."
            ),
            human_review_required=True,
            dynamic={"source": "deterministic_fallback"}
        )

    def evaluate(
        self,
        contract: ScenarioContract,
        sim_output: SimulationOutput,
        iteration_count: int = 1,
        max_iterations: int = 2
    ) -> Tuple[EvaluationOutput, Optional[ScenarioTransition]]:
        """
        Evaluates simulation output and constructs evaluation assessment + transition contract.
        """
        system_prompt = (
            "You are the EVALUATION AGENT of the NIRNAY strategic wargaming platform.\n"
            "Analyze simulation metrics, losses, and objective completions.\n"
            "In your assessment, you MUST provide:\n"
            "- objective_results: clear summary of outcome against mission goals\n"
            "- blue_performance: detailed analysis of Blue tactical execution and resilience\n"
            "- red_performance: detailed analysis of Red offensive capability and attrition\n"
            "- resource_effects: assessment of supply, ammunition, and infrastructure state\n"
            "- risks: at least 2-3 specific operational, tactical, or strategic risks arising from this outcome\n"
            "- tradeoffs: at least 2-3 key tactical or strategic tradeoffs accepted during the engagement\n"
            "- uncertainties: at least 2 critical intelligence, operational, or environmental unknowns\n"
            "- strategic_implications: at least 2 broader implications for future scenario iterations\n"
            "Identify emergent events, decide simulation control (conclude vs continue), and recommend next scenario steps.\n"
            "Output MUST strictly adhere to the EvaluationOutput schema."
        )

        user_prompt = (
            f"Scenario: {contract.scenario_id}\n"
            f"Simulation Results: {sim_output.model_dump()}\n"
            f"Original Objectives: {contract.objectives.model_dump()}\n"
            f"Iteration: {iteration_count} of {max_iterations}\n"
        )

        try:
            eval_output = invoke_structured(
                role=self.role,
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                schema=EvaluationOutput,
                temperature=0.2
            )
        except Exception as e:
            if not is_fallback_allowed():
                raise e
            print(f"[bold yellow][AGENT WARNING][/bold yellow] Evaluation LLM failed: {e}. Using deterministic fallback.")
            eval_output = self._deterministic_fallback(contract, sim_output, iteration_count, max_iterations)

        # Build ScenarioTransition if continuing
        transition = None
        if not eval_output.simulation_control.concluded and eval_output.simulation_control.next_scenario_required:
            transition = ScenarioTransition(
                transition_id=f"TRANS-{contract.scenario_id}",
                current_scenario_id=contract.scenario_id,
                transition_type="CONTINUE",
                reason=eval_output.next_scenario.reason,
                evaluation_summary=eval_output.strategic_conclusion,
                emergent_events=[ev.model_dump() for ev in eval_output.emergent_events],
                required_changes=eval_output.next_scenario.required_changes,
                new_information=eval_output.next_scenario.required_information,
                human_input=["Review ceasefire proposal and confirm defensive redoubt limits"],
                next_scenario=TransitionNextScenario(
                    requested=True,
                    scenario_id=eval_output.next_scenario.scenario_id,
                    parent_scenario_id=contract.scenario_id
                )
            )

        return eval_output, transition
