# ConnectAble — AAC Communication System
by Nipun, Alesia, 

**ConnectAble** is a personal Augmentative and Alternative Communication (AAC) system that helps non-verbal users communicate through a symbol-based board. The system learns how a specific user communicates over time and predicts what they want to say next using their phrase history, location, and time-of-day context.

## How it works

```
User presses symbol buttons → builds a sentence → speaks it aloud
                                                         ↓
                                               phrase logged to SQLite
                                                         ↓
                                             nightly training (2 AM)
                                        ┌────────────────┴────────────────┐
                                   Bigram map                    ChromaDB embeddings
                                (vocab_store.json)                  (chroma_db/)

When the user starts typing, GET /suggestions runs a 3-layer cascade:
  Layer 1 — Bigram next-word lookup (instant, local dict)
  Layer 2 — ChromaDB semantic similarity (vector search over past phrases)
  Layer 3 — Ollama LLM fallback (phi3, used when < 5 phrases in DB)
```

The frontend is a React SPA with a grid of 66 AAC symbol buttons across 5 categories (food, feelings, actions, places, people). As the user builds a sentence, the top bar shows AI-powered phrase suggestions that update in real time. Tapping a suggestion appends it and logs it as accepted for future learning.

An **agent tab** lets users send natural language messages that are classified into intents (make a call, order food, set a reminder, or general chat) and dispatched to tool handlers.

## Repository structure

```
├── backend/     FastAPI prediction API + agent (Python)
└── frontend/    Symbol board UI (React + TypeScript + Vite)
```

## Quick start

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com) (`brew install ollama` on macOS)

### 1. Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Generate the database encryption key (run once per machine, never commit)
python3 -c "import secrets; print(secrets.token_hex(32))" > aac.key && chmod 0600 aac.key

# Seed starter phrases and build the prediction models (run once)
python -m data.seed_phrases
python nightly_train.py

# Start Ollama in a separate terminal (needed for LLM fallback and agent)
ollama serve
ollama pull phi3

# Start the API on port 8000
uvicorn main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server on port 8080
npm run dev
```

Open `http://localhost:8080`. The UI works standalone with fallback data if the backend is not running.

### Configuration

- **`backend/user_config.json`** — set user locations, default location, and TTS mode (`"offline"` or `"elevenlabs"`)
- **`backend/aac.key`** — AES-256 encryption key for SQLite (generated above, gitignored)
- **`backend/.env`** — add `ELEVENLABS_API_KEY=...` if using ElevenLabs TTS

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check + phrase count |
| `POST` | `/log_phrase` | Record a phrase the user spoke |
| `GET` | `/suggestions` | 3-layer word/phrase predictions |
| `POST` | `/llm_suggest` | Direct Ollama LLM suggestion (bypasses vector store) |
| `POST` | `/speak` | Text-to-speech (offline pyttsx3 or ElevenLabs streaming) |
| `GET` | `/analytics/heatmap` | Top 50 words by frequency across logged phrases |
| `GET` | `/analytics/summary` | Total phrases, acceptance rate, top phrases, top locations |
| `POST` | `/autocomplete/accepted` | Log that a suggestion was accepted |
| `POST` | `/autocomplete/dismissed` | Log that a suggestion was dismissed |
| `POST` | `/agent` | Intent classification + tool dispatch |
| `GET` | `/reminders` | List all reminders |
| `DELETE` | `/reminders/{id}` | Delete a reminder by ID |

## Tech stack

| Layer | Stack |
|-------|-------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts |
| Backend | FastAPI, SQLite (AES-256 via SQLCipher), ChromaDB, sentence-transformers (`all-MiniLM-L6-v2`) |
| LLM | Ollama + phi3 (local, offline) |
| TTS | pyttsx3 / macOS `say` (offline) or ElevenLabs (streaming audio) |
