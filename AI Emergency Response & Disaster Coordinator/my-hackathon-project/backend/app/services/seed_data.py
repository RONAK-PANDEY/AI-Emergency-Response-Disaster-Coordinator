"""Synthetic incident data generation for realistic dashboard demos."""

from __future__ import annotations

from datetime import datetime, timedelta
from random import Random
from typing import Any, Dict, List

from app.models import IncidentSeverity, IncidentStatus, IncidentType


CITY_SEED = [
    {"name": "Ludhiana", "latitude": 30.9010, "longitude": 75.8573},
    {"name": "Jalandhar", "latitude": 31.3260, "longitude": 75.5762},
    {"name": "Amritsar", "latitude": 31.6340, "longitude": 74.8723},
    {"name": "Chandigarh", "latitude": 30.7333, "longitude": 76.7794},
    {"name": "Patiala", "latitude": 30.3398, "longitude": 76.3869},
    {"name": "Mohali", "latitude": 30.7046, "longitude": 76.7179},
]

TYPE_PATTERNS = {
    IncidentType.FIRE: [
        "Warehouse fire spreading through storage bay with smoke visible from the road.",
        "Short circuit triggered a kitchen fire in a residential block; residents evacuated.",
        "Factory unit is on fire, workers are waiting for emergency response near the main gate.",
        "School building smoke alarm activated; visible flames reported from a classroom wing.",
    ],
    IncidentType.FLOOD: [
        "Rainwater has entered a residential lane and vehicles are partially submerged.",
        "Drain overflow is flooding the market square and forcing shops to shut down.",
        "A low-lying neighborhood is inundated after overnight heavy rainfall.",
        "Riverbank water level is rising, and families have started moving to higher ground.",
    ],
    IncidentType.ACCIDENT: [
        "Multiple-vehicle collision on a major bypass; traffic congestion is severe.",
        "A bike rider was struck by a truck near the city ring road and is unresponsive.",
        "Bus accident on a state highway caused a temporary road block and injuries.",
        "A tractor trailer overturned near the industrial corridor, blocking both lanes.",
    ],
    IncidentType.MEDICAL: [
        "Elderly patient reported chest pain and breathlessness near the clinic compound.",
        "A pregnant woman is in labor and needs emergency transport to the nearest hospital.",
        "A patient collapsed at a crowded bus stand and bystanders are performing CPR.",
        "A child with a sharp allergic reaction requires urgent medical attention.",
    ],
    IncidentType.INFRASTRUCTURE: [
        "A power line snapped in the market area and sparks are visible near the road.",
        "A pedestrian bridge has developed structural cracks and is closed for safety.",
        "A warehouse roof collapsed after a sudden downpour; debris is blocking access.",
        "Water mains burst beneath the road, causing sinkholes and blocked traffic.",
    ],
    IncidentType.PUBLIC_HEALTH: [
        "Several residents reported symptoms of food poisoning after a community gathering.",
        "A public health screening team is responding to a suspected disease outbreak.",
        "Clinic staff are reporting a surge in fever cases across a nearby housing cluster.",
        "A contaminated water supply alert is affecting local residents in a dense neighborhood.",
    ],
    IncidentType.SECURITY: [
        "A crowd gathered near the station after a reported theft and escalating arguments.",
        "Local authorities are monitoring a suspicious package near a public office building.",
        "A disturbance at a transit hub is escalating, and police support is needed.",
        "Residents report aggressive crowd movement and an armed confrontation near a market.",
    ],
    IncidentType.OTHER: [
        "Residents reported unusual fumes and confusion in a residential block.",
        "Community volunteers are requesting a response to a suspected hazardous spill.",
        "An overnight blackout has caused community distress in a dense urban neighborhood.",
        "Localized emergency assistance is needed after a sudden equipment failure in a public area.",
    ],
}

SEVERITY_WEIGHT = {
    IncidentSeverity.CRITICAL: 0.22,
    IncidentSeverity.HIGH: 0.31,
    IncidentSeverity.MEDIUM: 0.29,
    IncidentSeverity.LOW: 0.18,
}

STATUS_SEQUENCE = [
    IncidentStatus.NEW,
    IncidentStatus.REPORTED,
    IncidentStatus.INVESTIGATING,
    IncidentStatus.IN_PROGRESS,
    IncidentStatus.RESOLVED,
]


def _choose_severity(rng: Random) -> IncidentSeverity:
    roll = rng.random()
    threshold = 0.0
    for severity, weight in SEVERITY_WEIGHT.items():
        threshold += weight
        if roll <= threshold:
            return severity
    return IncidentSeverity.MEDIUM


def _choose_type(rng: Random) -> IncidentType:
    pool = [
        IncidentType.FIRE,
        IncidentType.FLOOD,
        IncidentType.ACCIDENT,
        IncidentType.MEDICAL,
        IncidentType.INFRASTRUCTURE,
        IncidentType.PUBLIC_HEALTH,
        IncidentType.SECURITY,
        IncidentType.OTHER,
    ]
    return rng.choice(pool)


def _choose_status(rng: Random, severity: IncidentSeverity) -> IncidentStatus:
    weighted = list(STATUS_SEQUENCE)
    if severity in {IncidentSeverity.CRITICAL, IncidentSeverity.HIGH}:
        weighted = [IncidentStatus.NEW, IncidentStatus.REPORTED, IncidentStatus.INVESTIGATING, IncidentStatus.IN_PROGRESS]
    elif severity in {IncidentSeverity.MEDIUM, IncidentSeverity.LOW}:
        weighted = [IncidentStatus.NEW, IncidentStatus.REPORTED, IncidentStatus.INVESTIGATING, IncidentStatus.RESOLVED]
    return rng.choice(weighted)


def _people_affected(severity: IncidentSeverity, incident_type: IncidentType, rng: Random) -> int:
    base = {
        IncidentSeverity.CRITICAL: 8,
        IncidentSeverity.HIGH: 5,
        IncidentSeverity.MEDIUM: 2,
        IncidentSeverity.LOW: 1,
    }[severity]
    if incident_type in {IncidentType.FIRE, IncidentType.ACCIDENT, IncidentType.FLOOD}:
        base += 4
    return max(0, base + rng.randint(0, 10))


def generate_realistic_incidents(count: int = 18) -> List[Dict[str, Any]]:
    rng = Random(42)
    incidents: List[Dict[str, Any]] = []
    now = datetime.utcnow()

    for index in range(count):
        city = rng.choice(CITY_SEED)
        incident_type = _choose_type(rng)
        severity = _choose_severity(rng)
        status = _choose_status(rng, severity)
        description = rng.choice(TYPE_PATTERNS[incident_type])
        base_lat = float(city["latitude"])
        base_lng = float(city["longitude"])
        latitude = round(base_lat + rng.uniform(-0.050, 0.055), 5)
        longitude = round(base_lng + rng.uniform(-0.060, 0.065), 5)
        created_at = (now - timedelta(hours=index * 2 + rng.randint(1, 8), minutes=rng.randint(0, 59))).isoformat()

        people = _people_affected(severity, incident_type, rng)
        priority = {
            IncidentSeverity.CRITICAL: 94,
            IncidentSeverity.HIGH: 79,
            IncidentSeverity.MEDIUM: 62,
            IncidentSeverity.LOW: 39,
        }.get(severity, 50)

        incidents.append(
            {
                "description": description,
                "latitude": latitude,
                "longitude": longitude,
                "type": incident_type.value,
                "severity": severity.value,
                "status": status.value,
                "summary": f"{incident_type.value.replace('_', ' ').title()} incident detected. {people} people affected. Initial assessment indicates a high-priority operational response.",
                "people_affected": people,
                "priority": priority,
                "confidence": round(0.82 + rng.random() * 0.15, 3),
                "source": rng.choice(["mobile_app", "web", "voice", "image"]),
                "report_count": 1 if rng.random() > 0.7 else rng.randint(1, 3),
                "created_at": created_at,
            }
        )

    return incidents
