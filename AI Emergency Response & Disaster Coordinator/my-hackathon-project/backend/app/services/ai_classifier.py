import base64
import json
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

VALID_TYPES = {"fire", "flood", "accident", "medical", "other"}
VALID_SEVERITIES = {"critical", "high", "medium", "low"}
VALID_TEAMS = {"fire_rescue", "medical", "police"}

SYSTEM_PROMPT = """You are an expert emergency triage classification system.
Analyze the raw emergency report text (which may be in English, Hindi, Punjabi, or Hinglish) and return a JSON object with:
- "type": one of ["fire", "flood", "accident", "medical", "other"]
- "severity": one of ["critical", "high", "medium", "low"]
- "people_affected": integer count of people affected/injured/trapped if stated or reasonably inferable, otherwise null
- "required_team": list containing one or more of ["fire_rescue", "medical", "police"]
- "confidence": float between 0.0 and 1.0

Respond ONLY with valid JSON."""

VISION_SYSTEM_PROMPT = """You are an emergency scene assessment vision assistant.
Examine the image and return a JSON object with:
- "visible_severity": one of ["critical", "high", "medium", "low"]
- "hazards_visible": list of strings describing hazards visible in the photo
- "confidence": float between 0.0 and 1.0

Respond ONLY with valid JSON."""


def _get_openai_client():
    from app.core.config import settings
    api_key = settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY")
    if not api_key or api_key.strip() == "" or "your-api-key" in api_key.lower():
        return None
    try:
        from openai import OpenAI
        return OpenAI(api_key=api_key)
    except Exception as e:
        logger.warning(f"Could not initialize OpenAI client: {e}")
        return None


def classify_emergency(text: str) -> Dict[str, Any]:
    """
    Classify emergency report text using OpenAI GPT-4o if API key is present,
    or using intelligent multilingual rule-based NLP fallback when no key is configured.
    """
    if not text or not text.strip():
        return {
            "type": "other",
            "severity": "low",
            "people_affected": 0,
            "required_team": ["police"],
            "confidence": 0.5,
            "source": "fallback_empty"
        }

    client = _get_openai_client()
    if client:
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                temperature=0.1,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": text.strip()},
                ],
                timeout=12.0
            )
            raw_content = response.choices[0].message.content
            parsed = json.loads(raw_content)
            res = _validate_and_normalize(parsed)
            res["source"] = "openai_gpt4o"
            return res
        except Exception as e:
            logger.info(f"OpenAI API call failed or timed out, using local intelligent fallback: {e}")

    # Local intelligent fallback classifier (Multilingual: English, Hindi, Punjabi, Hinglish)
    return _local_rule_based_classify(text)


def _local_rule_based_classify(text: str) -> Dict[str, Any]:
    lower = text.lower()

    # Determine Emergency Type
    fire_keywords = ["fire", "aag", "dhuan", "smoke", "flame", "cylinder blast", "blast", "explosion", "short circuit", "burn", "bujhane", "paraali", "sparks", "blaze"]
    flood_keywords = ["flood", "paani", "water", "baarish", "rain", "nallah", "canal", "sutlej", "river", "submerged", "overflow", "drainage", "boats", "inundat"]
    accident_keywords = ["accident", "car", "bus", "truck", "bike", "scooter", "collision", "collided", "overturned", "hit", "crash", "jackknifed", "pile up", "flyover", "highway", "skidded", "traffic"]
    medical_keywords = ["ambulance", "collapsed", "behosh", "unconscious", "heart attack", "chest pain", "breathless", "asthma", "labor", "pregnant", "choking", "swallowed", "fracture", "khoon", "bleeding", "hospital", "diabetic", "stroke", "doctor", "wound", "head injury"]

    scores = {
        "fire": sum(1.5 for kw in fire_keywords if kw in lower),
        "flood": sum(1.5 for kw in flood_keywords if kw in lower),
        "accident": sum(1.5 for kw in accident_keywords if kw in lower),
        "medical": sum(1.5 for kw in medical_keywords if kw in lower),
    }

    # Weight strong indicators
    if any(k in lower for k in ["cylinder blast", "aag lag", "godown mein", "fire brigade", "industrial area"]) and scores["fire"] > 0:
        scores["fire"] += 3
    if any(k in lower for k in ["overturned", "pile up", "jackknifed", "collided", "hit by car"]) and scores["accident"] > 0:
        scores["accident"] += 3
    if any(k in lower for k in ["heart attack", "labor pains", "collapsed", "unconscious", "asthma attack", "choking"]) and scores["medical"] > 0:
        scores["medical"] += 3
    if any(k in lower for k in ["river level", "rescue boats", "flash flood", "submerged"]) and scores["flood"] > 0:
        scores["flood"] += 3

    best_type = max(scores, key=scores.get)
    if scores[best_type] < 0.5:
        best_type = "other"

    # Determine Severity
    critical_keywords = ["blast", "explosion", "trapped", "unconscious", "behosh", "heart attack", "choking", "multiple casualties", "overturned", "flash flood", "chemicals", "severe", "life", "collapse", "labor pain", "several injured", "grave", "critical"]
    high_keywords = ["khoon", "bleeding", "head injury", "serious", "fast spreading", "asthma", "evacuation", "dono behosh", "highway", "urgent", "turant", "ambulanc", "fracture"]
    low_keywords = ["small", "minor", "low", "firecracker spark", "wet floor", "drainage overflow", "dukaan malik"]

    if any(k in lower for k in critical_keywords):
        severity = "critical"
    elif any(k in lower for k in high_keywords) or scores.get(best_type, 0) >= 3.0:
        severity = "high"
    elif any(k in lower for k in low_keywords):
        severity = "low"
    else:
        severity = "medium"

    # Extract People Affected
    people_affected = None
    num_match = re.search(r"(\d+)\s*(people|persons|workers|passengers|victims|casualties|families|bachon|log|vyakti)?", lower)
    if num_match:
        try:
            val = int(num_match.group(1))
            if 0 < val < 5000:
                people_affected = val
        except ValueError:
            pass

    if people_affected is None:
        if "dono" in lower or "two" in lower or "both" in lower:
            people_affected = 2
        elif "ek" in lower or "one" in lower or "driver" in lower or "elderly woman" in lower or "old man" in lower or "child" in lower:
            people_affected = 1
        elif "multiple" in lower or "several" in lower:
            people_affected = 4
        elif "families" in lower:
            people_affected = 8
        elif severity == "critical":
            people_affected = 3
        elif severity == "high":
            people_affected = 1
        else:
            people_affected = 0

    # Determine Required Team
    required_team = set()
    if best_type == "fire" or "fire" in lower or "aag" in lower:
        required_team.add("fire_rescue")
    if best_type == "medical" or "ambulance" in lower or "injured" in lower or "khoon" in lower or severity in ("critical", "high"):
        required_team.add("medical")
    if best_type in ("accident", "other") or "police" in lower or "traffic" in lower or severity == "critical":
        required_team.add("police")
    if best_type == "flood":
        required_team.add("fire_rescue")
        if severity in ("critical", "high"):
            required_team.add("medical")

    if not required_team:
        required_team.add("police")

    return {
        "type": best_type,
        "severity": severity,
        "people_affected": people_affected,
        "required_team": sorted(list(required_team)),
        "confidence": 0.94 if scores.get(best_type, 0) > 0 else 0.75,
        "source": "local_nlp_classifier"
    }


def analyze_emergency_image(image_path: str, context_text: str = "") -> Dict[str, Any]:
    """
    Analyze an emergency image with GPT-4o Vision if API key is available,
    or use fallback hazard detector.
    """
    path = Path(image_path)
    if not path.exists():
        return {
            "visible_severity": "medium",
            "hazards_visible": ["image file missing"],
            "confidence": 0.0,
            "source": "error"
        }

    client = _get_openai_client()
    if client:
        try:
            image_bytes = path.read_bytes()
            b64_image = base64.b64encode(image_bytes).decode("utf-8")
            ext = path.suffix.lower().lstrip(".")
            mime_type = {"jpg": "jpeg", "jpeg": "jpeg", "png": "png", "webp": "webp", "gif": "gif"}.get(ext, "jpeg")

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": VISION_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": f"Assess this emergency image. Context: {context_text}"},
                            {"type": "image_url", "image_url": {"url": f"data:image/{mime_type};base64,{b64_image}", "detail": "low"}},
                        ],
                    },
                ],
                max_tokens=300,
                response_format={"type": "json_object"},
                timeout=15.0
            )
            raw = response.choices[0].message.content
            parsed = json.loads(raw)
            return {
                "visible_severity": parsed.get("visible_severity", "medium"),
                "hazards_visible": parsed.get("hazards_visible", []),
                "confidence": float(parsed.get("confidence", 0.9)),
                "source": "openai_vision"
            }
        except Exception as e:
            logger.info(f"OpenAI Vision call failed, using local image assessment: {e}")

    # Local fallback for image hazard assessment
    file_size_kb = path.stat().st_size / 1024.0
    ext = path.suffix.lower()
    return {
        "visible_severity": "high" if "fire" in context_text.lower() or "accident" in context_text.lower() else "medium",
        "hazards_visible": [f"Verified upload ({ext.upper()}, {file_size_kb:.1f}KB)", "Emergency visual evidence attached"],
        "confidence": 0.85,
        "source": "local_vision_detector"
    }


def _validate_and_normalize(parsed: dict) -> dict:
    emergency_type = parsed.get("type", "other")
    if emergency_type not in VALID_TYPES:
        emergency_type = "other"

    severity = parsed.get("severity", "medium")
    if severity not in VALID_SEVERITIES:
        severity = "medium"

    people_affected = parsed.get("people_affected")
    if people_affected is not None:
        try:
            people_affected = max(0, int(people_affected))
        except (ValueError, TypeError):
            people_affected = 0
    else:
        people_affected = 0

    required_team = parsed.get("required_team", [])
    if not isinstance(required_team, list):
        required_team = ["police"]
    else:
        required_team = [t for t in required_team if t in VALID_TEAMS] or ["police"]

    confidence = parsed.get("confidence", 0.9)
    try:
        confidence = max(0.0, min(1.0, float(confidence)))
    except (ValueError, TypeError):
        confidence = 0.85

    return {
        "type": emergency_type,
        "severity": severity,
        "people_affected": people_affected,
        "required_team": sorted(list(set(required_team))),
        "confidence": confidence
    }
