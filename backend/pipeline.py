import os
import hashlib
import requests
from bs4 import BeautifulSoup
from pydantic import BaseModel, Field
from typing import List, Optional
import datetime

from sqlalchemy.orm import Session
from database import SessionLocal
import models

from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

# Define the structured output schema for the LLM
class OfferExtracted(BaseModel):
    merchant: str = Field(description="The merchant name, e.g., 'Swiggy', 'Amazon', or 'Any'")
    category: str = Field(description="The category of the offer, e.g., 'Dining', 'Travel', 'Online'")
    reward_multiplier: float = Field(description="The reward multiplier or absolute percentage. E.g., 5.0 for 5% cashback.")
    is_absolute: bool = Field(description="True if the reward is an absolute percentage (e.g. 5%), False if it multiplies the base rate (e.g. 5x).")
    description: Optional[str] = Field(description="A brief description of the offer.")

class CardExtracted(BaseModel):
    name: str = Field(description="The name of the credit card")
    bank: str = Field(description="The issuing bank")
    network: str = Field(description="The card network (e.g., VISA, MasterCard)")
    base_reward_rate: float = Field(description="The base reward rate as a percentage. E.g., 1.0 for 1%.")
    annual_fee: float = Field(description="The annual fee for the card. 0.0 if lifetime free.")
    offers: List[OfferExtracted] = Field(description="List of specific merchant or category offers on the card.")
    confidence_score: float = Field(description="A self-assessed confidence score between 0.0 and 1.0 on how accurate this extracted data is based on the source text.")

def scrape_url(url: str) -> str:
    """Scrapes raw text from the given URL."""
    # We use a user-agent to avoid simple blocking
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    # Remove script and style elements
    for script in soup(["script", "style"]):
        script.extract()
        
    text = soup.get_text(separator=' ')
    # Clean up whitespace
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    text = '\n'.join(chunk for chunk in chunks if chunk)
    return text

def hash_content(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def extract_card_info(text: str) -> CardExtracted:
    """Uses LLM to extract structured card data from the scraped text."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set.")
    
    llm = ChatOpenAI(model="gpt-4o", api_key=api_key, temperature=0.0)
    structured_llm = llm.with_structured_output(CardExtracted)
    
    prompt = f"""
    You are an expert financial data extractor. I am providing you with raw text scraped from a bank or aggregator website.
    Your job is to extract the details of the credit card described in the text into a structured JSON format.
    
    Raw Text:
    {text[:15000]} # Limit text length to avoid token limits on very large pages
    """
    
    result = structured_llm.invoke(prompt)
    return result

def run_pipeline(url: str):
    """Orchestrates scraping, extracting, and DB insertion."""
    print(f"Starting pipeline for {url}...")
    
    # 1. Scrape & Normalize
    try:
        raw_text = scrape_url(url)
    except Exception as e:
        print(f"Failed to scrape {url}: {e}")
        return {"status": "error", "message": f"Failed to scrape: {e}"}
        
    content_hash = hash_content(raw_text)
    
    # 2. Extract
    print("Extracting via LLM...")
    try:
        extracted_data = extract_card_info(raw_text)
    except Exception as e:
        print(f"Extraction failed: {e}")
        return {"status": "error", "message": f"Extraction failed: {e}"}
        
    # 3. Validate & Branch
    is_high_confidence = extracted_data.confidence_score >= 0.85
    card_status = "published" if is_high_confidence else "pending_review"
    
    # 4. Save to DB
    print(f"Saving to DB with status: {card_status}")
    db: Session = SessionLocal()
    try:
        # Check if card already exists
        card = db.query(models.Card).filter(models.Card.name == extracted_data.name).first()
        if not card:
            card = models.Card(name=extracted_data.name)
            db.add(card)
        
        card.bank = extracted_data.bank
        card.network = extracted_data.network
        card.base_reward_rate = extracted_data.base_reward_rate
        card.annual_fee = extracted_data.annual_fee
        
        # KB tracking fields
        card.source_url = url
        card.content_hash = content_hash
        card.confidence_score = extracted_data.confidence_score
        card.status = card_status
        card.verified_date = datetime.datetime.utcnow()
        
        # We drop old offers for this card and add the newly extracted ones
        db.query(models.Offer).filter(models.Offer.card_id == card.id).delete()
        
        for off in extracted_data.offers:
            offer_model = models.Offer(
                merchant=off.merchant,
                category=off.category,
                reward_multiplier=off.reward_multiplier,
                is_absolute=off.is_absolute,
                description=off.description
            )
            card.offers.append(offer_model)
            
        db.commit()
        return {
            "status": "success",
            "card_name": card.name,
            "confidence": card.confidence_score,
            "kb_status": card.status
        }
    finally:
        db.close()
