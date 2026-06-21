from fastapi import WebSocket
from typing import Dict, Set
import json
import asyncio
import redis.asyncio as aioredis
from app.core.config import settings


class ConnectionManager:
    def __init__(self):
        # match_id -> set of websockets
        self.connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, match_id: int):
        await websocket.accept()
        if match_id not in self.connections:
            self.connections[match_id] = set()
        self.connections[match_id].add(websocket)

    def disconnect(self, websocket: WebSocket, match_id: int):
        if match_id in self.connections:
            self.connections[match_id].discard(websocket)
            if not self.connections[match_id]:
                del self.connections[match_id]

    async def broadcast(self, match_id: int, message: dict):
        if match_id not in self.connections:
            return
        dead = set()
        for ws in self.connections[match_id]:
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.connections[match_id].discard(ws)

    async def send_personal(self, websocket: WebSocket, message: dict):
        await websocket.send_json(message)

    def active_connections_count(self, match_id: int) -> int:
        return len(self.connections.get(match_id, set()))


manager = ConnectionManager()


async def redis_subscriber(match_id: int):
    """Subscribe to Redis pub/sub for a match and broadcast to WebSocket clients."""
    try:
        redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        pubsub = redis.pubsub()
        await pubsub.subscribe(f"match:{match_id}:live")
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    await manager.broadcast(match_id, data)
                except Exception:
                    pass
    except Exception:
        pass
