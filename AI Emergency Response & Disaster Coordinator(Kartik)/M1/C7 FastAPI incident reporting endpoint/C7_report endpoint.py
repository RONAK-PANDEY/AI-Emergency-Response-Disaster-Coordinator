from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models import Incident, IncidentType, IncidentSeverity, IncidentStatus

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


# ---- Endpoint ----

@app.post("/api/report", response_model=IncidentOut, status_code=201)
def create_report(payload: ReportCreate, db: Session = Depends(get_db)):
    incident = Incident(
        type=IncidentType.OTHER,          # not provided by client — see note below
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

    return incident