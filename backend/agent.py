import os
from typing import Annotated, TypedDict, List
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from database import SessionLocal
import models

# Define the State
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    user_id: int

@tool
def get_user_wallet_info(user_id: int) -> str:
    """Retrieve the cards available in the user's wallet and their active offers."""
    db = SessionLocal()
    try:
        wallet = db.query(models.UserCard).filter(models.UserCard.user_id == user_id).all()
        if not wallet:
            return "User has no cards in their wallet."
        
        info = []
        for wc in wallet:
            card = wc.card
            card_info = f"- {card.name} ({card.network}) - Base Reward: {card.base_reward_rate}%"
            
            # Incorporate new fields
            if getattr(card, 'joining_fee', None):
                card_info += f" | Joining Fee: {card.joining_fee}"
            if getattr(card, 'eligibility_criteria', None):
                card_info += f" | Eligibility: {card.eligibility_criteria}"
                
            if card.source_url:
                card_info += f" [Source: {card.source_url} | Verified: {card.verified_date.strftime('%Y-%m-%d') if card.verified_date else 'N/A'}]"
            offers = db.query(models.Offer).filter(models.Offer.card_id == card.id).all()
            if offers:
                card_info += "\n  Active Offers:"
                for off in offers:
                    val_type = "% absolute" if off.is_absolute else "X multiplier"
                    card_info += f"\n    * {off.merchant} ({off.category}): {off.reward_multiplier}{val_type} - {off.description}"
            info.append(card_info)
        return "\n".join(info)
    finally:
        db.close()

from financial_reasoning_engine import FinancialReasoningEngine
import json

@tool
def evaluate_financial_decision(user_id: int, intent: str, merchant: str, amount: float) -> str:
    """Evaluate which card to use for a specific transaction using the core Financial Reasoning Engine."""
    db = SessionLocal()
    try:
        recommendation = FinancialReasoningEngine.evaluate(
            db=db,
            user_id=user_id,
            context={"intent": intent, "merchant": merchant, "amount": amount},
            objective="maximize_value"
        )
        bullets = "\n".join(recommendation.bullet_points)
        result = (
            f"Recommended Card: {recommendation.recommended_card_name}\n"
            f"Savings: INR {recommendation.estimated_savings}\n"
            f"Why:\n{bullets}\n\n"
            f"Why Not {recommendation.next_best_card_name}?\n{recommendation.why_not_explanation}"
        )
        return result
    except Exception as e:
        return f"Error evaluating decision: {str(e)}"
    finally:
        db.close()

from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize LLM
api_key = os.environ.get("OPENAI_API_KEY")
tools = [get_user_wallet_info, evaluate_financial_decision]

if api_key:
    llm = ChatOpenAI(model="gpt-4o", api_key=api_key)
    llm_with_tools = llm.bind_tools(tools)
else:
    llm_with_tools = None

def chatbot_node(state: AgentState):
    if not llm_with_tools:
        return {"messages": [AIMessage(content="I am currently in offline mode (No Gemini API Key found). Please add GEMINI_API_KEY to your backend environment to enable the AI Reasoning Engine.")]}
    
    # Inject a system prompt if it's the first message
    if len(state["messages"]) == 1:
        system_msg = SystemMessage(content="You are CardPilot AI, an expert financial decision-making agent. Your goal is to maximize the user's rewards and savings by selecting the best payment method from their wallet for any given transaction. Whenever a user asks for advice on which card to use for a purchase (e.g. 'I am booking a flight', 'buying groceries at Swiggy'), ALWAYS use the `evaluate_financial_decision` tool to get the mathematical optimal choice and explanation. You can also use `get_user_wallet_info` to view their general cards. Keep your final response concise and action-oriented.")
        state["messages"].insert(0, system_msg)
        
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}

from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.sqlite import SqliteSaver
import sqlite3

if llm_with_tools:
    tool_node = ToolNode(tools)

    graph_builder = StateGraph(AgentState)
    graph_builder.add_node("chatbot", chatbot_node)
    graph_builder.add_node("tools", tool_node)

    graph_builder.add_edge(START, "chatbot")
    graph_builder.add_conditional_edges("chatbot", tools_condition)
    graph_builder.add_edge("tools", "chatbot")

    conn = sqlite3.connect("checkpoints.db", check_same_thread=False)
    memory = SqliteSaver(conn)
    memory.setup()
    agent = graph_builder.compile(checkpointer=memory)
else:
    agent = None

def run_agent(user_id: int, query: str) -> str:
    if not agent:
        return "I am currently in offline mode (No OpenAI API Key found). Please add OPENAI_API_KEY to your backend environment to enable the AI Reasoning Engine. But based on typical rules, use SBI Cashback for online and HDFC Infinia for travel."
    
    state = {"messages": [HumanMessage(content=query)], "user_id": user_id}
    config = {"configurable": {"thread_id": str(user_id)}}
    result = agent.invoke(state, config=config)
    return result["messages"][-1].content
