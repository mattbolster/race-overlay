import os
import eventlet
eventlet.monkey_patch()  # 👈 Patch standard library to work with eventlet

from app import create_app, socketio

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Use Railway-assigned port or fallback
    socketio.run(app, host='0.0.0.0', port=port, debug=False, use_reloader=False)
