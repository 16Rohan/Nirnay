from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime

class StateTransition(BaseModel):
    action: str = Field(..., description="CONTINUE or CONCLUDE")
    reasoning: str
    proposed_scenario_id: Optional[str] = None
    state_updates: Dict[str, Any] = Field(default_factory=dict)

class EvaluationResult(BaseModel):
    scenario_id: str
    outcome_assessment: str
    transition: StateTransition
    emergent_events_recorded: List[str] = Field(default_factory=list)
    strategic_conclusion: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
