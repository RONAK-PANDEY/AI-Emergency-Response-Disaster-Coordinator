from __future__ import annotations
from pathlib import Path
from fastapi import FastAPI, Depends, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import Base, engine, get_db
from app.api.v1.api import api_router
from app.api.v1.endpoints.incidents import list_incidents, update_incident_status, delete_incident, get_incident
from app.api.v1.endpoints.reports import create_report, create_report_with_image
from app.api.v1.endpoints.system import ping, seed_demo_data

# Ensure Database Tables Exist without destructive drops
Base.metadata.create_all(bind=engine)

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="State Emergency Operations Center (SEOC) - Autonomous Multilingual Emergency Triage & Tactical Dispatch Platform",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Modular v1 API Routes
app.include_router(api_router, prefix="/api/v1")

# Direct /api route aliases for 100% backward compatibility
app.add_api_route("/api/ping", ping, methods=["GET"], tags=["legacy-compat"])
app.add_api_route("/api/seed", seed_demo_data, methods=["POST"], tags=["legacy-compat"])
app.add_api_route("/api/incidents", list_incidents, methods=["GET"], tags=["legacy-compat"])
app.add_api_route("/api/incidents/{incident_id}", get_incident, methods=["GET"], tags=["legacy-compat"])
app.add_api_route("/api/incidents/{incident_id}", update_incident_status, methods=["PATCH"], tags=["legacy-compat"])
app.add_api_route("/api/incidents/{incident_id}", delete_incident, methods=["DELETE"], tags=["legacy-compat"])
app.add_api_route("/api/report", create_report, methods=["POST"], tags=["legacy-compat"])
app.add_api_route("/api/report-with-image", create_report_with_image, methods=["POST"], tags=["legacy-compat"])

@app.on_event("startup")
def startup_event():
    # Auto-seed initial demo dataset if database is newly initialized
    db = next(get_db())
    from app.models.models import Incident
    count = db.query(Incident).count()
    if count == 0:
        seed_demo_data(db)
