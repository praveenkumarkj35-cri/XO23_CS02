import json
import logging
from typing import Set
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("trustnexus.ws")

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        
        json_data = json.dumps(message)
        stale_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json_data)
            except Exception as e:
                logger.warning(f"Failed to send to client: {e}")
                stale_connections.append(connection)

        for stale in stale_connections:
            self.disconnect(stale)

manager = ConnectionManager()
