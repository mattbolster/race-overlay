from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

socketio = SocketIO(
    cors_allowed_origins="*",
    ping_timeout=60,
    ping_interval=25,
    async_mode="asgi"
)

def create_app():
    app = Flask(__name__)
    CORS(app)

    from .routes import scraper_bp
    app.register_blueprint(scraper_bp)

    socketio.init_app(app)

    from . import socketio_events

    return app
