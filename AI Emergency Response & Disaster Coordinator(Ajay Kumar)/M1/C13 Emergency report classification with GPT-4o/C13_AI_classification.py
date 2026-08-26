import json
import os
from typing import Optional
from openai import OpenAI, OpenAIError

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

SYSTEM_PROMPT = """You are an emergency triage classification system. You will receive a raw emergency report (from a caller, dispatcher note, or field report) and must classify it accurately for emergency response routing.

Analyze the text and respond with a JSON object containing exactly these fields:

- "type": one of ["fire", "flood", "accident", "medical", "other"] — the primary category of the emergency.
- "severity": one of ["critical", "high", "medium", "low"] — based on immediate danger to life, scale of the incident, and urgency of response needed.
  - critical: immediate threat to life, multiple casualties, or rapidly worsening situation
  - high: serious injury/risk present, requires urgent response
  - medium: real but non-life-threatening situation
  - low: minor incident, no immediate danger
- "people_affected": integer count of people affected/injured/at risk if stated or reasonably inferable from the text, otherwise null. Do not guess wildly — only provide a number if the text gives a real basis for one.
- "required_team": a list containing one or more of ["fire_rescue", "medical", "police"] — the response teams needed based on the situation described.
- "confidence": a float between 0 and 1 representing your confidence in this classification given the information available. Use lower values when the report is vague, ambiguous, or missing key details.

Respond with ONLY the JSON object. Do not include explanations, markdown formatting, or any other text."""


def classify_emergency(text: str) -> dict:
    """
    Classify a raw emergency report using GPT-4o in JSON mode.

    Args:
        text: Raw emergency report text (e.g., a 911 call transcript,
              dispatcher note, or field report).

    Returns:
        A dict with keys: type, severity, people_affected, required_team,
        confidence. On failure, returns a fallback dict with type="other",
        severity="medium" (fail-safe, not fail-low), confidence=0.0, and an
        "error" key describing what went wrong.
    """
    if not text or not text.strip():
        return _fallback_result("Empty or missing input text.")

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            temperature=0,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": text.strip()},
            ],
        )
    except OpenAIError as e:
        return _fallback_result(f"OpenAI API error: {e}")

    raw_content = response.choices[0].message.content

    try:
        parsed = json.loads(raw_content)
    except (json.JSONDecodeError, TypeError) as e:
        return _fallback_result(f"Malformed JSON response: {e}", raw=raw_content)

    return _validate_and_normalize(parsed)


def _validate_and_normalize(parsed: dict) -> dict:
    """Validate fields returned by the model and coerce/repair where possible."""
    valid_types = {"fire", "flood", "accident", "medical", "other"}
    valid_severities = {"critical", "high", "medium", "low"}
    valid_teams = {"fire_rescue", "medical", "police"}

    errors = []

    # type
    emergency_type = parsed.get("type")
    if emergency_type not in valid_types:
        errors.append(f"Invalid or missing 'type': {emergency_type!r}")
        emergency_type = "other"

    # severity
    severity = parsed.get("severity")
    if severity not in valid_severities:
        errors.append(f"Invalid or missing 'severity': {severity!r}")
        severity = "medium"

    # people_affected
    people_affected: Optional[int] = parsed.get("people_affected")
    if people_affected is not None:
        try:
            people_affected = int(people_affected)
            if people_affected < 0:
                errors.append("Negative people_affected coerced to null.")
                people_affected = None
        except (ValueError, TypeError):
            errors.append(f"Invalid 'people_affected': {parsed.get('people_affected')!r}")
            people_affected = None

    # required_team
    required_team = parsed.get("required_team")
    if not isinstance(required_team, list):
        errors.append(f"Invalid 'required_team': {required_team!r}")
        required_team = []
    else:
        cleaned_team = [t for t in required_team if t in valid_teams]
        if len(cleaned_team) != len(required_team):
            errors.append("Some required_team entries were invalid and dropped.")
        required_team = sorted(set(cleaned_team))

    # confidence
    confidence = parsed.get("confidence")
    try:
        confidence = float(confidence)
        confidence = max(0.0, min(1.0, confidence))
    except (ValueError, TypeError):
        errors.append(f"Invalid 'confidence': {parsed.get('confidence')!r}")
        confidence = 0.0

    result = {
        "type": emergency_type,
        "severity": severity,
        "people_affected": people_affected,
        "required_team": required_team,
        "confidence": confidence,
    }

    if errors:
        result["warnings"] = errors

    return result


def _fallback_result(reason: str, raw: str = None) -> dict:
    """
    Fail-safe result used when the API call fails or returns unparseable JSON.
    Defaults to a conservative, non-dismissive classification rather than
    silently under-reporting severity.
    """
    result = {
        "type": "other",
        "severity": "medium",
        "people_affected": None,
        "required_team": [],
        "confidence": 0.0,
        "error": reason,
    }
    if raw is not None:
        result["raw_response"] = raw
    return result


if __name__ == "__main__":
    sample = "There's a large fire spreading through an apartment building on 5th street, at least 3 people are trapped on the top floor and smoke is heavy."
    print(json.dumps(classify_emergency(sample), indent=2))