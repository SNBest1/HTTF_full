"""
FastAPI application factory for the AAC Prediction Engine.

Startup sequence (lifespan):
  1. init_db()           — create SQLite tables
  2. init_vector_store() — load ChromaDB + sentence-transformer
  3. load_vocab()        — load bigram vocab from vocab_store.json
  4. start_tts_worker()  — spawn pyttsx3 daemon thread
  5. start_scheduler()   — schedule nightly training at 02:00

Uses @asynccontextmanager lifespan (FastAPI 0.93+ recommended pattern,
replaces deprecated @app.on_event("startup")).
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from db.database import init_db, count_phrases, load_db_key
from services.vector_store import init_vector_store
from services.vocab import load_vocab
from routers.tts import start_tts_worker
from routers import phrases, suggestions, llm, tts, analytics, autocomplete, agent, reminders
from models.schemas import HealthResponse

load_dotenv()


def start_scheduler() -> None:
    """Schedule nightly_train.run_training() at 02:00 local time."""
    from apscheduler.schedulers.background import BackgroundScheduler
    from nightly_train import run_training

    scheduler = BackgroundScheduler()
    scheduler.add_job(run_training, "cron", hour=2, minute=0, id="nightly_train")
    scheduler.start()
    print("[scheduler] Nightly training scheduled at 02:00.")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # ── Startup ──────────────────────────────────────────────────────────────
    print("[startup] Loading database encryption key...")
    load_db_key()

    print("[startup] Initialising database...")
    init_db()

    print("[startup] Initialising vector store...")
    try:
        init_vector_store()
    except Exception as exc:
        print(f"[startup] Vector store init failed (non-fatal): {exc}")

    print("[startup] Loading vocabulary...")
    load_vocab()

    print("[startup] Starting TTS worker...")
    start_tts_worker()

    print("[startup] Starting scheduler...")
    start_scheduler()

    print("[startup] AAC Prediction Engine ready.")
    yield
    # ── Shutdown (nothing to clean up — daemon threads die with process) ─────
    print("[shutdown] Goodbye.")


# ── App factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="AAC Prediction Engine",
    description=(
        "Personal Augmentative and Alternative Communication backend — "
        "learns from a user's phrase history and predicts what they want to say next."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(phrases.router)
app.include_router(suggestions.router)
app.include_router(llm.router)
app.include_router(tts.router)
app.include_router(analytics.router)
app.include_router(autocomplete.router)
app.include_router(agent.router)
app.include_router(reminders.router)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", phrases_logged=count_phrases())
