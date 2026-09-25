from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])

class ExternalIntelligenceEvent(BaseModel):
    source: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    confidence: float = Field(..., ge=0.0, le=1.0)
    provenance: str
    event_type: str
    affected_world_state_domain: str
    strategic_relevance: str

class IntelligenceIngestRequest(BaseModel):
    events: List[ExternalIntelligenceEvent]

@router.post("/ingest")
def ingest_intelligence(request: IntelligenceIngestRequest):
    # This acts as the boundary. External events do NOT mutate simulation state directly.
    # They are persisted in the intelligence/ folder for later evaluation.
    try:
        # Stub implementation
        return {"status": "success", "events_processed": len(request.events)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
