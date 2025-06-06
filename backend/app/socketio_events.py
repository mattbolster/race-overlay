from . import socketio

# Use a mutable dictionary to track readiness across modules
client_state = {'ready': False}

@socketio.on('connect')
def handle_connect():
    print('[WebSocket] Client connected ✅')

@socketio.on('disconnect')
def handle_disconnect():
    print('[WebSocket] Client disconnected ❌')
    client_state['ready'] = False  # Optional: reset on disconnect

@socketio.on('ready')
def handle_ready():
    client_state['ready'] = True
    print('[WebSocket] Client is ready to receive data 🟢')
