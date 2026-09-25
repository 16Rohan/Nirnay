import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

class MemoryRepository:
    def __init__(self, base_dir: str = "data/memory"):
        self.base_dir = base_dir
        self.active_scenario_file = os.path.join(self.base_dir, "active_scenario.md")
        self.history_dir = os.path.join(self.base_dir, "scenario_history")
        self.outstanding_dir = os.path.join(self.base_dir, "outstanding")
        self.intelligence_dir = os.path.join(self.base_dir, "intelligence")
        self.reports_dir = os.path.join(self.base_dir, "reports")
        
        self._ensure_directories()
        
    def _ensure_directories(self):
        os.makedirs(self.base_dir, exist_ok=True)
        os.makedirs(self.history_dir, exist_ok=True)
        os.makedirs(self.outstanding_dir, exist_ok=True)
        os.makedirs(self.intelligence_dir, exist_ok=True)
        os.makedirs(self.reports_dir, exist_ok=True)
        
    def save_active_scenario(self, scenario_id: str, content: str):
        with open(self.active_scenario_file, "w", encoding="utf-8") as f:
            f.write(f"# Active Scenario: {scenario_id}\n\n{content}")
            
    def get_scenario(self, scenario_id: str) -> Optional[str]:
        # First check if it's the active scenario
        if os.path.exists(self.active_scenario_file):
            with open(self.active_scenario_file, "r", encoding="utf-8") as f:
                content = f.read()
                if f"# Active Scenario: {scenario_id}" in content:
                    return content
        
        # Then check history
        history_file = os.path.join(self.history_dir, f"{scenario_id}.md")
        if os.path.exists(history_file):
            with open(history_file, "r", encoding="utf-8") as f:
                return f.read()
        return None
        
    def save_to_history(self, scenario_id: str, content: str):
        history_file = os.path.join(self.history_dir, f"{scenario_id}.md")
        with open(history_file, "w", encoding="utf-8") as f:
            f.write(content)
            
    def get_history(self) -> List[str]:
        history = []
        for filename in os.listdir(self.history_dir):
            if filename.endswith(".md"):
                with open(os.path.join(self.history_dir, filename), "r", encoding="utf-8") as f:
                    history.append(f.read())
        return history
