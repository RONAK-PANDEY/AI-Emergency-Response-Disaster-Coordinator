from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field

class IncidentBase(BaseModel):
    description: str = Field(..., min_length=1)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    type: Optional[str] = None
    severity: Optional[str] = None
    people_affected: Optional[int] = 0
    is_anonymous: bool = False
    reporter_name: Optional[str] = None
    reporter_aadhaar: Optional[str] = None
    reporter_phone: Optional[str] = None

class IncidentCreate(IncidentBase):
    pass

class IncidentStatusUpdate(BaseModel):
    status: str

class IncidentOut(BaseModel):
    id: int
    type: str
    severity: str
    latitude: float
    longitude: float
    description: str
    people_affected: int
    required_team: str
    status: str
    created_at: str
    updated_at: Optional[str] = None
    image_url: Optional[str] = None
    confidence: Optional[float] = 0.94
    is_anonymous: bool = False
    is_verified: bool = False
    reporter_name: Optional[str] = None
    reporter_phone: Optional[str] = None

    class Config:
        from_attributes = True
