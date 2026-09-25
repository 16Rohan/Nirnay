import pytest
from backend.services.context_service import ContextService
from backend.database.repositories.memory_repository import MemoryRepository

class MockMemoryRepository(MemoryRepository):
    def __init__(self):
        pass
    def get_scenario(self, scenario_id: str):
        if scenario_id == "1.1":
            return "# Active Scenario: 1.1\n\nContent"
        return None

def test_resolve_context_missing():
    service = ContextService(MockMemoryRepository())
    with pytest.raises(ValueError, match="Required state missing"):
        service.resolve_context("missing_id", "BLUE_CONTEXT")

def test_resolve_context_success():
    service = ContextService(MockMemoryRepository())
    context = service.resolve_context("1.1", "BLUE_CONTEXT")
    assert context.scenario_id == "1.1"
    assert context.world_state["political"]["status"] == 1.0
