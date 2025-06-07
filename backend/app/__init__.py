# app/__init__.py

from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

# ✅ Initialize SocketIO once here
socketio = SocketIO(
    cors_allowed_origins="*",
    ping_timeout=60,
    ping_interval=25,
    async_mode="eventlet"
)

def create_app():
    app = Flask(__name__)
    CORS(app)

    # ✅ Register routes before initializing socket events
    from .routes import scraper_bp
    app.register_blueprint(scraper_bp)

    # ✅ Hook socketio into app
    socketio.init_app(app)

    # ✅ Import socket handlers AFTER init_app to avoid circular issues
    from . import socketio_events

    return app
