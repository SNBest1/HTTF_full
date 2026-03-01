"""
call_tool — handles 'make_call' intent.

Extracts a phone number or contact name from entities and returns a tel: URI
action payload.
"""

from models.schemas import AgentResponse

# Stub contact book — in production this would query a contacts store
_CONTACT_BOOK: dict[str, str] = {
    "mom": "+15550001111",
    "dad": "+15550002222",
    "doctor": "+15550003333",
    "nurse": "+15550004444",
}


def handle(entities: dict, reply: str) -> AgentResponse:
    phone = entities.get("phone_number", "").strip()
    contact_name = entities.get("contact_name", "").strip().lower()

    if not phone and contact_name:
        phone = _CONTACT_BOOK.get(contact_name, "")

    tel_uri = f"tel:{phone}" if phone else "tel:"

    return AgentResponse(
        reply=reply,
        action_type="make_call",
        action_payload={
            "tel_uri": tel_uri,
            "contact_name": contact_name or "unknown",
            "phone_number": phone,
        },
    )
