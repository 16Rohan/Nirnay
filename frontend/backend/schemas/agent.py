from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class ContextRequest(BaseModel):
    scenario: str
    context_profile: str

class AgentContext(BaseModel):
    scenario_id: str
    world_state: Dict[str, Any]
    environment_summary: Optional[str] = None
    historical_context: List[Dict[str, Any]] = Field(default_factory=list)
    human_input: Optional[Dict[str, Any]] = None
    constraints: List[str] = Field(default_factory=list)
    objectives: List[str] = Field(default_factory=list)

class BlueTeamResponse(BaseModel):
    team: str = "BLUE"
    objective: str
    strategic_plan: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    expected_effects: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    confidence: float = Field(..., ge=0.0, le=1.0)

class RedTeamResponse(BaseModel):
    team: str = "RED"
    vulnerabilities: List[str] = Field(default_factory=list)
    adversarial_response: List[str] = Field(default_factory=list)
    expected_effects: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    confidence: float = Field(..., ge=0.0, le=1.0)

class EnvironmentResponse(BaseModel):
    environment_summary: str
    relevant_factors: List[str] = Field(default_factory=list)
    changes_since_previous_scenario: List[str] = Field(default_factory=list)
    uncertainties: List[str] = Field(default_factory=list)
    strategic_implications: List[str] = Field(default_factory=list)
