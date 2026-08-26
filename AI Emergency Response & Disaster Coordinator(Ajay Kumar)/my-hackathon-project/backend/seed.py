"""Seed script to populate the database with realistic sample incidents."""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, init_db
from app.models import Incident
from app.services.seed_data import generate_realistic_incidents


def seed_database():
    """Populate the database with realistic sample incidents."""
    init_db()
    db = SessionLocal()

    try:
        db.query(Incident).delete()
        incidents = generate_realistic_incidents(18)
        for item in incidents:
            db.add(
                Incident(
                    description=item["description"],
                    latitude=item["latitude"],
                    longitude=item["longitude"],
                    type=item["type"],
                    severity=item["severity"],
                    status=item["status"],
                    summary=item.get("summary", item["description"]),
                    people_affected=item["people_affected"],
                    priority=item.get("priority", 50),
                    confidence=item.get("confidence", 0.8),
                    source=item.get("source", "web"),
                    report_count=item.get("report_count", 1),
                )
            )

        db.commit()
        print(f"Successfully seeded {len(incidents)} realistic incidents into the database")
    except Exception as exc:
        print(f"Error seeding database: {exc}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
