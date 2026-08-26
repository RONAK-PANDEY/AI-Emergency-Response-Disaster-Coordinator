import base64
import json
import os
from pathlib import Path
from openai import OpenAI

# Initialize OpenAI client (uses OPENAI_API_KEY environment variable)
client = OpenAI()

# The exact prompt used for analysis
ANALYSIS_PROMPT = """Analyze this image for emergency/safety assessment. You are an emergency response analyst.

Provide your response as valid JSON with these exact fields:
{
  "visible_severity": "critical/high/medium/low",
  "hazards_visible": ["list", "of", "identified", "hazards"],
  "confidence": 0.0-1.0
}

Instructions:
1. visible_severity: Assess overall severity
   - "critical": Immediate life-threatening hazards, severe injury risk, active fires, explosions, unstable structures
   - "high": Serious hazards present, moderate injury risk, hazardous materials, medical emergencies
   - "medium": Notable hazards or safety concerns, minor to moderate injury risk
   - "low": No apparent immediate hazards or minor safety concerns

2. hazards_visible: List specific hazards you identify. Be specific and concise. Examples:
   - Fire/flames
   - Smoke
   - Electrical hazards
   - Chemical spills
   - Structural damage
   - Victims/injuries
   - Vehicle accidents
   - Weather-related hazards
   - Hazardous materials
   - Unstable surfaces

3. confidence: Your confidence in this assessment (0.0 = no confidence, 1.0 = absolute certainty)
   Consider image clarity, visibility, and your ability to assess the situation

Return ONLY valid JSON, no additional text or markdown."""


def analyze_emergency_image(image_path: str) -> dict:
    """
    Analyze an emergency/safety image using OpenAI's GPT-4o vision model.
    
    Args:
        image_path (str): Path to the image file (supports: jpg, jpeg, png, gif, webp)
    
    Returns:
        dict: Analysis results with keys:
            - visible_severity (str): One of 'critical', 'high', 'medium', 'low'
            - hazards_visible (list): List of identified hazards
            - confidence (float): Confidence score 0.0-1.0
            - error (str): Present if an error occurred during analysis
    
    Raises:
        FileNotFoundError: If the image file doesn't exist
        ValueError: If the file is not a supported image format
    """
    
    # Validate file exists
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file not found: {image_path}")
    
    # Validate file format
    valid_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    file_ext = Path(image_path).suffix.lower()
    if file_ext not in valid_extensions:
        raise ValueError(
            f"Unsupported image format: {file_ext}. "
            f"Supported formats: {', '.join(valid_extensions)}"
        )
    
    # Determine media type
    media_type_map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    }
    media_type = media_type_map[file_ext]
    
    # Read and encode image to base64
    try:
        with open(image_path, 'rb') as image_file:
            image_data = base64.standard_b64encode(image_file.read()).decode('utf-8')
    except IOError as e:
        return {
            "visible_severity": None,
            "hazards_visible": [],
            "confidence": 0.0,
            "error": f"Failed to read image file: {str(e)}"
        }
    
    # Call OpenAI GPT-4o vision API
    try:
        response = client.messages.create(
            model="gpt-4o",
            max_tokens=500,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": image_data,
                            },
                        },
                        {
                            "type": "text",
                            "text": ANALYSIS_PROMPT
                        }
                    ],
                }
            ],
        )
        
        # Extract the response text
        response_text = response.content[0].text
        
        # Parse JSON response
        try:
            result = json.loads(response_text)
            
            # Validate required fields
            if not all(key in result for key in ['visible_severity', 'hazards_visible', 'confidence']):
                return {
                    "visible_severity": None,
                    "hazards_visible": [],
                    "confidence": 0.0,
                    "error": "API response missing required fields"
                }
            
            # Validate severity value
            if result['visible_severity'] not in ['critical', 'high', 'medium', 'low']:
                return {
                    "visible_severity": None,
                    "hazards_visible": [],
                    "confidence": 0.0,
                    "error": f"Invalid severity value: {result['visible_severity']}"
                }
            
            # Ensure confidence is a float between 0 and 1
            if not isinstance(result['confidence'], (int, float)) or not 0.0 <= result['confidence'] <= 1.0:
                result['confidence'] = max(0.0, min(1.0, float(result['confidence'])))
            
            # Ensure hazards_visible is a list
            if not isinstance(result['hazards_visible'], list):
                result['hazards_visible'] = []
            
            return result
            
        except json.JSONDecodeError:
            return {
                "visible_severity": None,
                "hazards_visible": [],
                "confidence": 0.0,
                "error": f"Failed to parse API response as JSON: {response_text}"
            }
    
    except Exception as e:
        return {
            "visible_severity": None,
            "hazards_visible": [],
            "confidence": 0.0,
            "error": f"API call failed: {str(e)}"
        }


# Example usage
if __name__ == "__main__":
    # Example: analyze an image
    # Make sure to set OPENAI_API_KEY environment variable first
    
    test_image_path = "emergency_photo.jpg"  # Replace with actual image path
    
    if os.path.exists(test_image_path):
        result = analyze_emergency_image(test_image_path)
        print(json.dumps(result, indent=2))
    else:
        print(f"Test image not found: {test_image_path}")
        print("Please provide a valid image path to analyze.")