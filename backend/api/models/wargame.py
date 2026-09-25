"""
Data models for turn-based wargaming API endpoints.
Defines contracts for session initialization, human commands, agent state updates, and turn outcomes.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class ScenarioStartRequest(BaseModel):
    preset_id: str = "DEMO-001"
    turn_duration: str = "1m"
    human_guidance: Optional[str] = None
    human_constraints: Optional[str] = None
    seed: int = 42


class HumanCommandRequest(BaseModel):
    command: str = Field(..., description="Natural language human strategic command or operational directive.")
    advance_turn: bool = Field(True, description="Whether to immediately advance and execute the next turn.")


class TurnContinueRequest(BaseModel):
    notes: Optional[str] = None


class AgentStatusUpdate(BaseModel):
    agent: str
    status: str  # "idle" | "running" | "completed" | "failed"
    message: str
    elapsed_seconds: Optional[float] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class TurnMetrics(BaseModel):
    blue_losses_percentage: float = 0.0
    red_losses_percentage: float = 0.0
    termination_condition: str = "NORMAL"
    status: str = "COMPLETED"
    objectives: List[Dict[str, Any]] = Field(default_factory=list)


class EvaluationSummary(BaseModel):
    strategic_conclusion: str = ""
    risks: List[str] = Field(default_factory=list)
    tradeoffs: List[str] = Field(default_factory=list)
    uncertainties: List[str] = Field(default_factory=list)
    strategic_implications: List[str] = Field(default_factory=list)
    emergent_events: List[Dict[str, Any]] = Field(default_factory=list)


class TurnDecisions(BaseModel):
    blue_coa_name: str = ""
    blue_intent: str = ""
    blue_actions_count: int = 0
    red_intent: str = ""
    red_actions_count: int = 0


class TurnResult(BaseModel):
    session_id: str
    turn_number: int
    scenario_id: str
    parent_scenario_id: Optional[str] = None
    human_guidance: str
    concluded: bool = False
    session_status: str = "awaiting_decision"  # "awaiting_decision" | "concluded" | "running" | "error"
    metrics: TurnMetrics = Field(default_factory=TurnMetrics)
    evaluation: EvaluationSummary = Field(default_factory=EvaluationSummary)
    decisions: TurnDecisions = Field(default_factory=TurnDecisions)
    step_logs: List[str] = Field(default_factory=list)
    strategic_report: Optional[str] = None
    interpreted_command: Optional[Dict[str, Any]] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class SessionOverview(BaseModel):
    session_id: str
    preset_id: str
    theater: str
    current_turn: int
    status: str
    turn_duration: str
    created_at: str
    total_turns: int
    turns: List[TurnResult] = Field(default_factory=list)
