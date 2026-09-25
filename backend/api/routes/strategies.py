from fastapi import APIRouter, HTTPException
from backend.schemas.agent import BlueTeamResponse, RedTeamResponse
from pydantic import BaseModel

router = APIRouter(prefix="/strategies", tags=["Strategies"])

class SubmitBlueStrategyRequest(BaseModel):
    scenario_id: str
    response: BlueTeamResponse

class SubmitRedStrategyRequest(BaseModel):
    scenario_id: str
    response: RedTeamResponse

@router.post("/blue")
def submit_blue_strategy(request: SubmitBlueStrategyRequest):
    try:
        return {"status": "success", "strategy_id": "blue-123"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/red")
def submit_red_strategy(request: SubmitRedStrategyRequest):
    try:
        return {"status": "success", "strategy_id": "red-123"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
