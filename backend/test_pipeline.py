from pipeline import extract_card_info, hash_content
from database import SessionLocal
import models
import datetime

if __name__ == "__main__":
    mock_text = """
    Introducing the new Apex Rewards Visa Card by Global Bank.
    Earn a base reward of 1.5% cashback on all your daily purchases.
    Special Offers:
    - Earn 5% cashback on Dining.
    - Earn 3x points on Travel bookings through our portal.
    
    The card has a low annual fee of $95. Apply today!
    """
    
    print("Testing extraction via LLM...")
    try:
        extracted = extract_card_info(mock_text)
        print("Extracted Data:", extracted.model_dump())
        
        print("Saving to DB...")
        db = SessionLocal()
        card = models.Card(
            name=extracted.name,
            bank=extracted.bank,
            network=extracted.network,
            base_reward_rate=extracted.base_reward_rate,
            annual_fee=extracted.annual_fee,
            source_url="https://example.com/apex-rewards",
            content_hash=hash_content(mock_text),
            confidence_score=extracted.confidence_score,
            status="published" if extracted.confidence_score >= 0.85 else "pending_review",
            verified_date=datetime.datetime.utcnow()
        )
        db.add(card)
        for off in extracted.offers:
            card.offers.append(models.Offer(
                merchant=off.merchant,
                category=off.category,
                reward_multiplier=off.reward_multiplier,
                is_absolute=off.is_absolute,
                description=off.description
            ))
        db.commit()
        print("Success! Card saved to database.")
    except Exception as e:
        print(f"Error: {e}")
