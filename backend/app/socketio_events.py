from flask_socketio import SocketIO
from . import socketio  # ✅ GOOD — reuses the existing instance

# ✅ This MUST exist at the top level
client_state = {
    "ready": False
}

@socketio.on('client_ready', namespace='/')
def handle_client_ready():
    print("[SOCKETIO] Client marked as ready")
    client_state["ready"] = True

@socketio.on('connect')
def handle_connect():
    print('[WebSocket] Client connected ✅')

@socketio.on('disconnect')
def handle_disconnect():
    print('[WebSocket] Client disconnected ❌')
