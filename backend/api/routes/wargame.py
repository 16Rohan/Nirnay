"""
Turn-based Wargaming API routes for NIRNAY.
Endpoints for scenario presets, starting wargames, continuing turns, and processing HITL commands.
"""

import asyncio
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks

from backend.config.presets import list_presets, get_preset, ScenarioPreset
from backend.api.models.wargame import (
    ScenarioStartRequest,
    HumanCommandRequest,
    TurnContinueRequest,
    TurnResult,
    SessionOverview,
)
from backend.orchestration.session import session_store
from backend.orchestration.graph import orchestrator_agent
from backend.api.routes.websocket import manager, parse_agent_from_log

router = APIRouter(prefix="/wargame", tags=["Wargaming"])


def _broadcast_turn_log(session_id: str, raw_log: str):
    """Callback passed to run_turn to stream logs to WebSocket clients."""
    agent_info = parse_agent_from_log(raw_log)
    payload = {
        "type": "log",
        "session_id": session_id,
        "log": raw_log,
    }
    if agent_info:
        payload["agent_event"] = agent_info

    manager.broadcast_sync(payload, session_id=session_id)


def _broadcast_stage_event(session_id: str, evt: Dict[str, Any]):
    """Callback passed to run_turn to stream structured stage lifecycle events to WebSocket clients."""
    evt["session_id"] = session_id
    manager.broadcast_sync(evt, session_id=session_id)


@router.get("/presets", response_model=List[ScenarioPreset])
async def get_presets():
    """Retrieve all available operational scenario presets."""
    return list_presets()


@router.get("/presets/{preset_id}", response_model=ScenarioPreset)
async def get_preset_by_id(preset_id: str):
    """Retrieve details for a specific scenario preset."""
    return get_preset(preset_id)


@router.post("/session/init")
async def init_session(request: ScenarioStartRequest):
    """
    Initializes a session in memory and reserves a session_id.
    Allows frontend to establish WebSocket connection BEFORE launching Turn 1.
    """
    try:
        manager.set_loop(asyncio.get_running_loop())
    except RuntimeError:
        pass

    session = session_store.create_session(
        preset_id=request.preset_id,
        turn_duration=request.turn_duration,
        human_guidance=request.human_guidance,
        human_constraints=request.human_constraints,
        seed=request.seed,
        session_id=request.session_id
    )
    return {"session_id": session.session_id, "preset_id": session.preset_id}


@router.post("/start", response_model=TurnResult)
async def start_wargame(request: ScenarioStartRequest):
    """
    Initialize a new wargaming session and execute Turn 1.
    Streams agent status updates over WebSocket (/ws/{session_id}).
    """
    try:
        manager.set_loop(asyncio.get_running_loop())
    except RuntimeError:
        pass

    session = session_store.get_session(request.session_id) if request.session_id else None
    if not session:
        session = session_store.create_session(
            preset_id=request.preset_id,
            turn_duration=request.turn_duration,
            human_guidance=request.human_guidance,
            human_constraints=request.human_constraints,
            seed=request.seed,
            session_id=request.session_id
        )

    # Broadcast session initialization
    await manager.broadcast({
        "type": "session_started",
        "session_id": session.session_id,
        "preset_id": session.preset_id,
        "turn": 1
    }, session_id=session.session_id)

    # Execute Turn 1 in thread pool to prevent blocking asyncio loop
    try:
        turn_result = await asyncio.to_thread(
            session_store.run_turn,
            session.session_id,
            human_guidance_override=None,
            command_contract=None,
            log_callback=lambda log: _broadcast_turn_log(session.session_id, log),
            event_callback=lambda evt: _broadcast_stage_event(session.session_id, evt)
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        await manager.broadcast({
            "type": "error",
            "session_id": session.session_id,
            "error": str(e)
        }, session_id=session.session_id)
        raise HTTPException(status_code=500, detail=f"Turn execution failed: {str(e)}")

    await manager.broadcast({
        "type": "turn_completed",
        "session_id": session.session_id,
        "turn": turn_result.turn_number,
        "status": turn_result.session_status
    }, session_id=session.session_id)

    return turn_result


@router.post("/continue/{session_id}", response_model=TurnResult)
async def continue_wargame(session_id: str, request: Optional[TurnContinueRequest] = None):
    """
    Advance the wargame to the next turn (Turn N+1) without command modifications.
    """
    try:
        manager.set_loop(asyncio.get_running_loop())
    except RuntimeError:
        pass

    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Wargame session '{session_id}' not found.")

    if session.status == "concluded":
        raise HTTPException(status_code=400, detail="Wargame has already concluded.")

    await manager.broadcast({
        "type": "turn_started",
        "session_id": session_id,
        "turn": session.current_turn + 1
    }, session_id=session_id)

    try:
        turn_result = await asyncio.to_thread(
            session_store.run_turn,
            session_id,
            human_guidance_override=None,
            command_contract=None,
            log_callback=lambda log: _broadcast_turn_log(session_id, log),
            event_callback=lambda evt: _broadcast_stage_event(session_id, evt)
        )
    except Exception as e:
        await manager.broadcast({
            "type": "error",
            "session_id": session_id,
            "error": str(e)
        }, session_id=session_id)
        raise HTTPException(status_code=500, detail=f"Continue turn failed: {str(e)}")

    await manager.broadcast({
        "type": "turn_completed",
        "session_id": session_id,
        "turn": turn_result.turn_number,
        "status": turn_result.session_status
    }, session_id=session_id)

    return turn_result


@router.post("/command/{session_id}", response_model=TurnResult)
async def submit_human_command(session_id: str, request: HumanCommandRequest):
    """
    Interpret natural-language human command via Orchestrator LLM and execute next turn.
    """
    try:
        manager.set_loop(asyncio.get_running_loop())
    except RuntimeError:
        pass

    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Wargame session '{session_id}' not found.")

    if session.status == "concluded":
        raise HTTPException(status_code=400, detail="Wargame has already concluded.")

    # 1. Interpret command using Orchestrator NIM LLM
    scenario_id = session.last_state.scenario_id if session.last_state else "1"
    try:
        command_contract = await asyncio.to_thread(
            orchestrator_agent.interpret_human_command,
            request.command,
            scenario_id,
            session.human_guidance
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"HITL command interpretation failed: {str(e)}")

    session.last_interpreted_command = command_contract.model_dump()

    await manager.broadcast({
        "type": "command_interpreted",
        "session_id": session_id,
        "command": request.command,
        "contract": session.last_interpreted_command
    }, session_id=session_id)

    # Deterministic conflict check: Impossible command
    if command_contract.structured_intent and command_contract.structured_intent.conflict_detected:
        conflict_msg = command_contract.structured_intent.conflict_reason or "Directive cannot be executed because it violates physical battlefield constraints."
        await manager.broadcast({
            "type": "command_conflict",
            "session_id": session_id,
            "command": request.command,
            "reason": conflict_msg
        }, session_id=session_id)
        raise HTTPException(status_code=400, detail=conflict_msg)

    # 2. Advance to next turn if requested
    if request.advance_turn:
        try:
            turn_result = await asyncio.to_thread(
                session_store.run_turn,
                session_id,
                human_guidance_override=None,
                command_contract=command_contract,
                log_callback=lambda log: _broadcast_turn_log(session_id, log),
                event_callback=lambda evt: _broadcast_stage_event(session_id, evt)
            )
        except Exception as e:
            await manager.broadcast({
                "type": "error",
                "session_id": session_id,
                "error": str(e)
            }, session_id=session_id)
            raise HTTPException(status_code=500, detail=f"Turn execution with command failed: {str(e)}")

        await manager.broadcast({
            "type": "turn_completed",
            "session_id": session_id,
            "turn": turn_result.turn_number,
            "status": turn_result.session_status
        }, session_id=session_id)

        return turn_result

    # If advance_turn is False, return latest turn with interpreted command attached
    if session.turns:
        latest = session.turns[-1].model_copy()
        latest.interpreted_command = session.last_interpreted_command
        return latest

    raise HTTPException(status_code=400, detail="Session has no turns executed yet.")


@router.get("/session/{session_id}", response_model=SessionOverview)
async def get_session_details(session_id: str):
    """Retrieve full wargame session details including all past turns."""
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    preset = get_preset(session.preset_id)
    return SessionOverview(
        session_id=session.session_id,
        preset_id=session.preset_id,
        theater=preset.theater,
        current_turn=session.current_turn,
        status=session.status,
        turn_duration=session.turn_duration,
        created_at=session.created_at,
        total_turns=len(session.turns),
        turns=session.turns
    )


@router.get("/sessions", response_model=List[SessionOverview])
async def list_active_sessions():
    """List all wargaming sessions in memory."""
    return session_store.list_sessions()
