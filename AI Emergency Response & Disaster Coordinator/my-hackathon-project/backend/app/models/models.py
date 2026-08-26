from __future__ import annotations
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.enums import IncidentSeverity, IncidentStatus, IncidentType

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(SQLEnum(IncidentType), nullable=False, default=IncidentType.OTHER, index=True)
    severity = Column(SQLEnum(IncidentSeverity), nullable=False, default=IncidentSeverity.UNCLASSIFIED, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    people_affected = Column(Integer, default=0)
    required_team = Column(String(255), default="police")
    status = Column(SQLEnum(IncidentStatus), nullable=False, default=IncidentStatus.NEW, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Reporter Identity Verification Fields
    is_anonymous = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    reporter_name = Column(String(200), nullable=True)
    reporter_aadhaar_hash = Column(String(64), nullable=True)
    reporter_phone = Column(String(20), nullable=True)

    reports = relationship("Report", back_populates="incident", cascade="all, delete-orphan")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    description = Column(Text, nullable=False)
    image_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    incident = relationship("Incident", back_populates="reports")
