from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class SimulationEvent(BaseModel):
    event_id: str
    scenario_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    trigger: str
    event_type: str
    description: str
    affected_domains: List[str] = Field(default_factory=list)
    severity: float = Field(..., ge=0.0, le=1.0)
    seed: Optional[int] = None
    state_changes: Dict[str, Any] = Field(default_factory=dict)

class SimulationResult(BaseModel):
    scenario_id: str
    seed: int
    configuration: Dict[str, Any]
    initial_state_version: int
    resulting_state_version: int
    events: List[SimulationEvent] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    reproducibility_metadata: Dict[str, Any] = Field(default_factory=dict)
    outcome_distribution: Optional[Dict[str, float]] = None # For Monte Carlo
    confidence_intervals: Optional[Dict[str, List[float]]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
