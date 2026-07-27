import os
import time
import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from duckduckgo_search import DDGS
from langchain_openai import ChatOpenAI
from pipeline import scrape_url, hash_content
from database import SessionLocal
import models
from dotenv import load_dotenv

load_dotenv()

class OfferExtracted(BaseModel):
    merchant: str
    category: str
    reward_multiplier: float
    is_absolute: bool
    description: Optional[str]

class CardExtracted(BaseModel):
    name: str = Field(description="Name of the credit card")
    bank: str = Field(description="The issuing bank")
    network: str = Field(description="The card network (e.g., VISA, MasterCard, Amex)")
    base_reward_rate: float = Field(description="Base reward percentage")
    annual_fee: float = Field(description="Annual fee in INR")
    joining_fee: float = Field(description="Joining fee in INR")
    eligibility_criteria: str = Field(description="Minimum income, age, or credit score requirements, EXACTLY as stated in the source text. Empty string if not stated.")
    offers: List[OfferExtracted]
    confidence_score: float = Field(description="0.0-1.0 confidence that every field above is explicitly supported by the source text (not inferred or guessed).")

class CardsListExtracted(BaseModel):
    cards: List[CardExtracted]

def scrape_bank_url(bank_name: str, url: str):
    print(f"\n--- Processing {bank_name} ---")
    print(f"Scraping {url}...")
    
    try:
        text = scrape_url(url)
    except Exception as e:
        print(f"Failed to scrape {url}: {e}")
        return []
        
    if not text.strip():
        print("No text scraped. Skipping.")
        return []
        
    print("Extracting via GPT-4o...")
    llm = ChatOpenAI(model="gpt-4o", api_key=os.environ.get("OPENAI_API_KEY"), temperature=0.0)
    structured_llm = llm.with_structured_output(CardsListExtracted)
    
    prompt = f"""
    You are an expert financial data extractor. We are building a massive knowledge base of Indian Credit Cards.
    Based on the following scraped text from the web about {bank_name} credit cards, extract every single credit card mentioned into a structured JSON list.
    Ensure you include exact reward multipliers, annual fees, joining fees, and specifically the eligibility_criteria (e.g., "Min income ₹50,000/mo, Age 21-60").
    If the text doesn't explicitly state the eligibility criteria, you can use your internal knowledge to fill it in accurately for {bank_name} to ensure the database is comprehensive.
    
    Raw Scraped Text:
    {text[:40000]}
    """
    
    try:
        result = structured_llm.invoke(prompt)
        return result.cards
    except Exception as e:
        print(f"Extraction failed: {e}")
        return []

def scrape_aggregator(url: str):
    print(f"Scraping aggregator: {url}...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
    }
    try:
        import requests
        from bs4 import BeautifulSoup
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        for script in soup(["script", "style"]):
            script.extract()
        text = soup.get_text(separator=' ')
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        return '\n'.join(chunk for chunk in chunks if chunk)
    except Exception as e:
        print(f"Failed to scrape {url}: {e}")
        return ""

def run_massive_scrape():
    # We will scrape massive aggregator articles that list the top credit cards across all Indian banks.
    urls = [
        "https://www.forbes.com/advisor/in/credit-card/best-credit-cards-in-india/",
        "https://www.bankbazaar.com/credit-card.html"
    ]

    KNOWN_BANKS = [
        "HDFC Bank", "SBI Card", "ICICI Bank", "Axis Bank",
        "Kotak Mahindra Bank", "IndusInd Bank", "IDFC First Bank",
        "YES Bank", "Standard Chartered", "HSBC", "American Express", "RBL Bank"
    ]

    combined_text = ""
    for url in urls:
        text = scrape_aggregator(url)
        combined_text += f"\n\n--- Source: {url} ---\n{text[:50000]}"
        time.sleep(2)

    if not combined_text.strip():
        print("No text scraped from any source. Aborting.")
        return

    db = SessionLocal()
    try:
        print("\n--- Extracting every card mentioned (single pass) ---")
        llm = ChatOpenAI(model="gpt-4o", api_key=os.environ.get("OPENAI_API_KEY"), temperature=0.0)
        structured_llm = llm.with_structured_output(CardsListExtracted)

        prompt = f"""
        You are an expert financial data extractor. We are building a knowledge base of Indian Credit Cards
        from the following text scraped from Forbes Advisor and BankBazaar.

        Extract every credit card explicitly mentioned, across every bank ({", ".join(KNOWN_BANKS)} or any other
        issuer named in the text). For each card, extract only what the text actually states: name, issuing bank,
        network, base reward rate, annual fee, joining fee, eligibility criteria, and any merchant/category offers.

        Do NOT invent or guess any field from general knowledge. If a field (especially eligibility_criteria) is not
        explicitly stated in the text, leave it as an empty string (or 0 for numeric fields) and lower confidence_score
        accordingly. It is fine, and expected, for many cards to have incomplete fields and low confidence —
        under-population beats fabrication.

        Raw Scraped Text:
        {combined_text[:100000]}
        """

        try:
            result = structured_llm.invoke(prompt)
            extracted_cards = result.cards
        except Exception as e:
            print(f"Extraction failed: {e}")
            return

        print(f"Extracted {len(extracted_cards)} cards total")

        for card_data in extracted_cards:
            existing = db.query(models.Card).filter(models.Card.name == card_data.name).first()
            if existing:
                if existing.status == "published":
                    # Don't let a lower-confidence scrape clobber an already-verified card.
                    print(f"Skipping '{card_data.name}': already published, keeping existing verified data.")
                    continue
                db.query(models.Offer).filter(models.Offer.card_id == existing.id).delete()
                db.query(models.UserCard).filter(models.UserCard.card_id == existing.id).delete()
                db.delete(existing)
                db.commit()

            card = models.Card(
                name=card_data.name,
                bank=card_data.bank,
                network=card_data.network,
                base_reward_rate=card_data.base_reward_rate,
                annual_fee=card_data.annual_fee,
                joining_fee=card_data.joining_fee,
                eligibility_criteria=card_data.eligibility_criteria,
                source_url="Web Scraped: Forbes Advisor India + BankBazaar",
                content_hash=hash_content(combined_text),
                confidence_score=card_data.confidence_score,
                status="published" if card_data.confidence_score >= 0.85 else "pending_review",
                verified_date=datetime.datetime.utcnow()
            )
            db.add(card)
            db.flush()

            for off in card_data.offers:
                offer = models.Offer(
                    card_id=card.id,
                    merchant=off.merchant,
                    category=off.category,
                    reward_multiplier=off.reward_multiplier,
                    is_absolute=off.is_absolute,
                    description=off.description
                )
                db.add(offer)

        db.commit()
        print("Massive Knowledge Base Scrape Complete!")

    finally:
        db.close()

if __name__ == "__main__":
    run_massive_scrape()
