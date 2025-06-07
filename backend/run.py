from app import create_app, socketio

app = create_app()
asgi_app = socketio.asgi_app(app)

if __name__ == '__main__':
    import uvicorn
    import os
    port = int(os.environ.get('PORT', 5000))
    uvicorn.run(asgi_app, host='0.0.0.0', port=port)
