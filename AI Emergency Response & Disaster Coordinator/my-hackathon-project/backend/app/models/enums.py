from __future__ import annotations
import enum

class IncidentType(str, enum.Enum):
    FIRE = "fire"
    FLOOD = "flood"
    ACCIDENT = "accident"
    MEDICAL = "medical"
    OTHER = "other"

class IncidentSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    UNCLASSIFIED = "unclassified"

class IncidentStatus(str, enum.Enum):
    NEW = "new"
    REPORTED = "reported"
    DISPATCHED = "dispatched"
    RESOLVED = "resolved"
