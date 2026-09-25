from pydantic import BaseModel
from backend.models.assessment import EvaluationResult

class EvaluationRequest(BaseModel):
    scenario_id: str
    simulation_result_id: str

class EvaluationResponse(BaseModel):
    result: EvaluationResult
