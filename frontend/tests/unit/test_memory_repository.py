import pytest
import os
from backend.database.repositories.memory_repository import MemoryRepository

def test_memory_repository_save_and_get(tmp_path):
    repo = MemoryRepository(base_dir=str(tmp_path))
    repo.save_active_scenario("1.1", "Sample content")
    
    content = repo.get_scenario("1.1")
    assert "Sample content" in content
    
    # Also test history
    repo.save_to_history("1.1", "Sample content")
    assert len(repo.get_history()) == 1
