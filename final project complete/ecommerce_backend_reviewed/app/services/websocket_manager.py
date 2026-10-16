from fastapi import WebSocket
from typing import Dict, List


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        """Register an already-accepted WebSocket connection."""
        self.active_connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        connections = self.active_connections.get(user_id)

        if not connections:
            return

        try:
            connections.remove(websocket)
        except ValueError:
            pass

        if not connections:
            self.active_connections.pop(user_id, None)

    async def send_personal_message(self, message, user_id: int):
        connections = list(
            self.active_connections.get(user_id, [])
        )

        for connection in connections:
            try:
                await connection.send_json(
                    message
                    if isinstance(message, dict)
                    else {
                        "type": "message",
                        "message": message,
                    }
                )
            except Exception:
                self.disconnect(user_id, connection)


manager = ConnectionManager()
