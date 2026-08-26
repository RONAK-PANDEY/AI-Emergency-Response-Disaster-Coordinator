"""
SQLAlchemy models for incident reporting, GIS intelligence, reviews, and dual-portal coordination
"""

from datetime import datetime
from enum import Enum
import uuid
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class UserRole(str, Enum):
    """Enum for user portal roles"""
    REPORTER = "reporter"
    OFFICER = "officer"
    ADMIN = "admin"


class IncidentType(str, Enum):
    """Enum for incident types"""
    FIRE = "fire"
    FLOOD = "flood"
    ACCIDENT = "accident"
    MEDICAL = "medical"
    NATURAL_DISASTER = "natural_disaster"
    INFRASTRUCTURE = "infrastructure"
    PUBLIC_HEALTH = "public_health"
    SECURITY = "security"
    OTHER = "other"


class IncidentSeverity(str, Enum):
    """Enum for incident severity levels"""
    UNCLASSIFIED = "unclassified"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentStatus(str, Enum):
    """Enum for incident status lifecycle"""
    NEW = "new"
    REPORTED = "reported"
    INVESTIGATING = "investigating"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class User(Base):
    """
    User model for authenticated Citizen Reporters and Government Officers
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    full_name = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.REPORTER, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    badge_number = Column(String(100), nullable=True)  # For officers
    department = Column(String(255), nullable=True)    # e.g., "State Disaster Management Authority"
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    incidents = relationship("Incident", back_populates="reporter")

    def to_dict(self, include_sensitive: bool = False):
        return {
            "id": self.id,
            "email": self.email,
            "phone": self.phone if include_sensitive else None,
            "full_name": self.full_name,
            "role": self.role.value if isinstance(self.role, UserRole) else self.role,
            "badge_number": self.badge_number,
            "department": self.department,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class OTPRecord(Base):
    """
    OTP verification records for phone/email signup & passwordless login
    """
    __tablename__ = "otp_records"

    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String(255), index=True, nullable=False)  # email or phone
    otp_code = Column(String(10), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AuditLog(Base):
    """
    Government officer action audit trail for accountability & triage tracking
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=True, index=True)
    officer_name = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False)  # "VERIFIED", "ASSIGNED_TEAM", "STATUS_UPDATE", "MERGED", "REJECTED"
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "incident_id": self.incident_id,
            "officer_name": self.officer_name,
            "action": self.action,
            "details": self.details,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


class Review(Base):
    """
    Post-rescue citizen rating & feedback for official accountability
    """
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reporter_name = Column(String(255), default="Citizen Reporter", nullable=False)
    response_time_rating = Column(Integer, default=5, nullable=False)      # 1-5 stars
    rescue_efficiency_rating = Column(Integer, default=5, nullable=False)  # 1-5 stars
    staff_behaviour_rating = Column(Integer, default=5, nullable=False)    # 1-5 stars
    overall_rating = Column(Integer, default=5, nullable=False)            # 1-5 stars
    feedback_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    incident = relationship("Incident", back_populates="reviews")

    def to_dict(self):
        return {
            "id": self.id,
            "incident_id": self.incident_id,
            "reporter_id": self.reporter_id,
            "reporter_name": self.reporter_name,
            "response_time_rating": self.response_time_rating,
            "rescue_efficiency_rating": self.rescue_efficiency_rating,
            "staff_behaviour_rating": self.staff_behaviour_rating,
            "overall_rating": self.overall_rating,
            "feedback_text": self.feedback_text,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Incident(Base):
    """
    Incident model representing an emergency incident with triage, GIS polygon and tracking metadata
    """
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    tracking_code = Column(String(50), unique=True, index=True, nullable=True)
    type = Column(SQLEnum(IncidentType), nullable=False, index=True, default=IncidentType.OTHER)
    severity = Column(SQLEnum(IncidentSeverity), default=IncidentSeverity.UNCLASSIFIED, nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    summary = Column(Text, nullable=False, default="")
    people_affected = Column(Integer, default=0)
    priority = Column(Integer, default=50, nullable=False)
    confidence = Column(Float, default=0.0, nullable=False)
    source = Column(String(50), default="text", nullable=False)  # "text", "voice", "photo", "sensor"
    report_count = Column(Integer, default=1, nullable=False)
    status = Column(SQLEnum(IncidentStatus), default=IncidentStatus.NEW, nullable=False, index=True)
    
    # Reporter metadata (Protected / Anonymized on public listings)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    reporter_name = Column(String(255), nullable=True)
    reporter_contact = Column(String(255), nullable=True)
    
    # Officer response & triage fields
    assigned_team = Column(String(255), nullable=True)  # e.g., "NDRF Team Alpha", "Medical Emergency Unit 1"
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_by = Column(String(255), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    is_duplicate_of = Column(Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=True, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    # Relationships
    reporter = relationship("User", back_populates="incidents")
    reports = relationship("Report", back_populates="incident", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="incident", cascade="all, delete-orphan")

    def __repr__(self):
        return (
            f"<Incident(id={self.id}, tracking_code={self.tracking_code}, type={self.type}, "
            f"severity={self.severity}, status={self.status}, assigned_team={self.assigned_team})>"
        )

    def to_dict(self, is_officer: bool = False):
        """
        Convert model to dictionary.
        Anonymizes reporter information and precise private contact if not viewed by an authorized officer.
        """
        summary = getattr(self, "summary", None) or getattr(self, "description", "") or ""
        
        tracking = self.tracking_code
        if not tracking:
            tracking = f"EMG-{self.id + 1000}"

        return {
            "id": self.id,
            "tracking_code": tracking,
            "type": self.type.value if isinstance(self.type, IncidentType) else self.type,
            "severity": self.severity.value if isinstance(self.severity, IncidentSeverity) else self.severity,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "description": self.description,
            "summary": summary,
            "people_affected": self.people_affected or 0,
            "priority": getattr(self, "priority", None) or 50,
            "confidence": getattr(self, "confidence", None) or 0.0,
            "source": getattr(self, "source", None) or "text",
            "report_count": getattr(self, "report_count", None) or 1,
            "status": self.status.value if isinstance(self.status, IncidentStatus) else self.status,
            "assigned_team": self.assigned_team,
            "is_verified": self.is_verified,
            "verified_by": self.verified_by,
            "resolution_notes": self.resolution_notes,
            "is_duplicate_of": self.is_duplicate_of,
            "reporter_id": self.reporter_id,
            # Privacy: Hide direct reporter contact details for non-officers
            "reporter_name": self.reporter_name if is_officer else ("Verified Citizen" if self.reporter_id else "Anonymous Reporter"),
            "reporter_contact": self.reporter_contact if is_officer else None,
            "reviews": [r.to_dict() for r in (self.reviews or [])],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


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

    def to_dict(self):
        return {
            "id": self.id,
            "incident_id": self.incident_id,
            "description": self.description,
            "image_path": self.image_path,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
