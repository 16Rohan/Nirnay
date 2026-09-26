"""
State definition for LangGraph wargaming orchestration pipeline.
Carries structured contracts between agent and deterministic execution nodes.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from backend.schemas.contracts import (
    ScenarioContract,
    ResolvedAgentContext,
    EnvironmentOutput,
    BlueTeamOutput,
    RedTeamOutput,
    SimulationInput,
    SimulationOutput,
    EvaluationOutput,
    ScenarioTransition,
    HumanInputContract,
)


class WargameState(BaseModel):
    scenario_id: str = "1"
    parent_scenario_id: Optional[str] = None
    iteration_count: int = 1
    max_iterations: int = 2
    human_guidance: str = "Maintain defensive redoubt at LOC-ALPHA; avoid cross-border escalation."
    turn_based: bool = False
    
    # State Artifacts / Contracts
    context: Optional[ResolvedAgentContext] = None
    scenario_contract: Optional[ScenarioContract] = None
    validation_passed: bool = True
    validation_errors: List[str] = Field(default_factory=list)
    
    environment_output: Optional[EnvironmentOutput] = None
    blue_output: Optional[BlueTeamOutput] = None
    red_output: Optional[RedTeamOutput] = None
    previous_blue_output: Optional[BlueTeamOutput] = None
    previous_red_output: Optional[RedTeamOutput] = None
    previous_simulation_output: Optional[SimulationOutput] = None
    human_intent_contract: Optional[HumanInputContract] = None
    
    simulation_input: Optional[SimulationInput] = None
    simulation_output: Optional[SimulationOutput] = None
    evaluation_output: Optional[EvaluationOutput] = None
    scenario_transition: Optional[ScenarioTransition] = None
    
    concluded: bool = False
    strategic_report: Optional[str] = None
    step_logs: List[str] = Field(default_factory=list)
