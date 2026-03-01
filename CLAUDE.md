# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

This is a two-service monorepo for **ConnectAble**, a personal AAC (Augmentative and Alternative Communication) system:

| Directory | Role | Stack |
|---|---|---|
| `backend/` | Prediction API, TTS, agent | Python, FastAPI, ChromaDB, SQLite, Ollama |
| `frontend/` | Symbol communication board | React, TypeScript, Vite, Tailwind, shadcn/ui |

Each directory has its own `CLAUDE.md` with detailed commands, architecture, and gotchas. Read the relevant one before modifying that sub-project.

## How the two services connect

`frontend/src/lib/api.ts` makes all backend calls to `http://localhost:8000`. All calls have graceful fallbacks so the UI works without the backend running:

| Frontend call | Backend endpoint |
|---|---|
| `fetchSuggestions(location, partial)` | `GET /suggestions` |
| `speakText(text)` | `POST /speak` |
| `logPhrase(phrase, location)` | `POST /log_phrase` |
| `logAccepted/logDismissed(suggestion)` | `POST /autocomplete/accepted\|dismissed` |
| `fetchHeatmap()` | `GET /analytics/heatmap` |
| `fetchAnalyticsSummary()` | `GET /analytics/summary` |
| `fetchLLMSuggest(partial, location)` | `POST /llm_suggest` |
| `sendAgentMessage(message, location)` | `POST /agent` |
| `fetchReminders()` | `GET /reminders` |
| `deleteReminder(id)` | `DELETE /reminders/{id}` |

## Full-stack development

```bash
# Terminal 1 — backend API
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2 — Ollama LLM (required for /suggestions fallback, /llm_suggest, /agent)
ollama serve

# Terminal 3 — frontend
cd frontend
npm run dev          # starts on port 8080
```

First-time setup:

```bash
# Backend
cd backend
pip install -r requirements.txt
python3 -c "import secrets; print(secrets.token_hex(32))" > aac.key && chmod 0600 aac.key
python -m data.seed_phrases   # seeds SQLite with starter phrases
python nightly_train.py       # builds bigram map + ChromaDB embeddings
ollama pull phi3              # ~2 GB download

# Frontend
cd frontend
npm install
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

## Agent pipeline (how /agent works)

```
POST /agent {message, location}
      ↓
IntentClassifier (phi3 via Ollama)
      ↓
One of 4 intents: make_call | order_food | set_reminder | general_chat
      ↓
Tool dispatch → call_tool / food_tool / reminder_tool / LLM reply
      ↓
AgentResponse {reply, action_type, action_payload}
```

## Configuration

- **`backend/user_config.json`** — user locations, default location, `tts_mode` (`"offline"` or `"elevenlabs"`)
- **`backend/aac.key`** — AES-256 passphrase for the encrypted SQLite DB (generate once, never commit)
- **`backend/.env`** — `ELEVENLABS_API_KEY` (only needed when `tts_mode = "elevenlabs"`)
