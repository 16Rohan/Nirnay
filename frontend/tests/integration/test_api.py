from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "system": "NIRNAY"}

def test_websocket():
    with client.websocket_connect("/ws") as websocket:
        websocket.send_json({"event": "ping"})
        # Just verifying it connects without error

def test_intelligence_ingest():
    payload = {
        "events": [{
            "source": "GDELT",
            "confidence": 0.9,
            "provenance": "url",
            "event_type": "conflict",
            "affected_world_state_domain": "military",
            "strategic_relevance": "high"
        }]
    }
    response = client.post("/intelligence/ingest", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "success"
