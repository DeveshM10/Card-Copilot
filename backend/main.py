from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

import models, schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CardPilot AI API",
    description="Backend API for the CardPilot AI Financial Agent",
    version="0.1.0",
)

# Configure CORS. The app has no cookie-based auth (no credentials are sent),
# so a permissive origin list is safe here and avoids needing to know the
# deployed frontend's exact domain in advance.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "CardPilot AI Backend is running."}

@app.get("/api/users/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/api/users/{user_id}", response_model=schemas.User)
def update_user_persona(user_id: int, request: schemas.UserPersonaUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        user = models.User(id=user_id, name="Guest User", email=f"guest{user_id}@cardpilot.local")
        db.add(user)
        db.flush()
    for field, value in request.dict(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user

@app.get("/api/users/{user_id}/wallet", response_model=List[schemas.UserCard])
def get_user_wallet(user_id: int, db: Session = Depends(get_db)):
    wallet = db.query(models.UserCard).filter(models.UserCard.user_id == user_id).all()
    return wallet

class WalletUpdateRequest(BaseModel):
    card_ids: List[int]

@app.post("/api/users/{user_id}/wallet")
def update_user_wallet(user_id: int, request: WalletUpdateRequest, db: Session = Depends(get_db)):
    db.query(models.UserCard).filter(models.UserCard.user_id == user_id).delete()
    for card_id in request.card_ids:
        new_wallet_card = models.UserCard(user_id=user_id, card_id=card_id)
        db.add(new_wallet_card)
    db.commit()
    return {"status": "success", "message": "Wallet updated"}

class CustomCardRequest(BaseModel):
    name: str

@app.post("/api/cards/custom", response_model=schemas.Card)
def create_custom_card(request: CustomCardRequest, db: Session = Depends(get_db)):
    # Create a pending card
    new_card = models.Card(
        name=request.name,
        bank=request.name.split(" ")[0] if " " in request.name else "Unknown",
        network="Unknown",
        base_reward_rate=1.0,
        status="pending_review"
    )
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return new_card

from sqlalchemy.orm import joinedload

@app.get("/api/cards", response_model=List[schemas.Card])
def get_cards(skip: int = 0, limit: int = 100, include_pending: bool = False, db: Session = Depends(get_db)):
    query = db.query(models.Card).options(joinedload(models.Card.offers))
    if not include_pending:
        query = query.filter(models.Card.status == "published")
    cards = query.offset(skip).limit(limit).all()
    return cards

@app.get("/api/cards/{card_id}", response_model=schemas.Card)
def get_card(card_id: int, db: Session = Depends(get_db)):
    card = db.query(models.Card).filter(models.Card.id == card_id).first()
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    return card

@app.get("/api/offers", response_model=List[schemas.Offer])
def get_offers(merchant: str = None, category: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Offer)
    if merchant:
        query = query.filter(models.Offer.merchant.ilike(f"%{merchant}%"))
    if category:
        query = query.filter(models.Offer.category.ilike(f"%{category}%"))
    return query.all()

class PipelineRequest(BaseModel):
    url: str

@app.post("/api/pipeline/run")
def trigger_pipeline(request: PipelineRequest):
    # Import locally to avoid circular dependencies
    from pipeline import run_pipeline
    result = run_pipeline(request.url)
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("message"))
    return result

@app.get("/api/admin/review", response_model=List[schemas.Card])
def get_pending_reviews(db: Session = Depends(get_db)):
    cards = db.query(models.Card).filter(models.Card.status == "pending_review").all()
    return cards

class ChatRequest(BaseModel):
    user_id: int
    query: str

@app.post("/api/chat")
def chat_with_agent(request: ChatRequest):
    from agent import run_agent
    response = run_agent(request.user_id, request.query)
    return {"response": response}

class SimulateRequest(BaseModel):
    user_id: int
    category: str
    amount: float

@app.post("/api/simulate")
def simulate_scenario(request: SimulateRequest, db: Session = Depends(get_db)):
    from financial_reasoning_engine import ScenarioSimulator
    try:
        simulation = ScenarioSimulator.simulate(
            db=db, 
            user_id=request.user_id, 
            category=request.category, 
            amount=request.amount
        )
        return simulation.dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{user_id}/feed")
def get_user_feed(user_id: int, db: Session = Depends(get_db)):
    from financial_reasoning_engine import FeedGenerator
    try:
        feed = FeedGenerator.generate_feed(db=db, user_id=user_id)
        return feed.dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import os
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
