"""
WebSocket communication manager for real-time agent status streaming and log broadcast.
"""

import asyncio
from typing import List, Dict, Optional, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.session_connections: Dict[str, List[WebSocket]] = {}
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop

    async def connect(self, websocket: WebSocket, session_id: Optional[str] = None):
        await websocket.accept()
        try:
            self.set_loop(asyncio.get_running_loop())
        except RuntimeError:
            pass
        if websocket not in self.active_connections:
            self.active_connections.append(websocket)
        if session_id:
            if session_id not in self.session_connections:
                self.session_connections[session_id] = []
            if websocket not in self.session_connections[session_id]:
                self.session_connections[session_id].append(websocket)

    def disconnect(self, websocket: WebSocket, session_id: Optional[str] = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if session_id and session_id in self.session_connections:
            if websocket in self.session_connections[session_id]:
                self.session_connections[session_id].remove(websocket)
            if not self.session_connections[session_id]:
                del self.session_connections[session_id]

    async def broadcast(self, message: dict, session_id: Optional[str] = None):
        targets = []
        if session_id and session_id in self.session_connections:
            targets.extend(self.session_connections[session_id])
        for c in self.active_connections:
            if c not in targets:
                targets.append(c)

        dead_connections = []
        for connection in list(targets):
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.append(connection)
        for dead in dead_connections:
            self.disconnect(dead, session_id)

    def broadcast_sync(self, message: dict, session_id: Optional[str] = None):
        """Thread-safe synchronous bridge for background worker callbacks."""
        try:
            loop = self._loop
            if not loop or loop.is_closed():
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    loop = None
            if loop and loop.is_running():
                asyncio.run_coroutine_threadsafe(self.broadcast(message, session_id), loop)
            elif loop and not loop.is_closed():
                loop.run_until_complete(self.broadcast(message, session_id))
        except Exception:
            pass


manager = ConnectionManager()


def parse_agent_from_log(msg: str) -> Optional[Dict[str, str]]:
    """Helper to detect agent transitions from rich log lines."""
    mapping = {
        "[MEMORY]": ("memory", "Resolving logical context"),
        "[ORCHESTRATOR]": ("orchestrator", "Synthesizing scenario contract"),
        "[VALIDATION]": ("validation", "Validating contract constraints"),
        "[SCENARIO GENERATOR]": ("generator", "Materializing simulation state"),
        "[ENVIRONMENT]": ("environment", "Assessing terrain and weather"),
        "[BLUE TEAM]": ("blue_team", "Formulating Course of Action"),
        "[RED TEAM]": ("red_team", "Formulating Adaptive Response"),
        "[SIMULATOR]": ("simulator", "Executing deterministic simulation"),
        "[EVALUATION]": ("evaluation", "Evaluating strategic outcomes"),
        "[PERSISTENT MEMORY]": ("memory", "Writing persistent outcome records"),
        "[REPORT AGENT]": ("report", "Compiling strategic decision report"),
    }
    for tag, (agent_name, label) in mapping.items():
        if tag in msg:
            return {"agent": agent_name, "label": label, "raw": msg}
    return None


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    manager.set_loop(asyncio.get_running_loop())
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.websocket("/ws/{session_id}")
async def session_websocket_endpoint(websocket: WebSocket, session_id: str):
    manager.set_loop(asyncio.get_running_loop())
    await manager.connect(websocket, session_id=session_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id=session_id)
