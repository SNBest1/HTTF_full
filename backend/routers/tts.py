"""
POST /speak — text-to-speech endpoint supporting two modes:
  • offline:     OS-native TTS via a dedicated daemon thread + queue
                 macOS  → `say`  subprocess (always-running, no state)
                 other  → pyttsx3 fallback
  • elevenlabs:  ElevenLabs streaming audio (StreamingResponse, audio/mpeg)

Mode is determined by user_config.json tts_mode, overridable per-request.
"""

import json
import os
import platform
import queue
import subprocess
import threading
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse

from models.schemas import SpeakRequest

router = APIRouter()

# ── Config ────────────────────────────────────────────────────────────────────

_CONFIG_PATH = Path(__file__).parent.parent / "user_config.json"
_IS_MACOS = platform.system() == "Darwin"


def _load_config() -> dict:
    with open(_CONFIG_PATH) as f:
        return json.load(f)


# ── Offline TTS daemon thread ──────────────────────────────────────────────────

_tts_queue: queue.Queue[str | None] = queue.Queue()
_tts_thread: threading.Thread | None = None


def _speak_once(text: str) -> None:
    """
    Speak a single utterance using the best available method for the platform.

    macOS: delegates to the built-in `say` subprocess.  Each call is a
    completely independent OS process — no shared Python state, no engine
    caching, never goes stale.  This is why it keeps working indefinitely,
    unlike pyttsx3 whose macOS nsss driver corrupts internal loop state
    after the first runAndWait() and cannot be reliably re-initialised on
    the same thread.

    Other platforms: pyttsx3 fallback (works fine on Windows/Linux).
    """
    if _IS_MACOS:
        subprocess.run(["say", "-r", "175", text], check=False)
    else:
        import pyttsx3
        engine = pyttsx3.init()
        engine.setProperty("rate", 150)
        engine.say(text)
        engine.runAndWait()
        engine.stop()


def _tts_worker() -> None:
    """
    Persistent daemon thread — blocks on the queue, speaks each item in order.
    Never exits (until None sentinel). The speaking implementation is stateless
    per-utterance so the thread itself can run indefinitely.
    """
    while True:
        text = _tts_queue.get()
        if text is None:
            break
        try:
            _speak_once(text)
        except Exception as exc:
            print(f"[tts] speak error: {exc}")


def start_tts_worker() -> None:
    """Spawn the TTS daemon thread once at application startup."""
    global _tts_thread
    if _tts_thread is None or not _tts_thread.is_alive():
        _tts_thread = threading.Thread(target=_tts_worker, daemon=True, name="tts-worker")
        _tts_thread.start()
        engine_desc = "say (macOS)" if _IS_MACOS else "pyttsx3"
        print(f"[tts] daemon thread started using {engine_desc}.")


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
