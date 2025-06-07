# run.py

import eventlet
eventlet.monkey_patch()  # 👈 Patch standard library to work with eventlet

from app import create_app, socketio

app = create_app()

if __name__ == '__main__':
    # Use eventlet's web server for proper async socket support
    socketio.run(app, host='127.0.0.1', port=5000, debug=True, use_reloader=False)
