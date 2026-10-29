from typing import Any, List, Optional, Dict
from pydantic import BaseModel, Field
from datetime import datetime

class UserProfileBase(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    state_code: Optional[str] = "IN-MH"
    district_name: Optional[str] = None
    taluka: Optional[str] = None
    village_city: Optional[str] = None
    residency_area: Optional[str] = None  # "RURAL" | "URBAN"
    is_maharashtra_resident: bool = True
    annual_family_income: Optional[float] = None
    caste_category: Optional[str] = None  # "GENERAL", "OBC", "SC", "ST", "VJNT", "EBC"
    occupation_type: Optional[str] = None
    education_level: Optional[str] = None
    is_pwd: bool = False
    disability_percentage: Optional[float] = None
    landholding_acres: Optional[float] = None
    beneficiary_categories: Optional[List[str]] = Field(default_factory=list)
    student_details: Optional[Dict[str, Any]] = None
    farmer_details: Optional[Dict[str, Any]] = None
    entrepreneur_details: Optional[Dict[str, Any]] = None
    vulnerable_details: Optional[Dict[str, Any]] = None
    onboarding_step: int = 1
    is_onboarding_completed: bool = False
    custom_attributes: Optional[Dict[str, Any]] = None

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    state_code: Optional[str] = None
    district_name: Optional[str] = None
    taluka: Optional[str] = None
    village_city: Optional[str] = None
    residency_area: Optional[str] = None
    is_maharashtra_resident: Optional[bool] = None
    annual_family_income: Optional[float] = None
    caste_category: Optional[str] = None
    occupation_type: Optional[str] = None
    education_level: Optional[str] = None
    is_pwd: Optional[bool] = None
    disability_percentage: Optional[float] = None
    landholding_acres: Optional[float] = None
    beneficiary_categories: Optional[List[str]] = None
    student_details: Optional[Dict[str, Any]] = None
    farmer_details: Optional[Dict[str, Any]] = None
    entrepreneur_details: Optional[Dict[str, Any]] = None
    vulnerable_details: Optional[Dict[str, Any]] = None
    onboarding_step: Optional[int] = None
    is_onboarding_completed: Optional[bool] = None
    custom_attributes: Optional[Dict[str, Any]] = None

class OnboardingStepRequest(BaseModel):
    step: int = Field(..., ge=1, le=6, description="Step number 1 to 6")
    data: Dict[str, Any] = Field(..., description="Data collected in this step")

class UserProfileResponse(UserProfileBase):
    id: str
    user_id: str
    email: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
