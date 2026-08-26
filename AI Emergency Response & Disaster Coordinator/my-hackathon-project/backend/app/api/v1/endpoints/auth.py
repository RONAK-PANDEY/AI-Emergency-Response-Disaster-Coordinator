from __future__ import annotations
from fastapi import APIRouter, HTTPException
from app.core.security import verify_aadhaar_number
from app.schemas.auth import AadhaarVerifyRequest, AadhaarVerifyResponse, OfficerLoginRequest, OfficerLoginResponse

router = APIRouter()

OFFICER_REGISTRY = {
    "OFFICER1": {"pin": "1234", "name": "Officer Gurpreet Singh", "role": "Chief Dispatcher", "badge": "PB-SEOC-901"},
    "OFFICER2": {"pin": "5678", "name": "Officer Raman Sharma", "role": "State Disaster Coordinator", "badge": "PB-SEOC-412"},
    "ADMIN": {"pin": "0000", "name": "Commandant Sukhwinder", "role": "State Disaster Lead", "badge": "PB-HQ-001"},
}

@router.post("/officer-login", response_model=OfficerLoginResponse)
def officer_login(payload: OfficerLoginRequest):
    key = payload.officer_id.upper().strip()
    officer = OFFICER_REGISTRY.get(key)
    if not officer or officer["pin"] != payload.pin:
        raise HTTPException(status_code=401, detail="Invalid Officer Credentials or Security PIN")
    
    return {
        "authenticated": True,
        "officer_id": key,
        "name": officer["name"],
        "role": officer["role"],
        "badge_number": officer["badge"],
        "access_token": f"seoc_jwt_{key.lower()}_token_prod",
    }

@router.post("/verify-aadhaar", response_model=AadhaarVerifyResponse)
def verify_aadhaar(payload: AadhaarVerifyRequest):
    clean = payload.aadhaar_number.replace(" ", "").replace("-", "").strip()
    if not verify_aadhaar_number(clean):
        raise HTTPException(status_code=400, detail="Aadhaar number must contain exactly 12 numeric digits.")
    
    masked = f"XXXX XXXX {clean[-4:]}"
    return {
        "verified": True,
        "name": payload.name,
        "masked_aadhaar": masked,
        "verification_token": f"uidai_mock_token_{clean[-4:]}",
        "message": "Citizen identity verified successfully via UIDAI Sandbox."
    }
