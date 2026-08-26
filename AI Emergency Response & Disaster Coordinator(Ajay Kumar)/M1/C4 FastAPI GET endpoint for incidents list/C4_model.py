from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
from typing import List

# Import your models
from work2.C2_model import Base, Incident, IncidentType, IncidentSeverity, IncidentStatus, Report

# ============================================================================
# DATABASE SETUP
# ============================================================================
DATABASE_URL = "sqlite:///./incidents.db"  # Change as needed
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================
class IncidentReportRequest(BaseModel):
    """Schema for incoming report request"""
    description: str
    latitude: float
    longitude: float


class IncidentResponse(BaseModel):
    """Schema for incident response"""
    id: int
    type: str
    severity: str
    latitude: float
    longitude: float
    description: str
    people_affected: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# FASTAPI APP
# ============================================================================
app = FastAPI(title="Incident Reporting API")


def get_db():
    """Dependency for database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/api/report", response_model=IncidentResponse)
def create_incident_report(
    report: IncidentReportRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new incident report.
    
    - **description**: Detailed description of the incident
    - **latitude**: Latitude coordinate of incident location
    - **longitude**: Longitude coordinate of incident location
    
    Default values:
    - severity: LOW (or UNCLASSIFIED if you add it to enum)
    - type: OTHER
    - status: REPORTED
    - people_affected: 0
    """
    try:
        # Create new incident with default values
        new_incident = Incident(
            type=IncidentType.OTHER,  # Default type
            severity=IncidentSeverity.LOW,  # Using LOW as default (add UNCLASSIFIED to enum for true default)
            latitude=report.latitude,
            longitude=report.longitude,
            description=report.description,
            people_affected=0,  # Default
            status=IncidentStatus.REPORTED,  # Using REPORTED instead of "new"
            created_at=datetime.utcnow()
        )
        
        # Add and commit to database
        db.add(new_incident)
        db.commit()
        db.refresh(new_incident)
        
        return new_incident
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error creating incident: {str(e)}")


@app.get("/api/incidents", response_model=List[IncidentResponse])
def get_all_incidents(db: Session = Depends(get_db)):
    """
    Retrieve all incidents.

    Returns every incident in the database as a JSON list,
    sorted by created_at descending (most recently reported first).
    """
    incidents = db.query(Incident).order_by(Incident.created_at.desc()).all()
    return incidents


@app.get("/api/incidents/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific incident by ID"""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)