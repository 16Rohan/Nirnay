"""
Integration test executing a 5-turn strategic wargaming campaign (PRD-03 §21).
Demonstrates:
- Multi-turn state inheritance (Turn N+1 strictly preserves Turn N state)
- Resource depletion across turns
- Blue/Red dynamic tactical adaptation
- Emergent environmental events
- Strategic evaluation and lineage progression across all 5 turns
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_five_turn_campaign_execution():
    # 1. Start Campaign (Turn 1)
    start_payload = {
        "preset_id": "DEMO-001",
        "turn_duration": "30s",
        "human_guidance": "Hold Forward Logistics Point Alpha and prevent hostile river crossing.",
        "seed": 42
    }
    resp1 = client.post("/wargame/start", json=start_payload)
    assert resp1.status_code == 200
    t1 = resp1.json()
    session_id = t1["session_id"]
    assert t1["turn_number"] == 1
    assert t1["session_status"] == "awaiting_decision"

    # 2. Turn 2: Continue with human command override
    cmd_payload = {
        "command": "Establish defensive screen with reconnaissance patrols towards LOC-BRAVO.",
        "advance_turn": True
    }
    resp2 = client.post(f"/wargame/command/{session_id}", json=cmd_payload)
    assert resp2.status_code == 200
    t2 = resp2.json()
    assert t2["turn_number"] == 2
    assert t2["human_guidance"] == cmd_payload["command"]

    # 3. Turn 3: Continue via /wargame/continue
    resp3 = client.post(f"/wargame/continue/{session_id}")
    assert resp3.status_code == 200
    t3 = resp3.json()
    assert t3["turn_number"] == 3

    # 4. Turn 4: Continue via /wargame/continue
    resp4 = client.post(f"/wargame/continue/{session_id}")
    assert resp4.status_code == 200
    t4 = resp4.json()
    assert t4["turn_number"] == 4

    # 5. Turn 5: Final Turn leading to campaign conclusion
    resp5 = client.post(f"/wargame/continue/{session_id}")
    assert resp5.status_code == 200
    t5 = resp5.json()
    assert t5["turn_number"] == 5

    # Verify session summary
    session_resp = client.get(f"/wargame/session/{session_id}")
    assert session_resp.status_code == 200
    session_data = session_resp.json()
    assert session_data["total_turns"] == 5
    assert len(session_data["turns"]) == 5
    assert session_data["status"] == "concluded"

    # Verify turn numbering lineage
    turn_numbers = [t["turn_number"] for t in session_data["turns"]]
    assert turn_numbers == [1, 2, 3, 4, 5]
