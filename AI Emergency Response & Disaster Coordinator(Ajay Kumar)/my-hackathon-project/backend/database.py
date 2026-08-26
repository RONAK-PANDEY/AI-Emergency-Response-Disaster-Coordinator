"""
Database connection, session management, schema initialization and seeders
"""

import hashlib
from datetime import datetime, timedelta
import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from app.core.config import settings
from app.models import (
    Base,
    Incident,
    IncidentStatus,
    IncidentType,
    IncidentSeverity,
    User,
    UserRole,
    AuditLog,
    OTPRecord,
    Review,
)

# Create engine with proper configuration
if "sqlite" in settings.DATABASE_URL:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=settings.SQLALCHEMY_ECHO,
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    engine = create_engine(
        settings.DATABASE_URL,
        echo=settings.SQLALCHEMY_ECHO,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def hash_password(password: str) -> str:
    """Simple robust SHA-256 password hash for demonstration."""
    return hashlib.sha256(f"salt_{password}_emergency".encode()).hexdigest()


def verify_password(plain_password: str, hashed: str) -> bool:
    return hash_password(plain_password) == hashed


def get_db() -> Session:
    """Dependency for getting database session in FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables and run lightweight migrations for SQLite."""
    Base.metadata.create_all(bind=engine)

    if "sqlite" in settings.DATABASE_URL:
        with engine.begin() as conn:
            columns = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(incidents)").fetchall()}
            missing_columns = []

            if "tracking_code" not in columns:
                missing_columns.append("ALTER TABLE incidents ADD COLUMN tracking_code VARCHAR(50)")
            if "summary" not in columns:
                missing_columns.append("ALTER TABLE incidents ADD COLUMN summary TEXT DEFAULT ''")
            if "priority" not in columns:
                missing_columns.append("ALTER TABLE incidents ADD COLUMN priority INTEGER DEFAULT 50")
            if "confidence" not in columns:
                missing_columns.append("ALTER TABLE incidents ADD COLUMN confidence FLOAT DEFAULT 0.0")
            if "source" not in columns:
                missing_columns.append("ALTER TABLE incidents ADD COLUMN source VARCHAR(50) DEFAULT 'text'")
            if "report_count" not in columns:
                missing_columns.append("ALTER TABLE incidents ADD COLUMN report_count INTEGER DEFAULT 1")
            if "status" not in columns:
                missing_columns.append("ALTER TABLE incidents ADD COLUMN status VARCHAR(20) DEFAULT 'new'")
            if "reporter_id" not in columns:
                missing_columns.append("ALTER TABLE incidents ADD COLUMN reporter_id INTEGER")
            if "reporter_name" not in columns:
                missing_columns.append("ALTER TABLE incidents ADD COLUMN reporter_name VARCHAR(255)")
            if "reporter_contact" not in columns:
                missing_columns.append("ALTER TABLE incidents ADD COLUMN reporter_contact VARCHAR(255)")
            if "assigned_team" not in columns:
                missing_columns.append("ALTER TABLE incidents ADD COLUMN assigned_team VARCHAR(255)")
            if "is_verified" not in columns:
                missing_columns.append("ALTER TABLE incidents ADD COLUMN is_verified BOOLEAN DEFAULT 0")
            if "verified_by" not in columns:
                missing_columns.append("ALTER TABLE incidents ADD COLUMN verified_by VARCHAR(255)")
            if "resolution_notes" not in columns:
                missing_columns.append("ALTER TABLE incidents ADD COLUMN resolution_notes TEXT")
            if "is_duplicate_of" not in columns:
                missing_columns.append("ALTER TABLE incidents ADD COLUMN is_duplicate_of INTEGER")
            if "created_at" not in columns:
                missing_columns.append("ALTER TABLE incidents ADD COLUMN created_at DATETIME")
            if "updated_at" not in columns:
                missing_columns.append("ALTER TABLE incidents ADD COLUMN updated_at DATETIME")

            for statement in missing_columns:
                try:
                    conn.exec_driver_sql(statement)
                except Exception as e:
                    print(f"Migration notice: {e}")


def seed_default_incidents_if_empty() -> int:
    """Populate initial demo users, audit logs, and realistic incident data."""
    db = SessionLocal()
    try:
        # 1. Seed demo users
        if db.query(User).count() == 0:
            officer1 = User(
                email="officer@punjab.gov.in",
                phone="+91-98765-43210",
                full_name="Insp. R. Sharma (State Emergency Coordinator)",
                role=UserRole.OFFICER,
                badge_number="PB-DIS-092",
                department="Punjab State Disaster Response Authority",
                hashed_password=hash_password("Admin@123"),
                is_verified=True,
            )
            officer2 = User(
                email="dispatch@punjab.gov.in",
                phone="+91-98123-45678",
                full_name="Officer Simran Gill (NDRF Dispatcher)",
                role=UserRole.OFFICER,
                badge_number="PB-DIS-104",
                department="National Disaster Response Force (NDRF)",
                hashed_password=hash_password("Admin@123"),
                is_verified=True,
            )
            reporter1 = User(
                email="citizen@demo.in",
                phone="+91-99887-76655",
                full_name="Aarav Singh",
                role=UserRole.REPORTER,
                hashed_password=hash_password("Demo@123"),
                is_verified=True,
            )
            db.add_all([officer1, officer2, reporter1])
            db.commit()

        # 2. Seed realistic incidents if empty
        if db.query(Incident).count() == 0:
            from app.services.seed_data import generate_realistic_incidents

            teams = [
                "NDRF Team Alpha (Ludhiana)",
                "Punjab Fire & Rescue Unit 4",
                "Civil Hospital Emergency Medical Unit",
                "SDRF Water Rescue Squad",
                "State Highway Police Patrol",
            ]

            raw_incidents = generate_realistic_incidents(18)
            for idx, item in enumerate(raw_incidents):
                team = teams[idx % len(teams)] if item["status"] in ["in_progress", "resolved"] else None
                is_ver = item["status"] in ["investigating", "in_progress", "resolved"]
                ver_by = "Insp. R. Sharma (State Emergency Coordinator)" if is_ver else None
                res_notes = (
                    "Emergency responders successfully contained the situation. Area declared safe by incident commander."
                    if item["status"] == "resolved"
                    else None
                )

                inc = Incident(
                    tracking_code=f"EMG-{1001 + idx}",
                    type=item["type"],
                    severity=item["severity"],
                    status=item["status"],
                    latitude=item["latitude"],
                    longitude=item["longitude"],
                    description=item["description"],
                    summary=item["summary"],
                    people_affected=item["people_affected"],
                    priority=item["priority"],
                    confidence=item["confidence"],
                    source=item["source"],
                    report_count=item["report_count"],
                    assigned_team=team,
                    is_verified=is_ver,
                    verified_by=ver_by,
                    resolution_notes=res_notes,
                    reporter_name="Verified Citizen Reporter",
                    reporter_contact="[PROTECTED_CONTACT]",
                )
                db.add(inc)

            db.commit()

            # 3. Seed sample Audit Logs
            all_inc = db.query(Incident).all()
            for inc in all_inc[:5]:
                log1 = AuditLog(
                    incident_id=inc.id,
                    officer_name="Insp. R. Sharma",
                    action="VERIFIED",
                    details=f"Incident {inc.tracking_code} reviewed and verified for priority deployment.",
                    timestamp=datetime.utcnow() - timedelta(minutes=45),
                )
                db.add(log1)
                if inc.assigned_team:
                    log2 = AuditLog(
                        incident_id=inc.id,
                        officer_name="Officer Simran Gill",
                        action="ASSIGNED_TEAM",
                        details=f"Dispatched {inc.assigned_team} to coordinates ({inc.latitude:.4f}, {inc.longitude:.4f}).",
                        timestamp=datetime.utcnow() - timedelta(minutes=20),
                    )
                    db.add(log2)
            # 4. Seed sample Post-Rescue Reviews
            resolved_incs = db.query(Incident).filter(Incident.status == IncidentStatus.RESOLVED).all()
            for r_inc in resolved_incs[:4]:
                sample_review = Review(
                    incident_id=r_inc.id,
                    reporter_name="Verified Citizen (Aarav S.)",
                    response_time_rating=5,
                    rescue_efficiency_rating=5,
                    staff_behaviour_rating=4,
                    overall_rating=5,
                    feedback_text="NDRF and Police teams arrived in under 8 minutes. Evacuated our family with utmost professionalism.",
                    created_at=datetime.utcnow() - timedelta(minutes=15),
                )
                db.add(sample_review)
            db.commit()
            return len(raw_incidents)
        return 0
    finally:
        db.close()


def drop_db() -> None:
    """Drop all tables for testing/development."""
    Base.metadata.drop_all(bind=engine)


def create_upload_dir() -> None:
    """Create the upload directory if missing."""
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
