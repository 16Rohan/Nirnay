from fastapi import APIRouter, HTTPException
from backend.models.scenario import Scenario, WorldState
from backend.schemas.scenario import ScenarioCreateRequest
from backend.simulation.scenarios.scenario_generator import generate_scenario

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])

@router.post("/", response_model=Scenario)
def create_scenario(request: ScenarioCreateRequest):
    try:
        scenario = generate_scenario(request.contract, request.seed, request.configuration)
        return scenario
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
