from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import SessionLocal
from app.seeds.seed_data import init_db, seed_database
from app.api import (
    voice_router,
    agents_router,
    nip_router,
    merchants_router,
    governance_router,
    digital_twin_router,
    simulation_router
)

class ConnectionManager:
    """Manages active WebSockets for real-time multi-agent and NIP bus updates"""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema & seed sample neighbourhood data
    init_db()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="The Autonomous Intelligence Network for Local Commerce powered by Gnani AI Speech & Multi-Agent Architecture",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(voice_router)
app.include_router(agents_router)
app.include_router(nip_router)
app.include_router(merchants_router)
app.include_router(governance_router)
app.include_router(digital_twin_router)
app.include_router(simulation_router)

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or broadcast heartbeats
            await websocket.send_json({"type": "HEARTBEAT_ACK", "status": "CONNECTED"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "protocol": "Neighbourhood Intelligence Protocol (NIP/1.0)",
        "gnani_api": {
            "prisma_stt": "READY",
            "timbre_tts": "READY",
            "evon_reasoning": "READY"
        }
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to KIRANAMITRA AI – The Autonomous Intelligence Network for Local Commerce",
        "documentation": "/docs",
        "tagline": "From Individual Shops to an Intelligent, Self-Coordinating Economy."
    }

