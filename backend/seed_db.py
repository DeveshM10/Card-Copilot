from database import SessionLocal, engine, Base
import models

def seed_database():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(models.User).first():
        print("Database already seeded.")
        return
        
    print("Seeding Users...")
    user1 = models.User(
        name="John Doe", 
        email="john@example.com",
        travel_frequency="Monthly",
        dining_frequency="Weekly",
        online_shopping_spend="15-30k",
        financial_goals="Travel Rewards"
    )
    db.add(user1)
    db.commit()
    db.refresh(user1)
    
    print("Seeding Cards...")
    infinia = models.Card(
        name="HDFC Infinia",
        bank="HDFC",
        network="VISA",
        base_reward_rate=3.3,
        annual_fee=12500.0
    )
    sbi = models.Card(
        name="SBI Cashback",
        bank="SBI",
        network="VISA",
        base_reward_rate=1.0,
        annual_fee=999.0
    )
    db.add_all([infinia, sbi])
    db.commit()
    db.refresh(infinia)
    db.refresh(sbi)
    
    print("Seeding Offers...")
    offers = [
        models.Offer(card_id=infinia.id, merchant="SmartBuy", category="Travel", reward_multiplier=16.5, is_absolute=True, description="5X Reward Points on SmartBuy Flights"),
        models.Offer(card_id=infinia.id, merchant="SmartBuy", category="Shopping", reward_multiplier=9.9, is_absolute=True, description="3X Reward Points on SmartBuy Shopping"),
        models.Offer(card_id=sbi.id, merchant="Any", category="Online", reward_multiplier=5.0, is_absolute=True, description="5% Cashback on all online spends"),
        models.Offer(card_id=sbi.id, merchant="Amazon", category="Shopping", reward_multiplier=5.0, is_absolute=True, description="5% Cashback on Amazon"),
        models.Offer(card_id=sbi.id, merchant="Swiggy", category="Dining", reward_multiplier=5.0, is_absolute=True, description="5% Cashback on Swiggy"),
    ]
    db.add_all(offers)
    
    print("Seeding User Wallet...")
    wallet = [
        models.UserCard(user_id=user1.id, card_id=infinia.id),
        models.UserCard(user_id=user1.id, card_id=sbi.id)
    ]
    db.add_all(wallet)
    
    db.commit()
    print("Database seeding complete!")

if __name__ == "__main__":
    seed_database()
