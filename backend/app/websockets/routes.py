from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
from app.websockets.manager import manager, redis_subscriber

router = APIRouter()


@router.websocket("/ws/match/{match_id}")
async def match_websocket(websocket: WebSocket, match_id: int):
    await manager.connect(websocket, match_id)
    subscriber_task = asyncio.create_task(redis_subscriber(match_id))
    try:
        await manager.send_personal(websocket, {
            "type": "connected",
            "match_id": match_id,
            "message": f"Connected to match {match_id} live feed",
        })
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                # Handle ping/pong
                if data == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "heartbeat"})
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        manager.disconnect(websocket, match_id)
        subscriber_task.cancel()
