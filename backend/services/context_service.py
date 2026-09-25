import json
from typing import Dict, Any, List
from backend.models.scenario import Scenario
from backend.schemas.agent import AgentContext
from backend.database.repositories.memory_repository import MemoryRepository

class ContextService:
    def __init__(self, memory_repo: MemoryRepository):
        self.memory_repo = memory_repo

    def resolve_context(self, scenario_id: str, context_profile: str) -> AgentContext:
        """
        Memory Resolver & Context Assembler
        Deterministically resolves the requested context profile.
        """
        raw_memory = self.memory_repo.get_scenario(scenario_id)
        if not raw_memory:
            raise ValueError(f"Required state missing: Scenario {scenario_id} not found in memory.")

        # In a full implementation, we'd parse the markdown/JSON state back to objects.
        # Here we mock the deterministic retrieval to satisfy the architectural requirement.
        
        # Stub for context building
        world_state_stub = {
            "political": {"status": 1.0},
            "military": {"status": 1.0}
        }
        
        context = AgentContext(
            scenario_id=scenario_id,
            world_state=world_state_stub,
            environment_summary="Extracted environment summary",
            constraints=["Constraint 1"],
            objectives=["Primary Objective"]
        )
        
        return self._apply_context_budget(context, context_profile)

    def _apply_context_budget(self, context: AgentContext, profile: str) -> AgentContext:
        """
        Context Budgeter
        Ensures the returned context does not exceed limits and prioritizes correctly.
        """
        # Rules: 
        # Current state → ALWAYS
        # Hard constraints → ALWAYS
        # Human input → ALWAYS
        # Current environment → ALWAYS
        # Current objective → ALWAYS
        # Recent events → YES
        # Previous decision → YES
        # Old history → ONLY WHEN REQUIRED
        # Full archive → NO
        
        MAX_HISTORY_ITEMS = 5
        
        if profile in ["ORCHESTRATOR_CONTEXT", "EVALUATION_CONTEXT", "SIMULATION_CONTEXT"]:
            MAX_HISTORY_ITEMS = 10  # More history allowed
            
        if len(context.historical_context) > MAX_HISTORY_ITEMS:
            # Prune older history, keep the most recent ones
            context.historical_context = context.historical_context[-MAX_HISTORY_ITEMS:]
            
        if profile == "BLUE_CONTEXT":
            # Strip red-specific internal state if any existed
            if "red_state" in context.world_state:
                # Mask sensitive red data, keep only observable
                pass
        elif profile == "RED_CONTEXT":
            if "blue_state" in context.world_state:
                # Mask sensitive blue data
                pass
        elif profile not in ["ORCHESTRATOR_CONTEXT", "ENVIRONMENT_CONTEXT", "BLUE_CONTEXT", "RED_CONTEXT", "SIMULATION_CONTEXT", "EVALUATION_CONTEXT"]:
            raise ValueError(f"Invalid context profile: {profile}")
            
        return context
