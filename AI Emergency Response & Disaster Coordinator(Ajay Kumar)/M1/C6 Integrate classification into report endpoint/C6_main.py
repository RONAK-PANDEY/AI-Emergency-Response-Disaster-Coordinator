from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import json

from database import get_db
from models import Incident, IncidentType, IncidentSeverity, IncidentStatus
from ai_classification import classify_emergency

app = FastAPI()


# ---- Request/response schemas ----

class ReportCreate(BaseModel):
    description: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class IncidentOut(BaseModel):
    id: int
    type: IncidentType
    severity: IncidentSeverity
    latitude: float
    longitude: float
    description: str
    people_affected: int
    required_team: list[str] = []
    status: IncidentStatus
    created_at: str

    class Config:
        from_attributes = True  # (orm_mode = True on Pydantic v1)


# ---- Classification result -> model enum mapping ----

_TYPE_MAP = {
    "fire": IncidentType.FIRE,
    "flood": IncidentType.FLOOD,
    "accident": IncidentType.ACCIDENT,
    "medical": IncidentType.MEDICAL,
    "other": IncidentType.OTHER,
}

_SEVERITY_MAP = {
    "critical": IncidentSeverity.CRITICAL,
    "high": IncidentSeverity.HIGH,
    "medium": IncidentSeverity.MEDIUM,
    "low": IncidentSeverity.LOW,
}


# ---- Endpoint ----

@app.post("/api/report", response_model=IncidentOut, status_code=201)
def create_report(payload: ReportCreate, db: Session = Depends(get_db)):
    # 1. Save the raw report immediately, unclassified.
    incident = Incident(
        type=IncidentType.OTHER,
        severity=IncidentSeverity.UNCLASSIFIED,
        status=IncidentStatus.NEW,
        latitude=payload.latitude,
        longitude=payload.longitude,
        description=payload.description,
        people_affected=0,
    )

    db.add(incident)
    db.commit()
    db.refresh(incident)

    # 2. Classify, then update the incident in place.
    try:
        classification = classify_emergency(payload.description)
    except Exception as e:
        # classify_emergency() is designed to fail-safe internally and not
        # raise, but if something unexpected slips through, don't let it
        # take down report creation — the raw incident already exists.
        classification = {
            "type": "other",
            "severity": "medium",
            "people_affected": None,
            "required_team": [],
            "confidence": 0.0,
            "error": f"Unexpected classification failure: {e}",
        }

    incident.type = _TYPE_MAP.get(classification["type"], IncidentType.OTHER)
    incident.severity = _SEVERITY_MAP.get(classification["severity"], IncidentSeverity.MEDIUM)
    incident.people_affected = classification["people_affected"] or 0
    incident.required_team = json.dumps(classification["required_team"])

    db.commit()
    db.refresh(incident)

    return incident