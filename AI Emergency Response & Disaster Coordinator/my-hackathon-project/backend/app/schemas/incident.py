"""
Pydantic schemas for incident-related requests, responses, reviews, GIS polygons and live rescue telemetry
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime


class ReportCreate(BaseModel):
    """Schema for creating a new incident report"""
    description: str = Field(..., min_length=1, max_length=5000)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class ReviewCreate(BaseModel):
    """Schema for post-rescue citizen review"""
    response_time_rating: int = Field(..., ge=1, le=5)
    rescue_efficiency_rating: int = Field(..., ge=1, le=5)
    staff_behaviour_rating: int = Field(..., ge=1, le=5)
    overall_rating: int = Field(..., ge=1, le=5)
    feedback_text: Optional[str] = None


class ReviewOut(BaseModel):
    """Schema for review output"""
    id: int
    incident_id: int
    reporter_id: Optional[int] = None
    reporter_name: str
    response_time_rating: int
    rescue_efficiency_rating: int
    staff_behaviour_rating: int
    overall_rating: int
    feedback_text: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class HazardPolygon(BaseModel):
    """Schema for dynamic GIS disaster zone polygon"""
    coordinates: List[List[float]]  # Array of [lat, lng] points defining polygon perimeter
    center: List[float]             # [lat, lng]
    radius_meters: float
    severity: str
    fill_color: str
    border_color: str
    opacity: float
    zone_label: str


class AutoDispatchUnit(BaseModel):
    """Schema for emergency response unit auto-dispatched by AI/EOC"""
    unit_type: str                  # "police", "ambulance", "ndrf", "fire", "sdrf"
    callsign: str                   # e.g. "PB-PCR-104"
    agency: str                     # e.g. "Punjab State Police (QRT)"
    assigned_vehicle: str           # e.g. "Toyota Innova PCR Unit #12"
    base_station: str               # e.g. "Civil Lines Police Station"
    contact_frequency: str          # e.g. "112 VHF Channel 4 / 98765-43210"
    departure_time: str
    eta_minutes: int
    status: str                     # "Dispatched", "En Route", "On Scene"


class LiveTrackingOut(BaseModel):
    """Schema for high-precision live rescue tracking telemetry"""
    incident_id: int
    tracking_code: str
    incident_type: str
    severity: str
    status: str
    current_stage: int              # 1 to 8
    stage_label: str
    stages: List[Dict[str, Any]]
    eta_seconds: int
    eta_formatted: str
    vehicle_speed_kmh: int
    distance_remaining_km: float
    vehicle_current_coords: List[float]
    incident_coords: List[float]
    route_path: List[List[float]]
    dispatched_units: List[AutoDispatchUnit]
    resolution_notes: Optional[str] = None
    polygon: Optional[HazardPolygon] = None


class IncidentOut(BaseModel):
    """Schema for incident response"""
    id: int
    tracking_code: Optional[str] = None
    type: str
    severity: str
    latitude: float
    longitude: float
    description: str
    summary: str
    people_affected: int = 0
    priority: int = 50
    confidence: float = 0.0
    source: str = "text"
    report_count: int = 1
    status: str = "new"
    assigned_team: Optional[str] = None
    is_verified: bool = False
    verified_by: Optional[str] = None
    resolution_notes: Optional[str] = None
    is_duplicate_of: Optional[int] = None
    reporter_id: Optional[int] = None
    reporter_name: Optional[str] = None
    reporter_contact: Optional[str] = None
    reviews: Optional[List[ReviewOut]] = []
    polygon: Optional[HazardPolygon] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class IncidentListOut(BaseModel):
    """Schema for listing incidents"""
    incidents: List[IncidentOut]
    total: int


class IncidentStatusUpdate(BaseModel):
    """Schema for updating incident status"""
    status: str
    resolution_notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        valid_statuses = {"new", "reported", "investigating", "in_progress", "resolved", "closed"}
        if value.lower() not in valid_statuses:
            raise ValueError(
                f"Invalid status '{value}'. Must be one of: {sorted(valid_statuses)}"
            )
        return value.lower()


class IncidentVerifyRequest(BaseModel):
    """Schema for officer verifying or rejecting a report"""
    action: str = Field("verify", description="'verify' or 'reject'")
    notes: Optional[str] = None


class IncidentAssignTeamRequest(BaseModel):
    """Schema for dispatching emergency response teams"""
    team_name: str = Field(..., min_length=2, max_length=255)
    notes: Optional[str] = None


class IncidentMergeRequest(BaseModel):
    """Schema for merging duplicate incident reports"""
    duplicate_incident_id: int


class AuditLogOut(BaseModel):
    """Schema for government audit log trail"""
    id: int
    incident_id: Optional[int] = None
    officer_name: str
    action: str
    details: str
    timestamp: Optional[str] = None

    class Config:
        from_attributes = True
