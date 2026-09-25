from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime

class WorldStateDomain(BaseModel):
    status: float = Field(..., ge=0.0, le=1.0)
    changes: List[str] = Field(default_factory=list)
    confidence: float = Field(..., ge=0.0, le=1.0)
    relevant_events: List[str] = Field(default_factory=list)
    source: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class WorldState(BaseModel):
    political: WorldStateDomain
    diplomatic: WorldStateDomain
    military: WorldStateDomain
    economic: WorldStateDomain
    geographic: WorldStateDomain
    humanitarian: WorldStateDomain
    infrastructure: WorldStateDomain
    information: WorldStateDomain
    environmental: WorldStateDomain
    
    scenario_id: str
    parent_scenario_id: Optional[str] = None
    version: int = 1
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    assumptions: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    objectives: List[str] = Field(default_factory=list)
    blue_state: Dict[str, Any] = Field(default_factory=dict)
    red_state: Dict[str, Any] = Field(default_factory=dict)
    outstanding_issues: List[str] = Field(default_factory=list)
    active_events: List[str] = Field(default_factory=list)

class ScenarioMetadata(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    seed: Optional[int] = None
    configuration: Dict[str, Any] = Field(default_factory=dict)

class Scenario(BaseModel):
    id: str
    parent_id: Optional[str] = None
    lineage: List[str] = Field(default_factory=list)
    world_state: WorldState
    metadata: ScenarioMetadata
