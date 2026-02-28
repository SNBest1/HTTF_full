"""
POST /speak — text-to-speech endpoint supporting two modes:
  • offline:     pyttsx3 via a dedicated daemon thread + queue
  • elevenlabs:  ElevenLabs streaming audio (StreamingResponse, audio/mpeg)

Mode is determined by user_config.json tts_mode, overridable per-request.
"""

import json
import os
import queue
import threading
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse

from models.schemas import SpeakRequest

router = APIRouter()

# ── Config ────────────────────────────────────────────────────────────────────

_CONFIG_PATH = Path(__file__).parent.parent / "user_config.json"


def _load_config() -> dict:
    with open(_CONFIG_PATH) as f:
        return json.load(f)


# ── pyttsx3 daemon thread ─────────────────────────────────────────────────────

_tts_queue: queue.Queue[str | None] = queue.Queue()
_tts_thread: threading.Thread | None = None


def _tts_worker() -> None:
    """
    Runs pyttsx3 event loop on a dedicated daemon thread.
    Reads text items from _tts_queue; None sentinel shuts it down.
    """
    import pyttsx3

    engine = pyttsx3.init()
    engine.setProperty("rate", 150)

    while True:
        text = _tts_queue.get()
        if text is None:
            break
        try:
            engine.say(text)
            engine.runAndWait()
        except Exception as exc:
            print(f"[tts] pyttsx3 error: {exc}")


def start_tts_worker() -> None:
    """Spawn the pyttsx3 daemon thread once at application startup."""
    global _tts_thread
    if _tts_thread is None or not _tts_thread.is_alive():
        _tts_thread = threading.Thread(target=_tts_worker, daemon=True, name="pyttsx3-worker")
        _tts_thread.start()
        print("[tts] pyttsx3 daemon thread started.")


# ── ElevenLabs streaming ──────────────────────────────────────────────────────

def _elevenlabs_stream(text: str, voice_id: str):
    """
    Generator that yields audio chunks from ElevenLabs streaming API.
    Requires ELEVENLABS_API_KEY in environment.
    """
    from elevenlabs.client import ElevenLabs
    from dotenv import load_dotenv

    load_dotenv()
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        raise ValueError("ELEVENLABS_API_KEY not set in .env")

    client = ElevenLabs(api_key=api_key)
    audio_stream = client.text_to_speech.convert_as_stream(
        voice_id=voice_id,
        text=text,
        model_id="eleven_multilingual_v2",
    )
    yield from audio_stream


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post("/speak")
async def speak(req: SpeakRequest):
    config = _load_config()
    mode = req.mode or config.get("tts_mode", "offline")

    if mode == "elevenlabs":
        voice_id = config.get("elevenlabs_voice_id", "21m00Tcm4TlvDq8ikWAM")
        try:
            return StreamingResponse(
                _elevenlabs_stream(req.text, voice_id),
                media_type="audio/mpeg",
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"ElevenLabs error: {e}")

    else:  # offline / pyttsx3
        if _tts_thread is None or not _tts_thread.is_alive():
            raise HTTPException(
                status_code=503,
                detail="TTS worker thread is not running. Check server startup.",
            )
        _tts_queue.put(req.text)
        return JSONResponse({"spoken": True, "text": req.text, "mode": "offline"})
