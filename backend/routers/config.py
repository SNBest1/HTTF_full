import json
from pathlib import Path
from fastapi import APIRouter
from models.schemas import ConfigResponse

router = APIRouter()
_CONFIG_PATH = Path(__file__).parent.parent / "user_config.json"


@router.get("/config", response_model=ConfigResponse)
def get_config() -> ConfigResponse:
    try:
        with open(_CONFIG_PATH) as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        data = {}
    return ConfigResponse(
        locations=data.get("locations", ["Home"]),
        default_location=data.get("default_location", "Home"),
        tts_mode=data.get("tts_mode", "offline"),
    )
