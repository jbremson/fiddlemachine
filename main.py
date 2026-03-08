"""FiddleMachine - Fiddle Tune Learning Tool."""

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware import Middleware
from starlette.types import ASGIApp, Receive, Scope, Send
import os

from backend.api import router
from backend.auth import auth_router
from backend.sets import sets_router


class ProxyHeadersMiddleware:
    """Force HTTPS scheme when behind a reverse proxy."""
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] in ("http", "websocket"):
            headers = dict(scope.get("headers", []))
            if headers.get(b"x-forwarded-proto") == b"https":
                scope["scheme"] = "https"
        await self.app(scope, receive, send)


app = FastAPI(
    title="FiddleMachine",
    description="Learn fiddle tunes by ear",
    version="2.0.1"
)

# Session middleware required by authlib OAuth flow (added first so it's inner)
app.add_middleware(SessionMiddleware, secret_key=os.environ.get("JWT_SECRET", "dev-secret-change-me"), same_site="lax", https_only=False)

# Proxy headers middleware — added last so it's outermost, runs first
app.add_middleware(ProxyHeadersMiddleware)

# Include API routes
app.include_router(router)
app.include_router(auth_router)
app.include_router(sets_router)

# Serve static frontend files in production
frontend_dist = Path(__file__).parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=frontend_dist / "assets"), name="assets")

    @app.get("/")
    async def serve_frontend():
        return FileResponse(frontend_dist / "index.html")

    @app.get("/{path:path}")
    async def serve_frontend_fallback(path: str):
        # Try to serve the requested file, fallback to index.html for SPA routing
        file_path = frontend_dist / path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
