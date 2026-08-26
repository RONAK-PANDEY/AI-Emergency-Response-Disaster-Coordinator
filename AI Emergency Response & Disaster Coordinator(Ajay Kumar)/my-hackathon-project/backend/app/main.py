"""
Main FastAPI application for AI Emergency Response & Disaster Coordinator
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.api import incidents_router, auth_router
from database import init_db, create_upload_dir, seed_default_incidents_if_empty

# Initialize database and upload directory
init_db()
create_upload_dir()
seed_default_incidents_if_empty()

# Create FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if hasattr(settings, "CORS_ORIGINS") else ["*"],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(incidents_router)

# Static files for uploaded images
upload_dir = settings.UPLOAD_DIR
os.makedirs(upload_dir, exist_ok=True)
if os.path.isdir(upload_dir):
    app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "AI Emergency Response & Disaster Coordinator API",
        "docs": "/docs",
        "health": "/api/health",
        "auth": "/api/auth",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
