from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class OfferBase(BaseModel):
    merchant: str
    category: str
    reward_multiplier: float
    is_absolute: bool = True
    description: Optional[str] = None

class Offer(OfferBase):
    id: int
    card_id: int

    class Config:
        from_attributes = True

class CardBase(BaseModel):
    name: str
    bank: str
    network: str
    base_reward_rate: float
    annual_fee: float = 0.0
    joining_fee: float = 0.0
    eligibility_criteria: Optional[str] = None
    source_url: Optional[str] = None
    confidence_score: Optional[float] = None
    status: Optional[str] = "published"
    verified_date: Optional[datetime] = None

class Card(CardBase):
    id: int
    offers: List[Offer] = []

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    name: str
    email: str
    age_group: Optional[str] = None
    income_range: Optional[str] = None
    travel_frequency: Optional[str] = None
    dining_frequency: Optional[str] = None
    online_shopping_spend: Optional[str] = None
    high_freq_categories: Optional[str] = None
    financial_goals: Optional[str] = None
    risk_attitude: Optional[str] = None
    investment_goals: Optional[str] = None
    has_external_income: Optional[str] = None
    external_income_sources: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserPersonaUpdate(BaseModel):
    age_group: Optional[str] = None
    income_range: Optional[str] = None
    travel_frequency: Optional[str] = None
    dining_frequency: Optional[str] = None
    online_shopping_spend: Optional[str] = None
    high_freq_categories: Optional[str] = None
    financial_goals: Optional[str] = None
    risk_attitude: Optional[str] = None
    investment_goals: Optional[str] = None
    has_external_income: Optional[str] = None
    external_income_sources: Optional[str] = None

class User(UserBase):
    id: int
    
    class Config:
        from_attributes = True

class UserCardBase(BaseModel):
    card_id: int

class UserCard(UserCardBase):
    id: int
    user_id: int
    card: Card

    class Config:
        from_attributes = True
