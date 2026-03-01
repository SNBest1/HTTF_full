# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

This is a two-service monorepo for **ConnectAble**, a personal AAC (Augmentative and Alternative Communication) system:

| Directory | Role | Stack |
|---|---|---|
| `backend/` | Prediction API + TTS | Python, FastAPI, ChromaDB, SQLite, Ollama |
| `frontend/` | Symbol communication board | React, TypeScript, Vite, Tailwind, shadcn/ui |

Each directory has its own `CLAUDE.md` with detailed commands, architecture, and gotchas. Read the relevant one before modifying that sub-project.

## How the two services connect

`frontend/src/lib/api.ts` makes all backend calls to `http://localhost:8000`. All calls have graceful fallbacks so the UI works without the backend running:

- `GET /suggestions?location=&partial=` — AI phrase predictions
- `POST /speak` — text-to-speech
- `POST /log_phrase` — record a spoken phrase (fire-and-forget)
- `GET /analytics/heatmap` — vocabulary usage data

## Full-stack development

```bash
# Terminal 1 — backend API
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2 — Ollama LLM (required for /llm_suggest and cold-start fallback)
ollama serve

# Terminal 3 — frontend
cd frontend
bun run dev          # starts on port 8080
```

First-time setup:

```bash
# Backend
cd backend
pip install -r requirements.txt
python -m data.seed_phrases   # seeds SQLite with starter phrases
python nightly_train.py       # builds bigram map + ChromaDB embeddings
ollama pull phi3              # ~2 GB download

# Frontend
cd frontend
bun install
```

## Prediction pipeline (how /suggestions works)

```
User logs phrase → SQLite
                      ↓
          nightly_train.py (2 AM cron or run manually)
          ├── Bigram map → vocab_store.json
          └── Sentence embeddings → chroma_db/

GET /suggestions cascade:
  Layer 1 — Bigram next-word lookup (instant, local dict)
  Layer 2 — ChromaDB semantic similarity (vector search over past phrases)
  Layer 3 — Ollama LLM fallback (phi3, used when < 5 phrases in DB)
```

## Configuration

- **`backend/user_config.json`** — user locations, default location, `tts_mode` (`"offline"` or `"elevenlabs"`)
- **`backend/.env`** — `ELEVENLABS_API_KEY` (only needed when `tts_mode = "elevenlabs"`)
