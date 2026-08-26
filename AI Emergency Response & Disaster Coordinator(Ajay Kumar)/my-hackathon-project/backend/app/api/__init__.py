"""
API Routes Package
"""

from app.api.incidents import router as incidents_router
from app.api.auth import router as auth_router

__all__ = ["incidents_router", "auth_router"]
