"""
Pydantic contracts strictly defining the data boundaries between
Reasoning Agents, Deterministic Simulation, Memory Resolver, and Human Operator.
Based on agy/contracts.md specification.
"""

from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


# ==========================================
# 1. Dynamic Scenario Contract
# ==========================================

class ScenarioMetadata(BaseModel):
    title: str = ""
    description: str = ""
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    time_horizon: str = "72h"
    classification: str = "DEMO"


class ScenarioObjectives(BaseModel):
    primary: List[str] = Field(default_factory=list)
    secondary: List[str] = Field(default_factory=list)
    success_conditions: List[str] = Field(default_factory=list)
    failure_conditions: List[str] = Field(default_factory=list)


class HardConstraint(BaseModel):
    id: str
    description: str
    enforcement: str = "BLOCK"


class ScenarioConstraints(BaseModel):
    hard: List[Union[HardConstraint, Dict[str, Any], str]] = Field(default_factory=list)
    operational: List[str] = Field(default_factory=list)
    resource: List[str] = Field(default_factory=list)
    political: List[str] = Field(default_factory=list)
    time: List[str] = Field(default_factory=list)
    simulation: List[str] = Field(default_factory=list)


class ScenarioActors(BaseModel):
    blue: Dict[str, Any] = Field(default_factory=dict)
    red: Dict[str, Any] = Field(default_factory=dict)
    third_party: List[Dict[str, Any]] = Field(default_factory=list)


class ScenarioGeography(BaseModel):
    area_of_operations: Dict[str, Any] = Field(default_factory=dict)
    key_locations: List[Dict[str, Any]] = Field(default_factory=list)
    terrain: Dict[str, Any] = Field(default_factory=dict)
    infrastructure: List[str] = Field(default_factory=list)


class ScenarioEnvironment(BaseModel):
    weather: Dict[str, Any] = Field(default_factory=dict)
    visibility: Dict[str, Any] = Field(default_factory=dict)
    terrain_conditions: Dict[str, Any] = Field(default_factory=dict)
    environmental_factors: List[str] = Field(default_factory=list)


class ScenarioRules(BaseModel):
    rules_of_engagement: List[str] = Field(default_factory=list)
    engagement_rules: List[str] = Field(default_factory=list)
    movement_rules: List[str] = Field(default_factory=list)
    detection_rules: List[str] = Field(default_factory=list)
    simulation_rules: List[str] = Field(default_factory=list)


class InformationState(BaseModel):
    known_facts: List[str] = Field(default_factory=list)
    uncertainties: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    intelligence_gaps: List[str] = Field(default_factory=list)


class HumanInputData(BaseModel):
    strategic_guidance: List[str] = Field(default_factory=list)
    selected_options: List[str] = Field(default_factory=list)
    operator_constraints: List[str] = Field(default_factory=list)


class ExternalInformation(BaseModel):
    sources: List[str] = Field(default_factory=list)
    relevant_events: List[str] = Field(default_factory=list)
    last_updated: Optional[str] = None


class ScenarioContract(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    scenario_id: str
    parent_scenario_id: Optional[str] = None
    metadata: ScenarioMetadata = Field(default_factory=ScenarioMetadata)
    objectives: ScenarioObjectives = Field(default_factory=ScenarioObjectives)
    constraints: ScenarioConstraints = Field(default_factory=ScenarioConstraints)
    actors: ScenarioActors = Field(default_factory=ScenarioActors)
    forces: Dict[str, List[Dict[str, Any]]] = Field(default_factory=lambda: {"blue": [], "red": [], "third_party": []})
    resources: Dict[str, Dict[str, Any]] = Field(default_factory=lambda: {"blue": {}, "red": {}, "shared": {}})
    geography: ScenarioGeography = Field(default_factory=ScenarioGeography)
    environment: ScenarioEnvironment = Field(default_factory=ScenarioEnvironment)
    initial_state: Dict[str, Any] = Field(default_factory=lambda: {"blue": {}, "red": {}, "third_party": {}, "civilian": {}})
    rules: ScenarioRules = Field(default_factory=ScenarioRules)
    information_state: InformationState = Field(default_factory=InformationState)
    human_input: HumanInputData = Field(default_factory=HumanInputData)
    external_information: ExternalInformation = Field(default_factory=ExternalInformation)
    dynamic: Dict[str, Any] = Field(default_factory=dict, alias="Dynamic")


# ==========================================
# 2. Agent Context Request Contract
# ==========================================

class ContextRequest(BaseModel):
    agent: str
    scenario_id: str
    context_profile: str
    requirements: List[str]
    max_context_tokens: int = 8000
    include_history: bool = True
    history_depth: int = 2


# ==========================================
# 3. Resolved Agent Context Contract
# ==========================================

class ContextSource(BaseModel):
    source_type: str
    scenario_id: str
    reference: str


class ResolvedAgentContext(BaseModel):
    context_id: str
    agent: str
    scenario_id: str
    context_profile: str
    memory_version: str
    resolved_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    context: Dict[str, Any]
    sources: List[ContextSource] = Field(default_factory=list)
    omitted: List[str] = Field(default_factory=list)
    token_estimate: int = 0


# ==========================================
# 4. Action & Decision Contracts
# ==========================================

class ActionPayload(BaseModel):
    action_id: str
    actor: str = "blue"
    unit_id: Optional[str] = None
    action_type: str = "HOLD"
    target_location: Optional[str] = None
    resource_requirements: Dict[str, Any] = Field(default_factory=dict)
    expected_effect: str = ""
    cost: float = 0.0
    risk: str = "LOW"
    prerequisites: List[str] = Field(default_factory=list)
    duration: str = "6h"


class BlueDecision(BaseModel):
    course_of_action_id: str
    name: str
    intent: str
    priority: str = "HIGH"


class BlueTeamOutput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    agent: str = "blue_team"
    scenario_id: str
    decision: BlueDecision
    actions: List[Union[ActionPayload, Dict[str, Any]]] = Field(default_factory=list)
    resource_allocation: Dict[str, Any] = Field(default_factory=dict)
    expected_effects: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    decision_rationale: List[str] = Field(default_factory=list)
    information_gaps: List[str] = Field(default_factory=list)
    dynamic: Dict[str, Any] = Field(default_factory=dict, alias="Dynamic")


# ==========================================
# 5. Red Team Output Contract
# ==========================================

class RedAssessment(BaseModel):
    blue_coa_reference: str
    red_objective: str
    intent: str


class RedTeamOutput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    agent: str = "red_team"
    scenario_id: str
    response_id: str
    assessment: RedAssessment
    actions: List[Union[ActionPayload, Dict[str, Any]]] = Field(default_factory=list)
    counter_actions: List[str] = Field(default_factory=list)
    resource_allocation: Dict[str, Any] = Field(default_factory=dict)
    expected_effects: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    decision_rationale: List[str] = Field(default_factory=list)
    information_gaps: List[str] = Field(default_factory=list)
    dynamic: Dict[str, Any] = Field(default_factory=dict, alias="Dynamic")


# ==========================================
# 6. Environment Agent Output Contract
# ==========================================

class OperationalImplications(BaseModel):
    blue: List[str] = Field(default_factory=list)
    red: List[str] = Field(default_factory=list)
    shared: List[str] = Field(default_factory=list)


class EnvironmentOutput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    agent: str = "environment"
    scenario_id: str
    environment_assessment: Dict[str, Any] = Field(default_factory=dict)
    operational_implications: OperationalImplications = Field(default_factory=OperationalImplications)
    constraints: List[str] = Field(default_factory=list)
    opportunities: List[str] = Field(default_factory=list)
    uncertainties: List[str] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)
    dynamic: Dict[str, Any] = Field(default_factory=dict, alias="Dynamic")


# ==========================================
# 7. Deterministic Simulation Input Contract
# ==========================================

class SimulationPlan(BaseModel):
    course_of_action_id: Optional[str] = None
    response_id: Optional[str] = None
    actions: List[Union[ActionPayload, Dict[str, Any]]] = Field(default_factory=list)
    resource_allocation: Dict[str, Any] = Field(default_factory=dict)


class SimulationInput(BaseModel):
    simulation_id: str
    scenario_id: str
    current_turn: int = 1
    initial_state: Dict[str, Any]
    environment: Dict[str, Any] = Field(default_factory=dict)
    resources: Dict[str, Any] = Field(default_factory=dict)
    intelligence: Dict[str, Any] = Field(default_factory=dict)
    blue_plan: SimulationPlan
    red_plan: SimulationPlan
    rules: Dict[str, List[str]] = Field(default_factory=dict)
    previous_actions: List[Dict[str, Any]] = Field(default_factory=list)
    time_horizon: str = "24h"
    seed: int = 42


# ==========================================
# 8. Simulation Output Contract
# ==========================================

class SimulationTermination(BaseModel):
    reason: str
    time: str
    condition: str


class SimulationOutput(BaseModel):
    simulation_id: str
    scenario_id: str
    turn: int = 1
    status: str = "COMPLETED"
    seed: int = 42
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    final_state: Dict[str, Any] = Field(default_factory=dict)
    action_results: List[Dict[str, Any]] = Field(default_factory=list)
    metrics: Dict[str, Any] = Field(default_factory=dict)
    events: List[Dict[str, Any]] = Field(default_factory=list)
    resource_changes: List[Dict[str, Any]] = Field(default_factory=list)
    objective_results: List[Dict[str, Any]] = Field(default_factory=list)
    emergent_events: List[Dict[str, Any]] = Field(default_factory=list)
    termination: SimulationTermination


# ==========================================
# 9. Evaluation Output Contract
# ==========================================

class EmergentEvent(BaseModel):
    event_id: str
    type: str
    description: str
    impact: str = ""
    requires_response: bool = True


class SimulationControl(BaseModel):
    concluded: bool = False
    termination_reason: Optional[str] = None
    continue_reason: str = ""
    next_scenario_required: bool = True


class NextScenarioRecommendation(BaseModel):
    scenario_id: str
    parent_scenario_id: str
    reason: str
    required_changes: List[str] = Field(default_factory=list)
    required_information: List[str] = Field(default_factory=list)


class EvaluationAssessment(BaseModel):
    objective_results: str = ""
    blue_performance: str = ""
    red_performance: str = ""
    resource_effects: str = ""
    risks: List[str] = Field(default_factory=list)
    tradeoffs: List[str] = Field(default_factory=list)
    uncertainties: List[str] = Field(default_factory=list)
    strategic_implications: List[str] = Field(default_factory=list)


class EvaluationOutput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    agent: str = "evaluation"
    scenario_id: str
    simulation_id: str
    assessment: EvaluationAssessment = Field(default_factory=EvaluationAssessment)
    emergent_events: List[EmergentEvent] = Field(default_factory=list)
    simulation_control: SimulationControl
    next_scenario: NextScenarioRecommendation
    strategic_conclusion: str
    human_review_required: bool = False
    dynamic: Dict[str, Any] = Field(default_factory=dict, alias="Dynamic")


# ==========================================
# 10. Human Input Contract
# ==========================================

class OperatorInputPayload(BaseModel):
    text: str = ""
    selected_options: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)


class HumanInputContract(BaseModel):
    input_id: str
    scenario_id: str
    stage: str = "STRATEGY"
    operator_action: str = "GUIDANCE"
    input: OperatorInputPayload
    affected_agents: List[str] = Field(default_factory=lambda: ["blue_team", "red_team"])
    terminate_agents: List[str] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ==========================================
# 11. Persistent Memory Write Contract
# ==========================================

class MemoryWriteContent(BaseModel):
    events: List[str] = Field(default_factory=list)
    decisions: List[str] = Field(default_factory=list)
    outcomes: List[str] = Field(default_factory=list)
    unresolved_issues: List[str] = Field(default_factory=list)
    human_interventions: List[str] = Field(default_factory=list)


class MemoryProvenance(BaseModel):
    source: str
    simulation_id: Optional[str] = None


class MemoryWriteContract(BaseModel):
    memory_write_id: str
    scenario_id: str
    source_agent: str
    memory_type: str = "scenario_outcome"
    operation: str = "APPEND"
    content: MemoryWriteContent
    provenance: MemoryProvenance
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ==========================================
# 12. External Information / Provenance Contract
# ==========================================

class SourceDetails(BaseModel):
    publisher: str
    publication: str = ""
    source_type: str = "official"
    authority_tier: int = 1
    url: str = ""
    published_at: str = ""
    retrieved_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ClaimDetails(BaseModel):
    claim_id: str
    statement: str
    claim_type: str = "reported_event"
    status: str = "REPORTED"
    confidence: float = 0.0


class CorroborationDetails(BaseModel):
    independent_sources: List[str] = Field(default_factory=list)
    corroborated: bool = False


class ClaimRelevance(BaseModel):
    scenario_id: str
    relevance: str
    affected_fields: List[str] = Field(default_factory=list)


class SourceProvenance(BaseModel):
    source_id: str
    source: SourceDetails
    claim: ClaimDetails
    corroboration: CorroborationDetails = Field(default_factory=CorroborationDetails)
    relevance: Optional[ClaimRelevance] = None


# ==========================================
# 13. Orchestrator -> Next Scenario Transition Contract
# ==========================================

class TransitionNextScenario(BaseModel):
    requested: bool = True
    scenario_id: str
    parent_scenario_id: str


class ScenarioTransition(BaseModel):
    transition_id: str
    current_scenario_id: str
    transition_type: str = "CONTINUE"
    reason: str
    evaluation_summary: str = ""
    emergent_events: List[Dict[str, Any]] = Field(default_factory=list)
    required_changes: List[str] = Field(default_factory=list)
    new_information: List[str] = Field(default_factory=list)
    human_input: List[str] = Field(default_factory=list)
    next_scenario: TransitionNextScenario
