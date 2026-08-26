import os
import re
import json
from typing import Optional, List, Dict, Any

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()

openai_client = None
if OPENAI_API_KEY:
    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception as e:
        print(f"[Classifier] Warning: Could not initialize OpenAI client: {e}")
        openai_client = None


SYSTEM_PROMPT = """You are an emergency triage classification system. You will receive a raw emergency report (from a caller, dispatcher note, or field report) and must classify it accurately for emergency response routing.

Analyze the text and respond with a JSON object containing exactly these fields:
- "type": one of ["fire", "flood", "accident", "medical", "other"] — the primary category of the emergency.
- "severity": one of ["critical", "high", "medium", "low"] — based on immediate danger to life, scale of the incident, and urgency of response needed.
- "people_affected": integer count of people affected/injured/at risk if stated or reasonably inferable from the text, otherwise null.
- "required_teams": a list containing one or more of ["fire_rescue", "medical", "police"] — the response teams needed.
- "confidence": a float between 0 and 1.
- "summary": a short 1-sentence summary of the incident.

Respond with ONLY the JSON object."""


def fallback_rule_based_classifier(text: str) -> Dict[str, Any]:
    """
    Intelligent multi-lingual (English / Hindi / Hinglish / Punjabi) keyword and regex-based emergency triage classifier.
    Works 100% offline without needing any API key!
    """
    lower = text.lower()
    
    # 1. Determine Type
    fire_keywords = ["fire", "aag", "dhuan", "smoke", "cylinder blast", "blast", "explosion", "spark", "short circuit", "burning", "paraali", "crop fire", "flame"]
    flood_keywords = ["flood", "paani", "water", "rain", "baarish", "submerged", "overflow", "nallah", "drainage", "river", "sutlej", "canal", "drowning"]
    accident_keywords = ["accident", "car", "bus", "truck", "bike", "scooter", "vehicle", "collision", "overturned", "skidded", "highway", "traffic", "pile up", "flyover", "jackknifed"]
    medical_keywords = ["medical", "patient", "ambulance", "hospital", "collapsed", "diabetic", "heart attack", "chest pain", "asthma", "labor", "pregnant", "choking", "fracture", "unconscious", "head injury", "khoon", "blood", "injured", "ghayal", "behosh"]

    fire_score = sum(2 if kw in ["aag", "cylinder blast", "fire"] else 1 for kw in fire_keywords if kw in lower)
    flood_score = sum(2 if kw in ["flood", "sutlej", "nallah"] else 1 for kw in flood_keywords if kw in lower)
    accident_score = sum(2 if kw in ["accident", "collision", "overturned"] else 1 for kw in accident_keywords if kw in lower)
    medical_score = sum(2 if kw in ["heart attack", "asthma", "labor", "unconscious", "behosh"] else 1 for kw in medical_keywords if kw in lower)

    scores = {
        "fire": fire_score,
        "flood": flood_score,
        "accident": accident_score,
        "medical": medical_score,
    }

    best_type = max(scores, key=scores.get)
    if scores[best_type] == 0:
        best_type = "other"

    # 2. Determine Severity
    critical_indicators = [
        "cylinder blast", "blast", "explosion", "trapped", "collapsed", "not responding", 
        "unconscious", "behosh", "overturned", "multiple passengers", "labor", "heart attack", 
        "severe asthma", "chemical", "chemicals", "flash flood", "rescue boats", "life-threatening", 
        "choking", "several injured"
    ]
    high_indicators = [
        "spreading fast", "dhuan bahut", "khoon", "blood", "seriously injured", "ghayal", 
        "head injury", "highway", "urgently", "urgent", "canal overflow", "heavy rain", "water level badh"
    ]
    medium_indicators = [
        "short circuit", "electric pole", "sparks", "elderly", "fell", "fracture", 
        "submerged", "basement", "traffic jam", "paraali", "water entering", "rain"
    ]
    low_indicators = [
        "small fire", "firecracker", "drainage overflow", "minor", "contained"
    ]

    severity = "medium"
    if any(ind in lower for ind in critical_indicators):
        severity = "critical"
    elif any(ind in lower for ind in high_indicators):
        severity = "high"
    elif any(ind in lower for ind in low_indicators):
        severity = "low"
    elif any(ind in lower for ind in medium_indicators):
        severity = "medium"

    # 3. Determine Required Teams
    teams = set()
    if best_type == "fire" or "fire" in lower or "aag" in lower or "smoke" in lower or "cylinder" in lower:
        teams.add("fire_rescue")
    if best_type in ["medical", "accident"] or "injured" in lower or "khoon" in lower or "ambulance" in lower or "hospital" in lower or "pain" in lower:
        teams.add("medical")
    if best_type == "accident" or "police" in lower or "highway" in lower or "traffic" in lower or "chemical" in lower:
        teams.add("police")
    if best_type == "flood" or "flood" in lower or "boat" in lower:
        teams.add("fire_rescue")
        teams.add("police")

    if not teams:
        teams.add("police")

    # 4. Extract or Estimate People Affected
    people_affected = 0
    num_match = re.search(r'(\d+)\s*(people|passengers|riders|persons|workers|families|log|vyakti|victims)?', lower)
    if num_match:
        try:
            val = int(num_match.group(1))
            if 0 < val <= 500:
                people_affected = val
        except ValueError:
            pass

    if people_affected == 0:
        if "multiple" in lower or "several" in lower or "families" in lower:
            people_affected = 6
        elif "two" in lower or "dono" in lower:
            people_affected = 2
        elif severity == "critical":
            people_affected = 3
        elif severity == "high":
            people_affected = 1
        else:
            people_affected = 0

    return {
        "type": best_type,
        "severity": severity,
        "people_affected": people_affected,
        "required_teams": sorted(list(teams)),
        "confidence": 0.88,
        "summary": text[:120] + ("..." if len(text) > 120 else ""),
        "source": "heuristic_fallback"
    }


def classify_emergency(text: str) -> Dict[str, Any]:
    """
    Classify emergency report using OpenAI if API key is provided,
    otherwise fallback to intelligent heuristic classifier.
    """
    if not text or not text.strip():
        return fallback_rule_based_classifier("Emergency reported")

    if openai_client and os.environ.get("OPENAI_API_KEY"):
        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o",
                response_format={"type": "json_object"},
                temperature=0,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": text.strip()},
                ],
                timeout=10,
            )
            raw_content = response.choices[0].message.content
            parsed = json.loads(raw_content)
            
            valid_types = {"fire", "flood", "accident", "medical", "other"}
            valid_severities = {"critical", "high", "medium", "low"}
            
            emergency_type = parsed.get("type", "other")
            if emergency_type not in valid_types:
                emergency_type = "other"
                
            severity = parsed.get("severity", "medium")
            if severity not in valid_severities:
                severity = "medium"
                
            people_affected = parsed.get("people_affected")
            if people_affected is None or not isinstance(people_affected, int):
                people_affected = 0
                
            required_teams = parsed.get("required_teams") or parsed.get("required_team") or []
            if not isinstance(required_teams, list):
                required_teams = ["police"]
                
            confidence = float(parsed.get("confidence", 0.95))
            summary = parsed.get("summary", text[:120])
            
            return {
                "type": emergency_type,
                "severity": severity,
                "people_affected": people_affected,
                "required_teams": required_teams,
                "confidence": confidence,
                "summary": summary,
                "source": "openai_gpt4o"
            }
        except Exception as e:
            print(f"[Classifier] OpenAI call failed or returned error ({e}), using fallback rules.")

    return fallback_rule_based_classifier(text)
