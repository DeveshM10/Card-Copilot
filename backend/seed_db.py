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
    print("Base user created. Run seed_india_cards.py / seed_neobank_cards.py for the actual card catalog.")

if __name__ == "__main__":
    seed_database()
