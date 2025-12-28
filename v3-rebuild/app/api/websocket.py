"""WebSocket handler for real-time progress updates."""

import asyncio
import json
from typing import Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections and subscriptions."""

    def __init__(self):
        # All active connections
        self.active_connections: Set[WebSocket] = set()
        # Job ID -> Set of subscribed connections
        self.subscriptions: dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection."""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.debug(f"WebSocket connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Handle WebSocket disconnection."""
        self.active_connections.discard(websocket)

        # Remove from all subscriptions
        for job_id, subscribers in list(self.subscriptions.items()):
            subscribers.discard(websocket)
            if not subscribers:
                del self.subscriptions[job_id]

        logger.debug(f"WebSocket disconnected. Total: {len(self.active_connections)}")

    def subscribe(self, websocket: WebSocket, job_ids: list[str]):
        """Subscribe to job progress updates."""
        for job_id in job_ids:
            if job_id not in self.subscriptions:
                self.subscriptions[job_id] = set()
            self.subscriptions[job_id].add(websocket)
        logger.debug(f"Subscribed to {len(job_ids)} jobs")

    def unsubscribe(self, websocket: WebSocket, job_ids: list[str]):
        """Unsubscribe from job progress updates."""
        for job_id in job_ids:
            if job_id in self.subscriptions:
                self.subscriptions[job_id].discard(websocket)
                if not self.subscriptions[job_id]:
                    del self.subscriptions[job_id]

    async def send_personal(self, websocket: WebSocket, message: dict):
        """Send message to specific connection."""
        try:
            await websocket.send_json(message)
        except Exception:
            self.disconnect(websocket)

    async def broadcast_to_job(self, job_id: str, message: dict):
        """Broadcast message to all subscribers of a job."""
        if job_id not in self.subscriptions:
            return

        dead_connections = set()

        for websocket in self.subscriptions[job_id]:
            try:
                await websocket.send_json(message)
            except Exception:
                dead_connections.add(websocket)

        # Clean up dead connections
        for ws in dead_connections:
            self.disconnect(ws)

    async def broadcast_all(self, message: dict):
        """Broadcast message to all connections."""
        dead_connections = set()

        for websocket in self.active_connections:
            try:
                await websocket.send_json(message)
            except Exception:
                dead_connections.add(websocket)

        for ws in dead_connections:
            self.disconnect(ws)


# Global connection manager
manager = ConnectionManager()


# WebSocket router
websocket_router = APIRouter()


@websocket_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time updates.

    Client messages:
        {"type": "subscribe", "job_ids": ["id1", "id2"]}
        {"type": "unsubscribe", "job_ids": ["id1"]}
        {"type": "ping"}

    Server messages:
        {"type": "subscribed", "job_ids": ["id1", "id2"]}
        {"type": "progress", "job_id": "...", "percent": 45.5, ...}
        {"type": "status", "job_id": "...", "status": "completed", ...}
        {"type": "error", "job_id": "...", "error_type": "...", "message": "..."}
        {"type": "complete", "job_id": "...", "result": {...}}
        {"type": "pong"}
    """
    await manager.connect(websocket)

    try:
        while True:
            # Receive message
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                msg_type = message.get("type")

                if msg_type == "subscribe":
                    job_ids = message.get("job_ids", [])
                    manager.subscribe(websocket, job_ids)
                    await manager.send_personal(websocket, {
                        "type": "subscribed",
                        "job_ids": job_ids,
                    })

                elif msg_type == "unsubscribe":
                    job_ids = message.get("job_ids", [])
                    manager.unsubscribe(websocket, job_ids)
                    await manager.send_personal(websocket, {
                        "type": "unsubscribed",
                        "job_ids": job_ids,
                    })

                elif msg_type == "ping":
                    await manager.send_personal(websocket, {"type": "pong"})

                elif msg_type == "cancel":
                    # Handle job cancellation via WebSocket
                    job_id = message.get("job_id")
                    if job_id:
                        # TODO: Implement job cancellation
                        await manager.send_personal(websocket, {
                            "type": "cancelled",
                            "job_id": job_id,
                        })

            except json.JSONDecodeError:
                await manager.send_personal(websocket, {
                    "type": "error",
                    "message": "Invalid JSON",
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Helper functions for broadcasting from other parts of the app

async def broadcast_progress(job_id: str, progress: dict):
    """Broadcast progress update for a job."""
    await manager.broadcast_to_job(job_id, {
        "type": "progress",
        "job_id": job_id,
        **progress,
    })


async def broadcast_status(job_id: str, status: str, message: str = None):
    """Broadcast status change for a job."""
    await manager.broadcast_to_job(job_id, {
        "type": "status",
        "job_id": job_id,
        "status": status,
        "message": message,
    })


async def broadcast_complete(job_id: str, result: dict):
    """Broadcast completion for a job."""
    await manager.broadcast_to_job(job_id, {
        "type": "complete",
        "job_id": job_id,
        "result": result,
    })


async def broadcast_error(job_id: str, error_type: str, message: str):
    """Broadcast error for a job."""
    await manager.broadcast_to_job(job_id, {
        "type": "error",
        "job_id": job_id,
        "error_type": error_type,
        "message": message,
    })


async def broadcast_queue_update(stats: dict):
    """Broadcast queue statistics to all connections."""
    await manager.broadcast_all({
        "type": "queue_update",
        **stats,
    })
