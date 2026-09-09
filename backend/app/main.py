import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base, SessionLocal
from .models.entities import (
    Identity, BehaviorProfile, Event, Alert, 
    BaselineChange, PoisoningState, PredictionResult, 
    EvaluationResult, BaselineHistory, SlowBurnState, SlowBurnObservation
)
from .simulation.generator import seed_database_if_needed
from .simulation.scenarios import simulation_coordinator
from .api.routes import router as api_router
from .api.websocket import manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("trustnexus")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables & seed database
    logger.info("Initializing database schemas...")
    Base.metadata.create_all(bind=engine)
    
    # Safe SQLite column migration
    from sqlalchemy import text
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE behavior_profiles ADD COLUMN baseline_snapshot_v1 JSON"))
            conn.commit()
        except Exception:
            pass
    
    db = SessionLocal()
    try:
        seed_database_if_needed(db)
        logger.info("Database initialized and verified.")
    finally:
        db.close()

    # Wire simulation coordinator broadcaster to WebSocket manager
    simulation_coordinator.set_broadcaster(manager.broadcast)
    logger.info("Simulation coordinator wired to WebSocket broadcaster.")

    yield

    # Shutdown
    logger.info("Stopping simulation runner...")
    simulation_coordinator.stop()

app = FastAPI(
    title="TrustNexus AI",
    description="Adaptive Behavioral Trust for Non-Human Identities. Trust Behavior. Not Just Identity.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)

@app.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Client can optionally send control commands via websocket
            data = await websocket.receive_text()
            if data == "PING":
                await websocket.send_text('{"type": "PONG"}')
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.get("/")
def root():
    return {
        "product": "TRUSTNEXUS AI",
        "tagline": "Trust Behavior. Not Just Identity.",
        "status": "online",
        "docs_url": "/docs",
        "api_health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
