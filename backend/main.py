from fastapi import FastAPI
from backend.api.routes import scenario, simulation, agents, threats, strategies, assessment, websocket

app = FastAPI(title="NIRNAY - Wargaming AI Backend", version="0.1.0")

app.include_router(scenario.router)
app.include_router(simulation.router)
app.include_router(agents.router)
app.include_router(threats.router)
app.include_router(strategies.router)
app.include_router(assessment.router)
app.include_router(websocket.router)

@app.get("/")
def read_root():
    return {"status": "ok", "system": "NIRNAY"}
