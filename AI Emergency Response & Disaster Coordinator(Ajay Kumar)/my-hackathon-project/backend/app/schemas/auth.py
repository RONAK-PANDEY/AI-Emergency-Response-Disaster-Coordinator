"""
Pydantic schemas for authentication, OTP verification, and user management
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class SendOTPRequest(BaseModel):
    identifier: str = Field(..., description="Email or phone number")
    purpose: str = Field("login_or_signup", description="Purpose: 'login', 'signup', or 'verification'")


class VerifyOTPRequest(BaseModel):
    identifier: str = Field(..., description="Email or phone number")
    otp_code: str = Field(..., min_length=4, max_length=10)
    full_name: Optional[str] = None
    role: str = Field("reporter", description="'reporter' or 'officer'")


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email or phone")
    password: str = Field(..., min_length=1)
    portal: str = Field("reporter", description="'reporter' or 'officer'")


class UserOut(BaseModel):
    id: int
    email: str
    phone: Optional[str] = None
    full_name: str
    role: str
    badge_number: Optional[str] = None
    department: Optional[str] = None
    is_verified: bool
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token: str
    user: UserOut
    message: str
