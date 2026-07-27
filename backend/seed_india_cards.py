import datetime
from database import SessionLocal
import models

def seed_india_cards():
    db = SessionLocal()
    
    cards_data = [
        # HDFC Bank
        {
            "name": "HDFC Infinia Metal Edition",
            "bank": "HDFC Bank",
            "network": "VISA",
            "base_reward_rate": 3.33,
            "annual_fee": 12500,
            "offers": [
                {"merchant": "SmartBuy", "category": "Travel", "reward_multiplier": 16.65, "is_absolute": True, "description": "5X Reward Points on travel and hotel bookings via SmartBuy"},
                {"merchant": "Any", "category": "Dining", "reward_multiplier": 6.66, "is_absolute": True, "description": "2X Reward Points on dining"}
            ]
        },
        {
            "name": "HDFC Diners Club Black",
            "bank": "HDFC Bank",
            "network": "Diners Club",
            "base_reward_rate": 3.33,
            "annual_fee": 10000,
            "offers": [
                {"merchant": "SmartBuy", "category": "Travel", "reward_multiplier": 33.3, "is_absolute": True, "description": "10X Reward Points on SmartBuy flights & hotels"},
                {"merchant": "Swiggy", "category": "Dining", "reward_multiplier": 33.3, "is_absolute": True, "description": "10X Reward Points via SmartBuy"}
            ]
        },
        {
            "name": "HDFC Millennia",
            "bank": "HDFC Bank",
            "network": "VISA",
            "base_reward_rate": 1.0,
            "annual_fee": 1000,
            "offers": [
                {"merchant": "Amazon", "category": "Online", "reward_multiplier": 5.0, "is_absolute": True, "description": "5% Cashback on Amazon, Flipkart, Myntra, Swiggy, Zomato"},
                {"merchant": "Any", "category": "Online", "reward_multiplier": 1.0, "is_absolute": True, "description": "1% Cashback on all other online spends"}
            ]
        },
        
        # SBI Card
        {
            "name": "SBI Cashback Credit Card",
            "bank": "SBI Card",
            "network": "VISA",
            "base_reward_rate": 1.0,
            "annual_fee": 999,
            "offers": [
                {"merchant": "Any", "category": "Online", "reward_multiplier": 5.0, "is_absolute": True, "description": "5% Cashback on all online spends (capped at Rs. 5000/month)"}
            ]
        },
        {
            "name": "SBI SimplyCLICK",
            "bank": "SBI Card",
            "network": "VISA",
            "base_reward_rate": 0.25, # 1 point per 100
            "annual_fee": 499,
            "offers": [
                {"merchant": "Amazon", "category": "Online", "reward_multiplier": 2.5, "is_absolute": True, "description": "10X Reward Points on exclusive partners like Amazon, BookMyShow, Cleartrip"},
                {"merchant": "Any", "category": "Online", "reward_multiplier": 1.25, "is_absolute": True, "description": "5X Reward Points on all other online spends"}
            ]
        },
        
        # ICICI Bank
        {
            "name": "Amazon Pay ICICI Credit Card",
            "bank": "ICICI Bank",
            "network": "VISA",
            "base_reward_rate": 1.0,
            "annual_fee": 0,
            "offers": [
                {"merchant": "Amazon", "category": "Online", "reward_multiplier": 5.0, "is_absolute": True, "description": "5% Cashback on Amazon for Prime customers"},
                {"merchant": "Amazon Pay", "category": "Utilities", "reward_multiplier": 2.0, "is_absolute": True, "description": "2% Cashback on flight/recharge/bill payments via Amazon Pay"}
            ]
        },
        
        # Axis Bank
        {
            "name": "Axis Bank Magnus",
            "bank": "Axis Bank",
            "network": "VISA",
            "base_reward_rate": 1.2, # 12 EDGE points per 200
            "annual_fee": 12500,
            "offers": [
                {"merchant": "Travel Edge", "category": "Travel", "reward_multiplier": 6.0, "is_absolute": True, "description": "5X EDGE Reward Points on Travel Edge"}
            ]
        },
        {
            "name": "Axis Bank Ace",
            "bank": "Axis Bank",
            "network": "VISA",
            "base_reward_rate": 2.0,
            "annual_fee": 499,
            "offers": [
                {"merchant": "Google Pay", "category": "Utilities", "reward_multiplier": 5.0, "is_absolute": True, "description": "5% Cashback on Bill Payments/Recharges via Google Pay"},
                {"merchant": "Swiggy", "category": "Dining", "reward_multiplier": 4.0, "is_absolute": True, "description": "4% Cashback on Swiggy, Zomato, Ola"}
            ]
        },
        {
            "name": "Flipkart Axis Bank Credit Card",
            "bank": "Axis Bank",
            "network": "VISA",
            "base_reward_rate": 1.5,
            "annual_fee": 500,
            "offers": [
                {"merchant": "Flipkart", "category": "Online", "reward_multiplier": 5.0, "is_absolute": True, "description": "5% Cashback on Flipkart"},
                {"merchant": "Myntra", "category": "Online", "reward_multiplier": 5.0, "is_absolute": True, "description": "5% Cashback on Myntra"},
                {"merchant": "Swiggy", "category": "Dining", "reward_multiplier": 4.0, "is_absolute": True, "description": "4% Cashback on preferred partners like Swiggy, Uber, PVR"}
            ]
        }
    ]

    try:
        for card_data in cards_data:
            # Check if exists
            existing = db.query(models.Card).filter(models.Card.name == card_data["name"]).first()
            if existing:
                db.delete(existing)
                db.commit()
            
            card = models.Card(
                name=card_data["name"],
                bank=card_data["bank"],
                network=card_data["network"],
                base_reward_rate=card_data["base_reward_rate"],
                annual_fee=card_data["annual_fee"],
                source_url=f"https://www.{card_data['bank'].replace(' ', '').lower()}.com",
                content_hash="static_seed_hash",
                confidence_score=1.0,
                status="published",
                verified_date=datetime.datetime.utcnow()
            )
            db.add(card)
            db.flush() # Get card ID
            
            for offer_data in card_data["offers"]:
                offer = models.Offer(
                    card_id=card.id,
                    merchant=offer_data["merchant"],
                    category=offer_data["category"],
                    reward_multiplier=offer_data["reward_multiplier"],
                    is_absolute=offer_data["is_absolute"],
                    description=offer_data["description"]
                )
                db.add(offer)
        
        db.commit()
        
        # Add a diverse wallet for User 1
        user = db.query(models.User).first()
        if user:
            # Clear existing wallet
            db.query(models.UserCard).filter(models.UserCard.user_id == user.id).delete()
            db.commit()
            
            cards = db.query(models.Card).all()
            for c in cards:
                if c.name in ["HDFC Infinia Metal Edition", "Amazon Pay ICICI Credit Card", "Axis Bank Ace", "SBI Cashback Credit Card"]:
                    db.add(models.UserCard(user_id=user.id, card_id=c.id))
            db.commit()
            
        print("Successfully seeded comprehensive Indian credit cards!")
    except Exception as e:
        print(f"Error seeding DB: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_india_cards()
