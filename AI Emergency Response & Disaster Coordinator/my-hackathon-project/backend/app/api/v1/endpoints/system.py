from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.enums import IncidentSeverity, IncidentStatus, IncidentType
from app.models.models import Incident

router = APIRouter()

@router.get("/ping")
def ping():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": "production-demo",
        "standard": "Section 33(b) Disaster Management Act 2005"
    }

@router.post("/seed")
def seed_demo_data(db: Session = Depends(get_db)):
    scenarios = [
        {"description": "Aag lag gayi hai godown mein near Ludhiana grain market, dhuan bahut zyada hai, please send fire brigade fast", "latitude": 30.901, "longitude": 75.8573, "type": IncidentType.FIRE, "severity": IncidentSeverity.HIGH, "people_affected": 2, "required_team": "fire_rescue, medical", "status": IncidentStatus.DISPATCHED, "is_anonymous": False, "is_verified": True, "reporter_name": "Gurpreet Singh"},
        {"description": "Car accident on GT Road near Jalandhar bypass, ek vyakti seriously injured, khoon bah raha hai", "latitude": 31.326, "longitude": 75.5762, "type": IncidentType.ACCIDENT, "severity": IncidentSeverity.HIGH, "people_affected": 1, "required_team": "medical, police", "status": IncidentStatus.DISPATCHED, "is_anonymous": False, "is_verified": True, "reporter_name": "Manpreet Kaur"},
        {"description": "Heavy rain se galiyan mein paani bhar gaya hai in Amritsar Ranjit Avenue, ghar ke andar water entering", "latitude": 31.634, "longitude": 74.8723, "type": IncidentType.FLOOD, "severity": IncidentSeverity.MEDIUM, "people_affected": 5, "required_team": "fire_rescue", "status": IncidentStatus.NEW, "is_anonymous": True, "is_verified": False, "reporter_name": None},
        {"description": "My father collapsed suddenly, he is diabetic, not responding, Model Town Ludhiana, need ambulance urgently", "latitude": 30.9084, "longitude": 75.8477, "type": IncidentType.MEDICAL, "severity": IncidentSeverity.CRITICAL, "people_affected": 1, "required_team": "medical", "status": IncidentStatus.DISPATCHED, "is_anonymous": False, "is_verified": True, "reporter_name": "Sukhwinder Sharma"},
        {"description": "Short circuit se electric pole mein aag lagi hai residential area, sparks flying, bachon ko andar rakha hai", "latitude": 30.8951, "longitude": 75.8419, "type": IncidentType.FIRE, "severity": IncidentSeverity.MEDIUM, "people_affected": 3, "required_team": "fire_rescue, police", "status": IncidentStatus.NEW, "is_anonymous": True, "is_verified": False, "reporter_name": None},
        {"description": "Bus overturned on Jalandhar-Amritsar highway, multiple passengers injured, urgent rescue needed", "latitude": 31.42, "longitude": 75.256, "type": IncidentType.ACCIDENT, "severity": IncidentSeverity.CRITICAL, "people_affected": 12, "required_team": "medical, fire_rescue, police", "status": IncidentStatus.DISPATCHED, "is_anonymous": False, "is_verified": True, "reporter_name": "Harjinder Bains"},
        {"description": "Sutlej river ka water level badh raha hai near village outskirts Ludhiana, evacuation may be needed", "latitude": 30.821, "longitude": 75.78, "type": IncidentType.FLOOD, "severity": IncidentSeverity.HIGH, "people_affected": 20, "required_team": "fire_rescue, police", "status": IncidentStatus.NEW, "is_anonymous": False, "is_verified": True, "reporter_name": "Rajveer Gill"},
        {"description": "Kitchen mein cylinder blast hua hai, ghar ka ek hissa damage, kripya turant madad bhejo", "latitude": 31.335, "longitude": 75.579, "type": IncidentType.FIRE, "severity": IncidentSeverity.CRITICAL, "people_affected": 4, "required_team": "fire_rescue, medical", "status": IncidentStatus.DISPATCHED, "is_anonymous": False, "is_verified": False, "reporter_name": "Anonymous"},
        {"description": "Pregnant woman having labor pains, ghar pe koi vehicle nahi hai, need ambulance to hospital immediately", "latitude": 30.899, "longitude": 75.86, "type": IncidentType.MEDICAL, "severity": IncidentSeverity.CRITICAL, "people_affected": 1, "required_team": "medical", "status": IncidentStatus.RESOLVED, "is_anonymous": False, "is_verified": True, "reporter_name": "Paramjit Kaur"},
        {"description": "Factory fire spreading fast in industrial area near Focal Point, workers trapped inside", "latitude": 30.885, "longitude": 75.839, "type": IncidentType.FIRE, "severity": IncidentSeverity.CRITICAL, "people_affected": 8, "required_team": "fire_rescue, medical, police", "status": IncidentStatus.DISPATCHED, "is_anonymous": False, "is_verified": True, "reporter_name": "Amarjit Dhaliwal"},
    ]

    added = []
    for item in scenarios:
        inc = Incident(
            type=item["type"],
            severity=item["severity"],
            latitude=item["latitude"],
            longitude=item["longitude"],
            description=item["description"],
            people_affected=item["people_affected"],
            required_team=item["required_team"],
            status=item["status"],
            is_anonymous=item.get("is_anonymous", False),
            is_verified=item.get("is_verified", False),
            reporter_name=item.get("reporter_name"),
        )
        db.add(inc)
        added.append(inc)
    db.commit()
    return {"message": f"Successfully seeded {len(added)} official Punjab emergency incidents", "count": len(added)}
