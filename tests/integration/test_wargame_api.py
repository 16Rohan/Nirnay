"""
Integration tests for turn-based wargaming API endpoints.
"""

from fastapi.testclient import TestClient
from backend.main import app
from backend.agents.orchestrator import OrchestratorAgent

client = TestClient(app)


def test_get_presets():
    response = client.get("/wargame/presets")
    assert response.status_code == 200
    presets = response.json()
    assert len(presets) >= 3
    preset_ids = [p["preset_id"] for p in presets]
    assert "DEMO-001" in preset_ids
    assert "BORDER-002" in preset_ids
    assert "COASTAL-003" in preset_ids


def test_get_single_preset():
    response = client.get("/wargame/presets/DEMO-001")
    assert response.status_code == 200
    data = response.json()
    assert data["preset_id"] == "DEMO-001"
    assert "Eastern Valley" in data["theater"]


def test_interpret_human_command_orchestrator():
    orchestrator = OrchestratorAgent()
    contract = orchestrator.interpret_human_command(
        command_text="Hold bridgehead at LOC-ALPHA, do not advance across the river, preserve 30% fuel reserve.",
        scenario_id="1"
    )
    assert contract is not None
    assert contract.scenario_id == "1"
    assert contract.input.text != ""
    assert len(contract.affected_agents) > 0


def test_wargame_session_lifecycle():
    # 1. Start wargame (Turn 1)
    start_payload = {
        "preset_id": "DEMO-001",
        "turn_duration": "30s",
        "human_guidance": "Test defensive perimeter at FLP Alpha",
        "seed": 42
    }
    response = client.post("/wargame/start", json=start_payload)
    assert response.status_code == 200
    turn1 = response.json()
    session_id = turn1["session_id"]
    assert turn1["turn_number"] == 1
    assert turn1["session_status"] == "awaiting_decision"
    assert "metrics" in turn1
    assert "evaluation" in turn1
    assert "decisions" in turn1
    assert len(turn1["step_logs"]) > 0

    # 2. Check session details
    session_resp = client.get(f"/wargame/session/{session_id}")
    assert session_resp.status_code == 200
    session_data = session_resp.json()
    assert session_data["total_turns"] == 1

    # 3. Submit a human command and advance to Turn 2
    cmd_payload = {
        "command": "Establish defensive ambushes on south bank. Conserve artillery rounds.",
        "advance_turn": True
    }
    cmd_resp = client.post(f"/wargame/command/{session_id}", json=cmd_payload)
    assert cmd_resp.status_code == 200
    turn2 = cmd_resp.json()
    assert turn2["turn_number"] == 2
    assert turn2["session_id"] == session_id
    assert turn2["session_status"] in ["awaiting_decision", "concluded"]
    assert turn2["interpreted_command"] is not None

    # 4. Verify consecutive turns state persistence
    session_resp2 = client.get(f"/wargame/session/{session_id}")
    assert session_resp2.status_code == 200
    session_data2 = session_resp2.json()
    assert session_data2["total_turns"] == 2
    assert len(session_data2["turns"]) == 2


def test_wargame_multi_turn_continue():
    # 1. Start wargame (Turn 1)
    start_payload = {
        "preset_id": "DEMO-001",
        "turn_duration": "30s",
        "human_guidance": "Anchor defensive line at Alpha",
        "seed": 42
    }
    start_resp = client.post("/wargame/start", json=start_payload)
    assert start_resp.status_code == 200
    turn1 = start_resp.json()
    session_id = turn1["session_id"]
    assert turn1["turn_number"] == 1

    # 2. Advance to Turn 2 via /wargame/continue
    cont_resp1 = client.post(f"/wargame/continue/{session_id}")
    assert cont_resp1.status_code == 200
    turn2 = cont_resp1.json()
    assert turn2["turn_number"] == 2
    assert turn2["session_id"] == session_id

    # 3. Advance to Turn 3 via /wargame/continue
    cont_resp2 = client.post(f"/wargame/continue/{session_id}")
    assert cont_resp2.status_code == 200
    turn3 = cont_resp2.json()
    assert turn3["turn_number"] == 3
    assert turn3["session_id"] == session_id

    # Verify session contains all 3 turns with sequential progression
    session_resp = client.get(f"/wargame/session/{session_id}")
    assert session_resp.status_code == 200
    session_data = session_resp.json()
    assert session_data["total_turns"] == 3
    turns = session_data["turns"]
    assert len(turns) == 3
    assert [t["turn_number"] for t in turns] == [1, 2, 3]
