"""
Image analysis using OpenAI GPT-4o Vision
"""

import base64
import json
from pathlib import Path
from typing import Optional
from openai import OpenAI

from app.core.config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

MODEL = settings.OPENAI_MODEL

SYSTEM_PROMPT = (
    "You are an emergency scene assessment assistant. You will be shown a "
    "single photo of a real-world scene. Your job is to assess visible risk "
    "based ONLY on what can be seen in the image itself -- do not guess at "
    "anything outside the frame or infer facts not visible in the photo. "
    "Respond with STRICT JSON only, no markdown, no commentary, matching "
    "this exact schema:\n\n"
    "{\n"
    '  "visible_severity": "critical" | "high" | "medium" | "low",\n'
    '  "hazards_visible": [string, ...],\n'
    '  "confidence": float between 0.0 and 1.0\n'
    "}\n\n"
    "Guidance for visible_severity:\n"
    "- critical: immediate life-threatening danger clearly visible "
    "(e.g. active fire, structural collapse, visible severe injury, "
    "submersion, exposed high-voltage lines)\n"
    "- high: a serious hazard is visible that could cause significant harm "
    "if unaddressed (e.g. heavy smoke, unstable structure, large hazardous "
    "spill, blocked exits)\n"
    "- medium: a hazard is visible but does not appear immediately "
    "dangerous (e.g. minor debris, small contained fire, wet floor)\n"
    "- low: no significant hazard is visible in the image\n\n"
    'hazards_visible should list short, specific labels for each hazard you '
    'can see (e.g. "visible smoke", "downed power line", "structural '
    'damage", "standing water"). If nothing hazardous is visible, return an '
    "empty list.\n\n"
    "confidence should reflect how confident you are in THIS assessment "
    "given image clarity, angle, distance, and how much of the scene is "
    "visible. Lower confidence for blurry, distant, dark, or partially "
    "obscured images.\n\n"
    "Output only the JSON object and nothing else."
)

USER_PROMPT = (
    "Assess this image for visible emergency-relevant hazards and "
    "severity. Return only the JSON object described in the system "
    "instructions."
)

_VALID_SEVERITIES = {"critical", "high", "medium", "low"}
_MIME_MAP = {"jpg": "jpeg", "jpeg": "jpeg", "png": "png", "webp": "webp", "gif": "gif"}


def analyze_emergency_image(image_path: str) -> dict:
    """
    Analyze a single image for visible emergency-relevant hazards using
    GPT-4o vision.

    Args:
        image_path: Path to a local image file (jpg, png, webp, gif).

    Returns:
        dict with keys:
            - visible_severity: "critical" | "high" | "medium" | "low"
            - hazards_visible: list[str]
            - confidence: float in [0.0, 1.0]

    Raises:
        FileNotFoundError: if image_path does not exist.
        ValueError: if the model response isn't valid JSON or doesn't match
            the expected schema.
    """
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not configured")

    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    image_bytes = path.read_bytes()
    b64_image = base64.b64encode(image_bytes).decode("utf-8")

    ext = path.suffix.lower().lstrip(".")
    mime_type = _MIME_MAP.get(ext, "jpeg")

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": USER_PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/{mime_type};base64,{b64_image}",
                            "detail": "high",
                        },
                    },
                ],
            },
        ],
        max_tokens=500,
        temperature=0,
        response_format={"type": "json_object"},
    )

    raw_content = response.choices[0].message.content

    try:
        result = json.loads(raw_content)
    except json.JSONDecodeError as e:
        raise ValueError(f"Model did not return valid JSON: {raw_content!r}") from e

    required_keys = {"visible_severity", "hazards_visible", "confidence"}
    if not required_keys.issubset(result.keys()):
        raise ValueError(f"Response missing required keys: {result}")

    if result["visible_severity"] not in _VALID_SEVERITIES:
        raise ValueError(f"Invalid visible_severity value: {result['visible_severity']}")

    if not isinstance(result["hazards_visible"], list):
        raise ValueError("hazards_visible must be a list")

    confidence = result["confidence"]
    if not isinstance(confidence, (int, float)) or not (0.0 <= float(confidence) <= 1.0):
        raise ValueError(f"confidence must be a float in [0, 1], got {confidence}")

    return {
        "visible_severity": result["visible_severity"],
        "hazards_visible": [str(h) for h in result["hazards_visible"]],
        "confidence": float(confidence),
    }
