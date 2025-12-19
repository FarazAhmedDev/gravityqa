"""Real-time WebSocket endpoint for device events and status updates"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import asyncio
import json

router = APIRouter()

# Active WebSocket connections
active_connections: List[WebSocket] = []

@router.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)

async def broadcast_device_event(event_type: str, data: dict):
    """Broadcast device events to all connected clients"""
    message = json.dumps({
        "type": event_type,
        "data": data
    })
    
    for connection in active_connections:
        try:
            await connection.send_text(message)
        except:
            # Remove dead connections
            if connection in active_connections:
                active_connections.remove(connection)

async def broadcast_installation_progress(device_id: str, progress: int, message: str):
    """Broadcast APK installation progress"""
    await broadcast_device_event("installation_progress", {
        "device_id": device_id,
        "progress": progress,
        "message": message
    })

def broadcast_mobile_action(device_id: str, action: dict):
    """Broadcast mobile touch action - synchronous wrapper for async broadcast"""
    # This is called from a thread, so we need to handle async carefully
    import asyncio
    
    message = json.dumps({
        "type": "mobile_action",
        "device_id": device_id,
        "action": action
    })
    
    # Send to all connected clients
    for connection in active_connections:
        try:
            # Use asyncio to send in thread-safe manner
            asyncio.create_task(connection.send_text(message))
        except Exception as e:
            print(f"[WebSocket] Failed to broadcast mobile action: {e}")
