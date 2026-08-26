from __future__ import annotations
import hashlib

def hash_aadhaar(raw_aadhaar: str) -> str:
    """
    Hashes the sanitized Aadhaar string for privacy-compliant storage.
    Stores SHA-256 digest of the last 4 digits for verification validation.
    """
    clean = raw_aadhaar.replace(" ", "").replace("-", "").strip()
    last4 = clean[-4:] if len(clean) >= 4 else clean
    return hashlib.sha256(last4.encode("utf-8")).hexdigest()

def verify_aadhaar_number(raw_aadhaar: str) -> bool:
    """
    Validates standard 12-digit Aadhaar pattern (accepts sandbox mock numbers for demo).
    """
    clean = raw_aadhaar.replace(" ", "").replace("-", "").strip()
    return len(clean) == 12 and clean.isdigit()
