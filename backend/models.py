from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    
    # Financial Persona Profile
    age_group = Column(String, default="")
    income_range = Column(String, default="")
    travel_frequency = Column(String, default="")
    dining_frequency = Column(String, default="")
    online_shopping_spend = Column(String, default="")
    high_freq_categories = Column(String, default="") # Comma-separated
    financial_goals = Column(String, default="")
    risk_attitude = Column(String, default="")
    investment_goals = Column(String, default="")
    has_external_income = Column(String, default="")
    external_income_sources = Column(String, default="") # Comma-separated
    
    cards = relationship("UserCard", back_populates="user")

class Card(Base):
    __tablename__ = "cards"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    bank = Column(String)
    network = Column(String) # VISA, MasterCard, etc.
    base_reward_rate = Column(Float) # Base percentage, e.g. 1.0 for 1%
    annual_fee = Column(Float, default=0.0)
    joining_fee = Column(Float, default=0.0)
    eligibility_criteria = Column(String, nullable=True)
    
    # Knowledge Base Metadata
    source_url = Column(String, nullable=True)
    content_hash = Column(String, nullable=True)
    confidence_score = Column(Float, nullable=True) # e.g. 0.0 to 1.0
    status = Column(String, default="published") # 'published' or 'pending_review'
    verified_date = Column(DateTime, default=datetime.datetime.utcnow)
    
    offers = relationship("Offer", back_populates="card")

class UserCard(Base):
    __tablename__ = "user_cards"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    card_id = Column(Integer, ForeignKey("cards.id"))
    
    user = relationship("User", back_populates="cards")
    card = relationship("Card")

class Offer(Base):
    __tablename__ = "offers"
    
    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("cards.id"))
    merchant = Column(String, index=True) # e.g. 'Swiggy', 'Amazon', 'Any'
    category = Column(String, index=True) # e.g. 'Dining', 'Travel', 'Online'
    reward_multiplier = Column(Float) # Multiplier on base rate, or absolute rate
    is_absolute = Column(Boolean, default=True) # If True, reward_multiplier is the absolute % (e.g. 5%). If False, it multiplies base.
    description = Column(String)
    
    card = relationship("Card", back_populates="offers")
