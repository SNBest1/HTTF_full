"""
POST /agent — intent classification and tool dispatch.

Classifies the user message using phi3, dispatches to the appropriate tool
handler, and returns a structured AgentResponse.
"""

from fastapi import APIRouter, HTTPException

from models.schemas import AgentRequest, AgentResponse
from services.agent_service import IntentClassifier
from services.tools import call_tool, food_tool, reminder_tool

router = APIRouter()

_classifier = IntentClassifier()


@router.post("/agent", response_model=AgentResponse)
async def agent_endpoint(req: AgentRequest) -> AgentResponse:
    try:
        classification = await _classifier.classify(req.message)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Ollama unavailable: {exc}. Ensure 'ollama serve' is running.",
        )

    intent: str = classification["intent"]
    entities: dict = classification["entities"]

    reply = await _classifier.generate_reply(req.message, intent)

    if intent == "make_call":
        return call_tool.handle(entities=entities, reply=reply)
    elif intent == "order_food":
        return food_tool.handle(entities=entities, reply=reply)
    elif intent == "set_reminder":
        return reminder_tool.handle(entities=entities, reply=reply)
    else:
        return AgentResponse(
            reply=reply,
            action_type="general_chat",
            action_payload={},
        )
