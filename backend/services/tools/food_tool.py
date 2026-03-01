"""
food_tool — handles 'order_food' intent.

Matches requested items against a static menu and returns a simulated order summary.
"""

from models.schemas import AgentResponse

_MENU: dict[str, int] = {
    "pizza": 1299,
    "sandwich": 899,
    "drink": 299,
    "water": 199,
    "salad": 799,
    "soup": 649,
    "burger": 999,
    "fries": 399,
    "coffee": 349,
    "juice": 279,
}

_ETA = "30 min"


def _format_price(cents: int) -> str:
    return f"${cents / 100:.2f}"


def handle(entities: dict, reply: str) -> AgentResponse:
    requested = entities.get("items", [])
    if not isinstance(requested, list):
        requested = [str(requested)]
    if not requested:
        requested = ["sandwich"]

    ordered_items = []
    total_cents = 0

    for item_name in requested:
        normalized = item_name.lower().strip()
        matched_key = next(
            (key for key in _MENU if key in normalized or normalized in key),
            None,
        )
        if matched_key:
            price = _MENU[matched_key]
            ordered_items.append({"name": matched_key.title(), "price": _format_price(price)})
            total_cents += price
        else:
            ordered_items.append({"name": item_name.title(), "price": "$0.00"})

    return AgentResponse(
        reply=reply,
        action_type="order_food",
        action_payload={
            "items": ordered_items,
            "total": _format_price(total_cents),
            "eta": _ETA,
        },
    )
