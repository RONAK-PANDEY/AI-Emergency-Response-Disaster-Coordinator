"""
PATCH /api/incidents/{incident_id}

Updates only the `status` field of an Incident. Validates the incoming
status string against the IncidentStatus enum defined in models.py.

Adjust the `get_db` import below to match your project's database module.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from database import get_db  # <- adjust to wherever your session dependency lives
from models import Incident, IncidentStatus

router = APIRouter()


class IncidentStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        valid_values = {s.value for s in IncidentStatus}
        if value not in valid_values:
            raise ValueError(
                f"Invalid status '{value}'. Must be one of: {sorted(valid_values)}"
            )
        return value


@router.patch("/api/incidents/{incident_id}")
def update_incident_status(
    incident_id: int,
    payload: IncidentStatusUpdate,
    db: Session = Depends(get_db),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = IncidentStatus(payload.status)
    db.commit()
    db.refresh(incident)

    return {
        "id": incident.id,
        "status": incident.status.value,
    }


# In your main app file:
#
# from incident_status_endpoint import router as incident_status_router
# app.include_router(incident_status_router)