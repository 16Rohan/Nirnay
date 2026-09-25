from fastapi import APIRouter, HTTPException, Depends
from backend.schemas.agent import ContextRequest, AgentContext
from backend.services.context_service import ContextService
from backend.database.repositories.memory_repository import MemoryRepository

router = APIRouter(prefix="/context", tags=["Agents"])

def get_context_service():
    repo = MemoryRepository()
    return ContextService(repo)

@router.post("/resolve", response_model=AgentContext)
def resolve_context(request: ContextRequest, service: ContextService = Depends(get_context_service)):
    try:
        return service.resolve_context(request.scenario, request.context_profile)
    except ValueError as e:
        # Explicit failure for missing memory
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
