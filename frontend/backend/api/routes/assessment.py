from fastapi import APIRouter, HTTPException
from backend.schemas.assessment import EvaluationRequest, EvaluationResponse
from backend.models.assessment import EvaluationResult, StateTransition

router = APIRouter(prefix="/assessment", tags=["Assessment"])

@router.post("/", response_model=EvaluationResponse)
def evaluate_result(request: EvaluationRequest):
    # Deterministic evaluation boundary stub
    try:
        transition = StateTransition(
            action="CONTINUE",
            reasoning="Simulation requires further iteration.",
            proposed_scenario_id=f"{request.scenario_id}.1"
        )
        
        result = EvaluationResult(
            scenario_id=request.scenario_id,
            outcome_assessment="Blue team achieved partial objectives.",
            transition=transition,
            strategic_conclusion="Proceed to next scenario branch."
        )
        
        return EvaluationResponse(result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
