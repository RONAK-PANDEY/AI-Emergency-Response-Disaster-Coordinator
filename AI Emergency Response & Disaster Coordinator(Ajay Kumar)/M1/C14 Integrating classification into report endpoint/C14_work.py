from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models import Incident, IncidentType, IncidentSeverity, IncidentStatus
from C13_AI_classification import classify_emergency  # Import the classification function

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
    status: IncidentStatus
    created_at: str

    class Config:
        from_attributes = True  # (orm_mode = True on Pydantic v1)


# ---- Helper function to map AI classification to model enums ----

def map_ai_type_to_incident_type(ai_type: str) -> IncidentType:
    """Map AI classification type to IncidentType enum."""
    type_mapping = {
        "fire": IncidentType.FIRE,
        "flood": IncidentType.FLOOD,
        "accident": IncidentType.ACCIDENT,
        "medical": IncidentType.MEDICAL,
        "other": IncidentType.OTHER,
    }
    return type_mapping.get(ai_type, IncidentType.OTHER)


def map_ai_severity_to_incident_severity(ai_severity: str) -> IncidentSeverity:
    """Map AI classification severity to IncidentSeverity enum."""
    severity_mapping = {
        "critical": IncidentSeverity.CRITICAL,
        "high": IncidentSeverity.HIGH,
        "medium": IncidentSeverity.MEDIUM,
        "low": IncidentSeverity.LOW,
    }
    return severity_mapping.get(ai_severity, IncidentSeverity.UNCLASSIFIED)


# ---- Endpoint ----

@app.post("/api/report", response_model=IncidentOut, status_code=201)
def create_report(payload: ReportCreate, db: Session = Depends(get_db)):
    # Create incident with initial defaults
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

    # Classify the emergency description using AI
    classification = classify_emergency(payload.description)

    # Only update fields if classification succeeded (no error key)
    if "error" not in classification:
        # Update type
        incident.type = map_ai_type_to_incident_type(classification.get("type", "other"))

        # Update severity
        incident.severity = map_ai_severity_to_incident_severity(
            classification.get("severity", "medium")
        )

        # Update people_affected if provided
        if classification.get("people_affected") is not None:
            incident.people_affected = classification["people_affected"]

        # Update required_team if available (if your Incident model has this field)
        # incident.required_team = classification.get("required_team", [])

        db.commit()
        db.refresh(incident)

    return incident