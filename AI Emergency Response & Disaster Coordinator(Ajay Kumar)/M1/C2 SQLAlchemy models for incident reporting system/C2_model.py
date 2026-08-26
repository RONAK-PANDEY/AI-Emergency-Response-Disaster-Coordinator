from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()


class IncidentType(str, enum.Enum):
    """Enum for incident types"""
    ACCIDENT = "accident"
    NATURAL_DISASTER = "natural_disaster"
    INFRASTRUCTURE = "infrastructure"
    PUBLIC_HEALTH = "public_health"
    SECURITY = "security"
    OTHER = "other"


class IncidentSeverity(str, enum.Enum):
    """Enum for incident severity levels"""
    UNCLASSIFIED = "unclassified"  # ← ADDED
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentStatus(str, enum.Enum):
    """Enum for incident status"""
    NEW = "new"  # ← ADDED
    REPORTED = "reported"
    INVESTIGATING = "investigating"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class Incident(Base):
    """
    Incident model representing a reported incident/emergency
    """
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(SQLEnum(IncidentType), nullable=False, index=True)
    severity = Column(SQLEnum(IncidentSeverity), default=IncidentSeverity.UNCLASSIFIED, nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    people_affected = Column(Integer, default=0)
    status = Column(SQLEnum(IncidentStatus), default=IncidentStatus.NEW, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationship to reports
    reports = relationship("Report", back_populates="incident", cascade="all, delete-orphan")

    def __repr__(self):
        return (
            f"<Incident(id={self.id}, type={self.type}, severity={self.severity}, "
            f"status={self.status}, people_affected={self.people_affected})>"
        )


class Report(Base):
    """
    Report model for detailed incident reports with images/evidence
    """
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(Text, nullable=False)
    image_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationship to incident
    incident = relationship("Incident", back_populates="reports")

    def __repr__(self):
        return f"<Report(id={self.id}, incident_id={self.incident_id}, created_at={self.created_at})>"