# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

This is a two-service monorepo for a personal AAC (Augmentative and Alternative Communication) system called **ConnectAble**:

| Directory | Role | Stack |
|---|---|---|
| `HTTF_Hackathon/` | Backend prediction API | Python, FastAPI, ChromaDB, SQLite, Ollama |
| `speak-easy-interface/` | Frontend communication board | React, TypeScript, Vite, Tailwind, shadcn/ui |

Each directory has its own `CLAUDE.md` with detailed commands, architecture, and gotchas. Read the relevant one before modifying that sub-project.

## How the two services connect

The frontend (`speak-easy-interface`) talks to the backend (`HTTF_Hackathon`) at `http://localhost:8000` via four API calls defined in `speak-easy-interface/src/lib/api.ts`:

- `GET /suggestions?location=&partial=` — AI phrase predictions
- `POST /speak` — text-to-speech
- `POST /log_phrase` — record a spoken phrase (fire-and-forget)
- `GET /analytics/heatmap` — vocabulary usage data

All four calls have graceful fallbacks so the UI works without the backend running.

## Full-stack development

Start both services in separate terminals:

```bash
# Terminal 1 — backend
cd HTTF_Hackathon
uvicorn main:app --reload --port 8000

# Terminal 2 — Ollama LLM (required for /llm_suggest and cold-start)
ollama serve

# Terminal 3 — frontend
cd speak-easy-interface
npm run dev          # starts on port 8080
```

First-time setup — run once per machine:

```bash
# Backend
cd HTTF_Hackathon
pip install -r requirements.txt
python -m data.seed_phrases   # seeds SQLite with 15 starter phrases
python nightly_train.py       # builds bigram map + ChromaDB embeddings
ollama pull phi3              # downloads the LLM model (~2 GB)

# Frontend
cd speak-easy-interface
npm install
```

## API endpoints (backend)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check + phrase count |
| `POST` | `/log_phrase` | Record a phrase the user spoke |
| `GET` | `/suggestions` | 3-layer word/phrase predictions |
| `POST` | `/llm_suggest` | Direct Ollama LLM suggestion |
| `POST` | `/speak` | TTS (offline pyttsx3 or ElevenLabs) |
| `GET` | `/analytics/heatmap` | Phrase frequency by hour × location |
| `GET` | `/analytics/summary` | Aggregate usage statistics |
| `POST` | `/autocomplete/accepted` | Log accepted suggestion |
| `POST` | `/autocomplete/dismissed` | Log dismissed suggestion |

Interactive API docs available at `http://localhost:8000/docs` when the backend is running.
