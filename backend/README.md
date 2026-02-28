# AAC Prediction Engine

A personal FastAPI backend for Augmentative and Alternative Communication (AAC). The system learns how a specific non-verbal user communicates and predicts what they want to say next using location/time context and semantic similarity.

## Architecture

```
Phrase logged → SQLite DB
                    ↓
          Nightly training (2 AM)
          ├── Bigram vocab → vocab_store.json
          └── Sentence embeddings → ChromaDB

GET /suggestions
  ├── Bigram next-word predictions (fast, local)
  ├── ChromaDB semantic similarity (vector search)
  └── Ollama LLM fallback (when < 5 phrases in DB)
```

## Quick Start

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Start Ollama (separate terminal)
```bash
brew install ollama   # macOS
ollama serve
ollama pull phi3
```

### 3. Seed database and train
```bash
python -m data.seed_phrases
python nightly_train.py
```

### 4. Start the API
```bash
uvicorn main:app --reload --port 8000
```

### 5. Interactive API docs
```
open http://localhost:8000/docs
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check + phrase count |
| `POST` | `/log_phrase` | Record a phrase the user spoke |
| `GET` | `/suggestions` | Get word/phrase predictions |
| `POST` | `/llm_suggest` | Direct LLM suggestion (bypasses vector store) |
| `POST` | `/speak` | Text-to-speech (offline or ElevenLabs) |
| `GET` | `/analytics/heatmap` | Phrase frequency by hour × location |
| `GET` | `/analytics/summary` | Aggregate usage statistics |
| `POST` | `/autocomplete/accepted` | Log that a suggestion was accepted |
| `POST` | `/autocomplete/dismissed` | Log that a suggestion was dismissed |

## Configuration

Edit `user_config.json` to set locations, default location, and TTS mode.

For ElevenLabs TTS, add your API key to `.env`:
```
ELEVENLABS_API_KEY=your_key_here
```

## End-to-End Test

```bash
# Health check
curl http://localhost:8000/health

# Log a phrase
curl -X POST http://localhost:8000/log_phrase \
  -H "Content-Type: application/json" \
  -d '{"phrase": "I need water please", "location": "Home"}'

# Get suggestions
curl "http://localhost:8000/suggestions?location=Home&partial=I+need"

# LLM suggest
curl -X POST http://localhost:8000/llm_suggest \
  -H "Content-Type: application/json" \
  -d '{"location": "School", "partial_input": "I need"}'

# Analytics
curl http://localhost:8000/analytics/heatmap
curl http://localhost:8000/analytics/summary

# TTS (offline)
curl -X POST http://localhost:8000/speak \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, I need help"}'
```

## Directory Structure

```
├── main.py                  # FastAPI app factory, lifespan, CORS
├── nightly_train.py         # Training pipeline (scheduler + standalone)
├── user_config.json         # Locations, TTS mode, ElevenLabs voice ID
├── requirements.txt
├── db/database.py           # SQLite thread-safe singleton + CRUD
├── routers/
│   ├── phrases.py           # POST /log_phrase
│   ├── suggestions.py       # GET /suggestions
│   ├── llm.py               # POST /llm_suggest
│   ├── tts.py               # POST /speak
│   ├── analytics.py         # GET /analytics/*
│   └── autocomplete.py      # POST /autocomplete/*
├── services/
│   ├── context.py           # Time-of-day labels, context tags
│   ├── vector_store.py      # ChromaDB client + embedding
│   ├── vocab.py             # Bigram frequency map + prediction
│   └── llm_service.py       # Ollama integration
├── models/schemas.py        # Pydantic request/response models
└── data/seed_phrases.py     # 15 seed phrases (run once)
```
