from __future__ import annotations
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.enums import IncidentSeverity, IncidentStatus, IncidentType
from app.models.models import Incident, Report
from app.schemas.incident import IncidentOut, IncidentStatusUpdate

router = APIRouter()

def format_incident_out(incident: Incident, report: Optional[Report] = None) -> dict:
    image_url = None
    if report and report.image_path:
        image_url = f"/uploads/{Path(report.image_path).name}"
    elif incident.reports:
        first = incident.reports[0]
        if first.image_path:
            image_url = f"/uploads/{Path(first.image_path).name}"

    return {
        "id": incident.id,
        "type": incident.type.value if hasattr(incident.type, "value") else str(incident.type),
        "severity": incident.severity.value if hasattr(incident.severity, "value") else str(incident.severity),
        "latitude": incident.latitude,
        "longitude": incident.longitude,
        "description": incident.description,
        "people_affected": incident.people_affected or 0,
        "required_team": incident.required_team or "police",
        "status": incident.status.value if hasattr(incident.status, "value") else str(incident.status),
        "created_at": incident.created_at.isoformat() if incident.created_at else "",
        "updated_at": incident.updated_at.isoformat() if incident.updated_at else "",
        "image_url": image_url,
        "confidence": 0.94,
        "is_anonymous": incident.is_anonymous or False,
        "is_verified": incident.is_verified or False,
        "reporter_name": incident.reporter_name,
        "reporter_phone": incident.reporter_phone,
    }

@router.get("", response_model=List[IncidentOut])
def list_incidents(db: Session = Depends(get_db)):
    incidents = db.query(Incident).order_by(Incident.created_at.desc()).all()
    return [format_incident_out(inc) for inc in incidents]

@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident record not found")
    return format_incident_out(incident)

@router.patch("/{incident_id}", response_model=IncidentOut)
def update_incident_status(incident_id: int, payload: IncidentStatusUpdate, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident record not found")
    
    valid_statuses = {"new", "reported", "dispatched", "resolved"}
    normalized = payload.status.lower()
    if normalized not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status value. Permitted: {list(valid_statuses)}")
    
    incident.status = IncidentStatus(normalized)
    db.commit()
    db.refresh(incident)
    return format_incident_out(incident)

@router.delete("/{incident_id}")
def delete_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident record not found")
    
    db.delete(incident)
    db.commit()
    return {"status": "success", "message": f"Incident record #{incident_id} expunged.", "id": incident_id}
