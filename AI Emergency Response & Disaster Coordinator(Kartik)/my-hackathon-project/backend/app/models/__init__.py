from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False, default="other")
    severity = Column(String(30), nullable=False, default="medium")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_name = Column(String(200), nullable=True, default="")
    description = Column(Text, nullable=False)
    people_affected = Column(Integer, nullable=False, default=0)
    required_teams = Column(String(200), nullable=False, default="police")
    status = Column(String(30), nullable=False, default="open")
    confidence = Column(Float, nullable=False, default=0.9)
    summary = Column(Text, nullable=True, default="")
    source = Column(String(50), nullable=False, default="heuristic")
    image_url = Column(String(500), nullable=True)
    
    # Aadhaar & Citizen Verification Security Layer
    aadhaar_verified = Column(Boolean, nullable=False, default=False)
    citizen_name = Column(String(120), nullable=True, default="")
    citizen_phone = Column(String(30), nullable=True, default="")
    citizen_aadhaar_masked = Column(String(30), nullable=True, default="")
    verification_badge = Column(String(50), nullable=False, default="Citizen Verified 🛡️")
    
    # Government Audit Trail
    audit_updated_by = Column(String(150), nullable=True, default="System Initial Triage")
    audit_updated_at = Column(DateTime, default=datetime.utcnow, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    reports = relationship("Report", back_populates="incident", cascade="all, delete-orphan")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=False)
    image_path = Column(String(500), nullable=True)
    citizen_aadhaar_masked = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    incident = relationship("Incident", back_populates="reports")


class Officer(Base):
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, index=True)
    badge_number = Column(String(50), unique=True, nullable=False)
    officer_name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    role = Column(String(50), nullable=False, default="Dispatcher")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


__all__ = ["Base", "Incident", "Report", "Officer"]
