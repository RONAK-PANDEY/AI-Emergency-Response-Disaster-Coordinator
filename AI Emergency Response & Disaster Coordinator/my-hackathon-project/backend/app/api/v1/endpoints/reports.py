from __future__ import annotations
import os
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.core.security import hash_aadhaar, verify_aadhaar_number
from app.db.session import get_db
from app.models.enums import IncidentSeverity, IncidentStatus, IncidentType
from app.models.models import Incident, Report
from app.schemas.incident import IncidentCreate, IncidentOut
from app.services.ai_classifier import analyze_emergency_image, classify_emergency
from app.api.v1.endpoints.incidents import format_incident_out

router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

def _enum_type(val: Optional[str]) -> IncidentType:
    if not val:
        return IncidentType.OTHER
    return {
        "fire": IncidentType.FIRE,
        "flood": IncidentType.FLOOD,
        "accident": IncidentType.ACCIDENT,
        "medical": IncidentType.MEDICAL,
    }.get(str(val).lower(), IncidentType.OTHER)

def _enum_severity(val: Optional[str]) -> IncidentSeverity:
    if not val:
        return IncidentSeverity.UNCLASSIFIED
    return {
        "critical": IncidentSeverity.CRITICAL,
        "high": IncidentSeverity.HIGH,
        "medium": IncidentSeverity.MEDIUM,
        "low": IncidentSeverity.LOW,
    }.get(str(val).lower(), IncidentSeverity.UNCLASSIFIED)

@router.post("", response_model=IncidentOut)
def create_report(payload: IncidentCreate, db: Session = Depends(get_db)):
    ai = classify_emergency(payload.description)
    final_type = payload.type or ai.get("type", "other")
    final_severity = payload.severity or ai.get("severity", "medium")
    final_people = payload.people_affected if payload.people_affected is not None else ai.get("people_affected", 0)
    teams = ai.get("required_team", [])
    required_team_str = ", ".join(teams) if isinstance(teams, list) else str(teams)

    is_verified = False
    reporter_aadhaar_hash = None
    reporter_name = None
    reporter_phone = None

    if not payload.is_anonymous and payload.reporter_aadhaar:
        if verify_aadhaar_number(payload.reporter_aadhaar):
            is_verified = True
            reporter_aadhaar_hash = hash_aadhaar(payload.reporter_aadhaar)
            reporter_name = payload.reporter_name
            reporter_phone = payload.reporter_phone

    incident = Incident(
        type=_enum_type(final_type),
        severity=_enum_severity(final_severity),
        latitude=payload.latitude,
        longitude=payload.longitude,
        description=payload.description,
        people_affected=final_people or 0,
        required_team=required_team_str or "police",
        status=IncidentStatus.NEW,
        is_anonymous=payload.is_anonymous,
        is_verified=is_verified,
        reporter_name=reporter_name,
        reporter_aadhaar_hash=reporter_aadhaar_hash,
        reporter_phone=reporter_phone,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    result = format_incident_out(incident)
    result["confidence"] = ai.get("confidence", 0.94)
    return result

@router.post("/with-image", response_model=IncidentOut)
def create_report_with_image(
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    is_anonymous: bool = Form(False),
    reporter_name: Optional[str] = Form(None),
    reporter_aadhaar: Optional[str] = Form(None),
    reporter_phone: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(default=None),
    db: Session = Depends(get_db),
):
    ai = classify_emergency(description)
    final_type = ai.get("type", "other")
    final_severity = ai.get("severity", "medium")
    final_people = ai.get("people_affected", 0)
    teams = ai.get("required_team", [])
    required_team_str = ", ".join(teams) if isinstance(teams, list) else str(teams)

    is_verified = False
    reporter_aadhaar_hash = None
    if not is_anonymous and reporter_aadhaar:
        if verify_aadhaar_number(reporter_aadhaar):
            is_verified = True
            reporter_aadhaar_hash = hash_aadhaar(reporter_aadhaar)

    incident = Incident(
        type=_enum_type(final_type),
        severity=_enum_severity(final_severity),
        latitude=latitude,
        longitude=longitude,
        description=description,
        people_affected=final_people or 0,
        required_team=required_team_str or "police",
        status=IncidentStatus.NEW,
        is_anonymous=is_anonymous,
        is_verified=is_verified,
        reporter_name=reporter_name,
        reporter_aadhaar_hash=reporter_aadhaar_hash,
        reporter_phone=reporter_phone,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    saved_report = None
    if image and image.filename:
        safe_filename = f"{incident.id}_{os.path.basename(image.filename)}"
        image_path = UPLOAD_DIR / safe_filename
        with image_path.open("wb") as f:
            f.write(image.file.read())

        vision = analyze_emergency_image(str(image_path), context_text=description)
        if vision.get("visible_severity") == "critical" and incident.severity != IncidentSeverity.CRITICAL:
            incident.severity = IncidentSeverity.CRITICAL
            db.commit()
            db.refresh(incident)

        saved_report = Report(incident_id=incident.id, description=description, image_path=str(image_path))
        db.add(saved_report)
        db.commit()
        db.refresh(saved_report)

    result = format_incident_out(incident, saved_report)
    result["confidence"] = ai.get("confidence", 0.94)
    return result
