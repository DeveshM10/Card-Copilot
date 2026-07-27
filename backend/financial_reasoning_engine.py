import os
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from dotenv import load_dotenv

import models

load_dotenv()

class EngineRecommendation(BaseModel):
    recommended_card_id: int = Field(description="The database ID of the recommended card")
    recommended_card_name: str = Field(description="The name of the recommended card")
    explanation: str = Field(description="A 1-sentence natural language summary.")
    bullet_points: List[str] = Field(description="3-4 punchy bullet points detailing EXACTLY why this card is mathematically optimal (e.g. '✓ 5X Travel Points', '✓ ₹4,200 away from milestone', '✓ Lounge included').")
    estimated_savings: float = Field(description="The estimated monetary savings or value in INR for this transaction.")
    next_best_card_id: int = Field(description="The database ID of the second best card in the user's wallet. Used for the 'Why Not' feature.")
    next_best_card_name: str = Field(description="The name of the second best card.")
    why_not_explanation: str = Field(description="A brief explanation of why the next best card was rejected in favor of the recommended one (e.g. 'Because Axis has a higher reward value for this category.').")

class FinancialReasoningEngine:
    
    @staticmethod
    def evaluate(db: Session, user_id: int, context: Dict[str, Any], objective: str = "maximize_value") -> EngineRecommendation:
        """
        The core brain of CardPilot.
        Evaluates the best financial decision based on User Persona, Wallet, and Active Offers.
        """
        # 1. Retrieve User Persona
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")
            
        persona_str = (
            f"Travel Frequency: {user.travel_frequency or 'Unknown'}, "
            f"Dining Frequency: {user.dining_frequency or 'Unknown'}, "
            f"Primary Goal: {user.financial_goals or 'Unknown'}"
        )
        
        # 2. Retrieve User Wallet
        user_cards = db.query(models.UserCard).filter(models.UserCard.user_id == user_id).all()
        if not user_cards:
            raise ValueError(f"User {user_id} has no cards in wallet")
            
        wallet_context = []
        card_ids = []
        for uc in user_cards:
            card = uc.card
            card_ids.append(card.id)
            offers = db.query(models.Offer).filter(models.Offer.card_id == card.id).all()
            offer_strs = [f"{o.merchant} ({o.category}): {o.reward_multiplier}{'%' if o.is_absolute else 'x'} - {o.description}" for o in offers]
            
            wallet_context.append(
                f"Card ID {card.id}: {card.name} | Network: {card.network} | "
                f"Base Reward: {card.base_reward_rate}% | "
                f"Active Offers: {', '.join(offer_strs) if offer_strs else 'None'}"
            )
            
        # 3. LLM Reasoning & Ranking
        llm = ChatOpenAI(model="gpt-4o", api_key=os.environ.get("OPENAI_API_KEY"), temperature=0.0)
        structured_llm = llm.with_structured_output(EngineRecommendation)
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are the Financial Decision Engine for CardPilot AI. 
            Your objective is to evaluate a transaction context against a user's specific wallet and persona, 
            and determine the mathematically optimal credit card to use."""),
            ("user", """
            Transaction Context:
            Intent: {intent}
            Merchant: {merchant}
            Amount: INR {amount}
            
            User Persona:
            {persona}
            
            User Wallet & Offers:
            {wallet}
            
            Based on the objective to '{objective}', evaluate the cards in the wallet.
            
            1. Identify the mathematically optimal card. Calculate the exact estimated savings (incorporating base reward rate and any specific merchant/category offers).
            2. Provide 3-4 punchy bullet points (using ✓) explaining EXACTLY why this card is optimal (e.g. '✓ 5X Travel Points', '✓ You are close to a milestone').
            3. Identify the second best card (Next Best Card) in their wallet.
            4. Provide a punchy "Why Not?" explanation of why the second best card was rejected in favor of the optimal one.
            """)
        ])
        
        # Invoke the chain
        chain = prompt | structured_llm
        result = chain.invoke({
            "intent": context.get("intent", "General spend"),
            "merchant": context.get("merchant", "Unknown"),
            "amount": context.get("amount", 0),
            "persona": persona_str,
            "wallet": "\n".join(wallet_context),
            "objective": objective
        })
        
        return result

class ScenarioSimulation(BaseModel):
    category: str
    amount: float
    best_card_id: int
    best_card_name: str
    base_points_earned: float
    bonus_points_earned: float
    total_savings_inr: float
    milestone_impact: str
    annual_fee_impact: str
    explanation: str

class ScenarioSimulator:
    
    @staticmethod
    def simulate(db: Session, user_id: int, category: str, amount: float) -> ScenarioSimulation:
        """
        Simulates the effect of a large purchase across the user's wallet.
        Calculates base points, bonus points, milestone proximity, and annual fee waivers.
        """
        user_cards = db.query(models.UserCard).filter(models.UserCard.user_id == user_id).all()
        if not user_cards:
            raise ValueError(f"User {user_id} has no cards in wallet")
            
        wallet_context = []
        for uc in user_cards:
            card = uc.card
            offers = db.query(models.Offer).filter(models.Offer.card_id == card.id).all()
            offer_strs = [f"{o.merchant} ({o.category}): {o.reward_multiplier}{'%' if o.is_absolute else 'x'}" for o in offers]
            
            wallet_context.append(
                f"Card ID {card.id}: {card.name} | Base Reward: {card.base_reward_rate}% | "
                f"Annual Fee: {card.annual_fee} | Active Offers: {', '.join(offer_strs) if offer_strs else 'None'}"
            )
            
        llm = ChatOpenAI(model="gpt-4o", api_key=os.environ.get("OPENAI_API_KEY"), temperature=0.0)
        structured_llm = llm.with_structured_output(ScenarioSimulation)
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are the Scenario Simulator for CardPilot AI. 
            The user wants to know 'What if I spend X amount on Y category?'.
            Analyze their wallet and predict the exact mathematical outcome if they use the most optimal card."""),
            ("user", """
            Simulated Purchase:
            Category: {category}
            Amount: INR {amount}
            
            User Wallet:
            {wallet}
            
            Calculate the optimal card to use.
            Return the base points earned, bonus points earned (if any offers apply), and total savings in INR.
            Crucially, provide a 'milestone_impact' (e.g. 'This gets you 80% of the way to the 10,000 point bonus') and an 'annual_fee_impact' (e.g. 'This purchase waives your next annual fee'). Use reasonable assumptions for typical milestone thresholds if exact data is missing.
            Provide a short explanation.
            """)
        ])
        
        chain = prompt | structured_llm
        result = chain.invoke({
            "category": category,
            "amount": amount,
            "wallet": "\n".join(wallet_context)
        })
        
        return result

class FeedItem(BaseModel):
    type: str = Field(description="One of: 'savings', 'alert', 'milestone', 'gamification', 'tip'")
    title: str = Field(description="A punchy title for the feed item.")
    description: str = Field(description="The body text of the feed item.")
    time: str = Field(description="A relative time string like 'Just now', 'Today', '2 hours ago'.")
    badge: str = Field(default="", description="Optional gamification badge name if type is 'gamification' or 'savings'.")
    action: str = Field(default="", description="Optional call to action button text like 'Remind Me', 'Apply Now'.")
    color_theme: str = Field(description="Tailwind color prefix (e.g. 'emerald', 'blue', 'yellow', 'purple', 'rose') matching the type.")

class FeedGeneration(BaseModel):
    items: List[FeedItem] = Field(description="A list of 3-5 dynamic feed items based on the user's wallet.")

class FeedGenerator:
    
    @staticmethod
    def generate_feed(db: Session, user_id: int) -> FeedGeneration:
        """
        Dynamically generates the Activity Feed using LLM based on the user's exact wallet.
        """
        user_cards = db.query(models.UserCard).filter(models.UserCard.user_id == user_id).all()
        if not user_cards:
            # Default empty state
            return FeedGeneration(items=[
                FeedItem(
                    type="tip",
                    title="Welcome to CardPilot AI",
                    description="Add cards to your wallet to start seeing personalized savings alerts.",
                    time="Just now",
                    color_theme="blue"
                )
            ])
            
        wallet_context = []
        for uc in user_cards:
            card = uc.card
            wallet_context.append(f"{card.name} ({card.bank} {card.network})")
            
        llm = ChatOpenAI(model="gpt-4o", api_key=os.environ.get("OPENAI_API_KEY"), temperature=0.7)
        structured_llm = llm.with_structured_output(FeedGeneration)
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are the Activity Feed Generator for CardPilot AI. 
            Your job is to generate a highly personalized, dynamic, social-media style feed of financial insights 
            based ONLY on the cards the user actually has in their wallet.
            
            Feed Item Types:
            - 'savings': A recent theoretical transaction where they saved money.
            - 'alert': An upcoming sale or context where a specific card should be used.
            - 'milestone': Proximity to a reward point or annual fee waiver milestone.
            - 'gamification': Unlocking a fun badge (e.g., 'Lounge Lizard', 'Cashback King').
            - 'tip': A suggestion to optimize their wallet.
            
            Color Themes: emerald, blue, yellow, purple, rose.
            """),
            ("user", """
            User Wallet:
            {wallet}
            
            Generate 4 highly realistic and specific feed items for this user.
            Ensure the insights reference the exact card names provided in the wallet.
            Make it sound like a premium AI Copilot.
            """)
        ])
        
        chain = prompt | structured_llm
        result = chain.invoke({
            "wallet": ", ".join(wallet_context)
        })
        
        return result
