from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class ScenarioContract(BaseModel):
    schema_version: str = "1.0"
    scenario_id: str
    parent_scenario: Optional[str] = None
    constraints: List[str] = Field(default_factory=list)
    mission: str
    objectives: List[str] = Field(default_factory=list)
    environment: Dict[str, Any] = Field(default_factory=dict)
    blue_state: Dict[str, Any] = Field(default_factory=dict)
    red_state: Dict[str, Any] = Field(default_factory=dict)
    events: List[Dict[str, Any]] = Field(default_factory=list)
    human_input: Dict[str, Any] = Field(default_factory=dict)
    outstanding_issues: List[str] = Field(default_factory=list)

class ScenarioCreateRequest(BaseModel):
    contract: ScenarioContract
    seed: Optional[int] = None
    configuration: Dict[str, Any] = Field(default_factory=dict)
