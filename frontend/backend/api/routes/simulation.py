from fastapi import APIRouter, HTTPException
from backend.models.simulation import SimulationResult
from pydantic import BaseModel

router = APIRouter(prefix="/scenarios", tags=["Simulation"])

class SimulationRequest(BaseModel):
    seed: int = 42

@router.post("/{scenario_id}/simulate", response_model=SimulationResult)
def run_simulation(scenario_id: str, request: SimulationRequest):
    # Deterministic simulation interface stub
    # Will integrate with engine.py
    try:
        return SimulationResult(
            scenario_id=scenario_id,
            seed=request.seed,
            configuration={},
            initial_state_version=1,
            resulting_state_version=2,
            events=[]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
