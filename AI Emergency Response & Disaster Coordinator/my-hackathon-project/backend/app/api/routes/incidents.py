from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Incident

router = APIRouter()


class StatusUpdate(BaseModel):
    status: str


@router.patch("/api/incidents/{incident_id}")
def update_incident_status(incident_id: int, payload: StatusUpdate, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = payload.status
    db.commit()
    db.refresh(incident)
    return {"id": incident.id, "status": incident.status}
