"""
Schemas package
"""

from app.schemas.incident import (
    ReportCreate,
    IncidentOut,
    IncidentListOut,
    IncidentStatusUpdate,
    IncidentVerifyRequest,
    IncidentAssignTeamRequest,
    IncidentMergeRequest,
    AuditLogOut,
    ReviewCreate,
    ReviewOut,
    HazardPolygon,
    AutoDispatchUnit,
    LiveTrackingOut,
)
from app.schemas.auth import (
    SendOTPRequest,
    VerifyOTPRequest,
    LoginRequest,
    UserOut,
    AuthResponse,
)

__all__ = [
    "ReportCreate",
    "IncidentOut",
    "IncidentListOut",
    "IncidentStatusUpdate",
    "IncidentVerifyRequest",
    "IncidentAssignTeamRequest",
    "IncidentMergeRequest",
    "AuditLogOut",
    "ReviewCreate",
    "ReviewOut",
    "HazardPolygon",
    "AutoDispatchUnit",
    "LiveTrackingOut",
    "SendOTPRequest",
    "VerifyOTPRequest",
    "LoginRequest",
    "UserOut",
    "AuthResponse",
]
