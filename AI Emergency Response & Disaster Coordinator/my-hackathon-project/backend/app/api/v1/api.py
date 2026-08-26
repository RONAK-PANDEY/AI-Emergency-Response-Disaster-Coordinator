from __future__ import annotations
from fastapi import APIRouter
from app.api.v1.endpoints import auth, incidents, reports, system

api_router = APIRouter()

api_router.include_router(system.router, prefix="", tags=["system"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
api_router.include_router(reports.router, prefix="/report", tags=["reports"])
