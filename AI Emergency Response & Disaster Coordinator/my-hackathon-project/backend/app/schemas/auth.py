from __future__ import annotations
from typing import Optional
from pydantic import BaseModel

class OfficerLoginRequest(BaseModel):
    officer_id: str
    pin: str

class OfficerLoginResponse(BaseModel):
    authenticated: bool
    officer_id: str
    name: str
    role: str
    badge_number: str
    access_token: str

class AadhaarVerifyRequest(BaseModel):
    name: str
    aadhaar_number: str
    dob: str
    phone: Optional[str] = None

class AadhaarVerifyResponse(BaseModel):
    verified: bool
    name: str
    masked_aadhaar: str
    verification_token: str
    message: str
