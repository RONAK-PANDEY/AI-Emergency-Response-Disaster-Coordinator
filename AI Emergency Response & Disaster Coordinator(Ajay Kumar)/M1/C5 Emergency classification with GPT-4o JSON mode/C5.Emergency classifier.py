"""
Emergency Report Classification using OpenAI GPT-4o with JSON Mode

This module provides a function to classify raw emergency report text into
structured JSON with type, severity, people affected, required teams, and confidence.
"""

import json
import logging
from typing import Optional
from openai import OpenAI, APIError, APIConnectionError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# System prompt used for classification
SYSTEM_PROMPT = """You are an emergency dispatch classification system. Your task is to analyze raw emergency report text and classify it into a structured format.

You MUST respond ONLY with valid JSON (no markdown, no code blocks, no preamble) matching this exact schema:
{
  "type": "fire|flood|accident|medical|other",
  "severity": "critical|high|medium|low",
  "people_affected": <integer or null>,
  "required_team": ["fire_rescue", "medical", "police"] (subset of these),
  "confidence": <float between 0.0 and 1.0>
}

Guidelines:
- "type": Categorize the emergency type. Use "other" for unclear/mixed reports.
- "severity": Critical = life-threatening, immediate risk. High = serious but not immediately life-threatening. Medium = requires response but not urgent. Low = minor incident, informational.
- "people_affected": Number of people affected (exact count if known, estimated range if not, or null if unknown).
- "required_team": List the dispatch teams needed. Always prioritize based on the specific emergency.
- "confidence": Your confidence in this classification (0.0 = very unsure, 1.0 = absolutely certain)."""


def classify_emergency(text: str, api_key: Optional[str] = None) -> dict:
    """
    Classify an emergency report text into structured JSON format.
    
    Args:
        text: Raw emergency report text to classify
        api_key: OpenAI API key (if None, uses OPENAI_API_KEY environment variable)
    
    Returns:
        Dictionary with keys: type, severity, people_affected, required_team, confidence
        Raises ValueError if classification fails or response is malformed
    
    Example:
        >>> result = classify_emergency("House fire on Main Street, 2 people trapped")
        >>> print(result)
        {
            'type': 'fire',
            'severity': 'critical',
            'people_affected': 2,
            'required_team': ['fire_rescue', 'medical'],
            'confidence': 0.95
        }
    """
    
    if not text or not isinstance(text, str):
        raise ValueError("text must be a non-empty string")
    
    try:
        # Initialize OpenAI client
        client = OpenAI(api_key=api_key)
        
        # Call GPT-4o with JSON mode
        response = client.beta.chat.completions.parse(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": f"Emergency report: {text}"
                }
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "EmergencyClassification",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "type": {
                                "type": "string",
                                "enum": ["fire", "flood", "accident", "medical", "other"],
                                "description": "Type of emergency"
                            },
                            "severity": {
                                "type": "string",
                                "enum": ["critical", "high", "medium", "low"],
                                "description": "Severity level"
                            },
                            "people_affected": {
                                "type": ["integer", "null"],
                                "description": "Number of people affected"
                            },
                            "required_team": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "enum": ["fire_rescue", "medical", "police"]
                                },
                                "description": "Required dispatch teams"
                            },
                            "confidence": {
                                "type": "number",
                                "minimum": 0.0,
                                "maximum": 1.0,
                                "description": "Confidence score (0-1)"
                            }
                        },
                        "required": ["type", "severity", "people_affected", "required_team", "confidence"],
                        "additionalProperties": False
                    }
                }
            }
        )
        
        # Parse response - with JSON mode, the content should be valid JSON
        try:
            result = response.parsed
            
            # Validate response structure
            required_keys = {"type", "severity", "people_affected", "required_team", "confidence"}
            if not all(key in result.__dict__ for key in required_keys):
                missing = required_keys - set(result.__dict__.keys())
                raise ValueError(f"Response missing required keys: {missing}")
            
            # Convert Pydantic model to dict if necessary
            if hasattr(result, "model_dump"):
                classification = result.model_dump()
            else:
                classification = dict(result)
            
            # Additional validation
            if not isinstance(classification["confidence"], (int, float)):
                raise ValueError("confidence must be a number")
            if not 0.0 <= classification["confidence"] <= 1.0:
                raise ValueError("confidence must be between 0.0 and 1.0")
            
            if classification["people_affected"] is not None:
                if not isinstance(classification["people_affected"], int):
                    raise ValueError("people_affected must be an integer or null")
                if classification["people_affected"] < 0:
                    raise ValueError("people_affected cannot be negative")
            
            if not isinstance(classification["required_team"], list):
                raise ValueError("required_team must be a list")
            
            valid_teams = {"fire_rescue", "medical", "police"}
            invalid_teams = set(classification["required_team"]) - valid_teams
            if invalid_teams:
                raise ValueError(f"Invalid teams in required_team: {invalid_teams}")
            
            logger.info(f"Successfully classified emergency report with confidence {classification['confidence']}")
            return classification
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {e}")
            raise ValueError(f"API returned malformed JSON: {e}")
    
    except APIConnectionError as e:
        logger.error(f"Failed to connect to OpenAI API: {e}")
        raise ValueError(f"Connection error: {e}")
    except APIError as e:
        logger.error(f"OpenAI API error: {e}")
        raise ValueError(f"API error: {e}")


if __name__ == "__main__":
    # Example usage
    test_reports = [
        "House fire at 123 Main Street, 2 people trapped on the second floor, heavy smoke visible",
        "Car accident on Highway 95, 3 vehicles involved, one person unconscious",
        "Medical emergency - 65-year-old male with chest pain at the mall",
        "Flooding in the basement of downtown library, water level rising",
        "Suspicious package found at the train station"
    ]
    
    for report in test_reports:
        print(f"\nReport: {report[:60]}...")
        try:
            result = classify_emergency(report)
            print(f"Classification: {json.dumps(result, indent=2)}")
        except ValueError as e:
            print(f"Error: {e}")