import datetime
from database import SessionLocal
import models

# Real, sourced data on modern Indian fintech/neobank-branded credit cards.
# Indian RBI rules require a licensed bank/NBFC to actually issue the card, so the
# "bank" field is the issuing entity, not the consumer-facing fintech brand.
#
# Deliberately excluded:
# - Fi Money (SimpliFi/AmpliFi/MagniFi): Federal Bank discontinued the entire
#   co-branded program effective 2026-03-20. Not offered to new applicants.
# - Stripe: only issues the Stripe Corporate Card (a business expense card tied to
#   a Stripe payments account) — not a consumer product, would misrepresent it.
# - LazyPay, Niyo: no confirmed standalone consumer credit card product (BNPL /
#   forex-prepaid respectively).

CARDS_DATA = [
    {
        "name": "Uni GoldX Credit Card",
        "bank": "YES Bank (Uni Cards)",
        "network": "Mastercard",
        "base_reward_rate": 1.0,
        "annual_fee": 0,
        "eligibility_criteria": "",
        "status": "published",
        "confidence_score": 0.85,
        "offers": [
            {"merchant": "Uni Store", "category": "Shopping", "reward_multiplier": 5.0, "is_absolute": False,
             "description": "Up to 5X reward rate, paid out as 24K digital gold, on purchases via the Uni Store"},
        ],
    },
    {
        "name": "OneCard",
        "bank": "Federal Bank",
        "network": "Visa Signature",
        "base_reward_rate": 1.0,
        "annual_fee": 0,
        "eligibility_criteria": "",
        "status": "published",
        "confidence_score": 0.8,
        "offers": [
            {"merchant": "Top 2 Categories", "category": "Shopping", "reward_multiplier": 5.0, "is_absolute": False,
             "description": "5X points on your top 2 spend categories when your spend spans 3+ categories in a month (points-based; indicative redemption value, not a flat cashback %)"},
        ],
    },
    {
        "name": "Jupiter Edge+ RuPay Credit Card",
        "bank": "CSB Bank (Jupiter Money)",
        "network": "RuPay",
        "base_reward_rate": 0.4,
        "annual_fee": 0,
        "eligibility_criteria": "",
        "status": "published",
        "confidence_score": 0.85,
        "offers": [
            {"merchant": "Any", "category": "Shopping", "reward_multiplier": 2.0, "is_absolute": True,
             "description": "2% cashback on one self-selected category (shopping, travel, or dining) — pick one at card activation"},
            {"merchant": "Swiggy, Amazon, Zomato, Flipkart", "category": "Online", "reward_multiplier": 0.0, "is_absolute": True,
             "description": "Rs. 250 welcome voucher on first spend at select partner merchants"},
        ],
    },
    {
        "name": "Slice Super Card",
        "bank": "Slice Small Finance Bank",
        "network": "Visa",
        "base_reward_rate": 1.0,
        "annual_fee": 0,
        "eligibility_criteria": "",
        "status": "pending_review",
        "confidence_score": 0.65,
        "offers": [
            {"merchant": "Any", "category": "Shopping", "reward_multiplier": 3.0, "is_absolute": True,
             "description": "Up to 3% cashback (\"Monies\") — exact tiering by category not fully confirmed as of this writing, recently restructured mid-2025"},
        ],
    },
    {
        "name": "Kiwi RuPay Credit Card",
        "bank": "Axis Bank",
        "network": "RuPay (UPI-linked, virtual card)",
        "base_reward_rate": 1.5,
        "annual_fee": 0,
        "eligibility_criteria": "",
        "status": "published",
        "confidence_score": 0.75,
        "offers": [
            {"merchant": "Any", "category": "Online", "reward_multiplier": 1.5, "is_absolute": True,
             "description": "~1.5% cashback on UPI Scan & Pay transactions (free tier; a paid membership tier with higher cashback also exists but its exact terms are less consistently reported)"},
        ],
    },
    {
        "name": "Freo Credit Card",
        "bank": "YES Bank",
        "network": "Visa",
        "base_reward_rate": 1.0,
        "annual_fee": 399,
        "eligibility_criteria": "Annual fee waived from year 2 if annual spend crosses Rs. 1,00,000. A RuPay variant with lifetime-free fees also exists.",
        "status": "pending_review",
        "confidence_score": 0.65,
        "offers": [],
    },
]


def seed_neobank_cards():
    db = SessionLocal()
    try:
        for card_data in CARDS_DATA:
            existing = db.query(models.Card).filter(models.Card.name == card_data["name"]).first()
            if existing:
                if existing.status == "published":
                    print(f"Skipping '{card_data['name']}': already published.")
                    continue
                db.query(models.Offer).filter(models.Offer.card_id == existing.id).delete()
                db.query(models.UserCard).filter(models.UserCard.card_id == existing.id).delete()
                db.delete(existing)
                db.commit()

            card = models.Card(
                name=card_data["name"],
                bank=card_data["bank"],
                network=card_data["network"],
                base_reward_rate=card_data["base_reward_rate"],
                annual_fee=card_data["annual_fee"],
                eligibility_criteria=card_data["eligibility_criteria"],
                source_url="Manually curated from issuer KFS/press releases (see seed_neobank_cards.py)",
                content_hash="manual_neobank_seed",
                confidence_score=card_data["confidence_score"],
                status=card_data["status"],
                verified_date=datetime.datetime.now(datetime.timezone.utc),
            )
            db.add(card)
            db.flush()

            for off in card_data["offers"]:
                db.add(models.Offer(
                    card_id=card.id,
                    merchant=off["merchant"],
                    category=off["category"],
                    reward_multiplier=off["reward_multiplier"],
                    is_absolute=off["is_absolute"],
                    description=off["description"],
                ))

        db.commit()
        print("Successfully seeded neobank/fintech credit cards!")
    except Exception as e:
        print(f"Error seeding DB: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_neobank_cards()
