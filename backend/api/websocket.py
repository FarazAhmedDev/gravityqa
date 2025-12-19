from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import asyncio

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        self.active_connections[channel].add(websocket)
    
    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections:
            self.active_connections[channel].discard(websocket)
    
    async def broadcast(self, channel: str, message: dict):
        if channel in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.add(connection)
            
            # Remove disconnected clients
            for conn in disconnected:
                self.active_connections[channel].discard(conn)

manager = ConnectionManager()

@router.websocket("/test-run/{test_run_id}")
async def websocket_test_run(websocket: WebSocket, test_run_id: int):
    """WebSocket for test run real-time updates"""
    channel = f"test-run-{test_run_id}"
    await manager.connect(websocket, channel)
    
    try:
        while True:
            # Keep connection alive
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)

@router.websocket("/devices")
async def websocket_devices(websocket: WebSocket):
    """WebSocket for device status updates"""
    channel = "devices"
    await manager.connect(websocket, channel)
    
    try:
        while True:
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)

# Export manager for use in other modules
def get_ws_manager():
    return manager
