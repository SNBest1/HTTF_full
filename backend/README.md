# ConnectAble Backend

A FastAPI backend for Augmentative and Alternative Communication (AAC). Learns how a specific user communicates and predicts what they want to say using phrase history, location, and time-of-day context. Also provides an intent-based agent for hands-free actions.

## Architecture

```
Phrase logged → SQLite (AES-256 encrypted)
                    ↓
          Nightly training (2 AM)
          ├── Bigram vocab → vocab_store.json
          └── Sentence embeddings → ChromaDB

GET /suggestions cascade:
  Layer 1 — Bigram next-word predictions (instant, local dict)
  Layer 2 — ChromaDB semantic similarity (vector search, if ≥ 5 phrases)
  Layer 3 — Ollama LLM fallback (phi3, cold start when < 5 phrases)

POST /agent cascade:
  IntentClassifier (phi3) → make_call | order_food | set_reminder | general_chat
  Tool dispatch → call_tool | food_tool | reminder_tool | LLM reply
```

## Quick start

```bash
# 1. Install
pip install -r requirements.txt

# 2. Generate encryption key (once per machine, never commit)
python3 -c "import secrets; print(secrets.token_hex(32))" > aac.key && chmod 0600 aac.key

# 3. Start Ollama (separate terminal)
ollama serve && ollama pull phi3

# 4. Seed and train
python -m data.seed_phrases
python nightly_train.py

# 5. Run
uvicorn main:app --reload --port 8000
```

API docs: `http://localhost:8000/docs`

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check + phrase count |
| `POST` | `/log_phrase` | Record a phrase the user spoke |
| `GET` | `/suggestions?location=&partial=` | 3-layer predictions |
| `POST` | `/llm_suggest` | Direct Ollama suggestion (bypasses vector store) |
| `POST` | `/speak` | Text-to-speech (offline or ElevenLabs streaming) |
| `GET` | `/analytics/heatmap` | Top 50 words by frequency |
| `GET` | `/analytics/summary` | Total phrases, acceptance rate, top phrases + locations |
| `POST` | `/autocomplete/accepted` | Log accepted suggestion |
| `POST` | `/autocomplete/dismissed` | Log dismissed suggestion |
| `POST` | `/agent` | Intent classification + tool dispatch |
| `GET` | `/reminders` | List all reminders |
| `DELETE` | `/reminders/{id}` | Delete a reminder by ID |

## Directory structure

```
├── main.py                      # App factory, lifespan, CORS
├── nightly_train.py             # Training pipeline (scheduler + standalone)
├── user_config.json             # Locations, TTS mode, ElevenLabs voice ID
├── aac.key                      # AES-256 key (gitignored, generate once)
├── db/
│   └── database.py              # SQLCipher-encrypted SQLite singleton + CRUD
├── routers/
│   ├── phrases.py               # POST /log_phrase
│   ├── suggestions.py           # GET /suggestions
│   ├── llm.py                   # POST /llm_suggest
│   ├── tts.py                   # POST /speak
│   ├── analytics.py             # GET /analytics/heatmap, /analytics/summary
│   ├── autocomplete.py          # POST /autocomplete/accepted|dismissed
│   ├── agent.py                 # POST /agent
│   └── reminders.py             # GET /reminders, DELETE /reminders/{id}
├── services/
│   ├── context.py               # Time-of-day bands, context tag composer
│   ├── vector_store.py          # ChromaDB + sentence-transformer embeddings
│   ├── vocab.py                 # Bigram frequency map + next-word prediction
│   ├── llm_service.py           # Ollama async client + response parser
│   ├── agent_service.py         # IntentClassifier (phi3)
│   └── tools/
│       ├── call_tool.py         # Contact book → tel: URI
│       ├── food_tool.py         # Static menu, fuzzy match, order summary
│       └── reminder_tool.py     # Insert reminder into SQLite
├── models/
│   └── schemas.py               # All Pydantic request/response models
└── data/
    └── seed_phrases.py          # 15 starter phrases (idempotent, run once)
```

## Configuration

**`user_config.json`** (edit to customise):
```json
{
  "locations": ["Home", "School", "Hospital", "Work"],
  "default_location": "Home",
  "tts_mode": "offline",
  "elevenlabs_voice_id": "21m00Tcm4TlvDq8ikWAM"
}
```

**`.env`** (only needed for ElevenLabs):
```
ELEVENLABS_API_KEY=your_key_here
```

## Example curl calls

```bash
# Health check
curl http://localhost:8000/health

# Log a phrase
curl -X POST http://localhost:8000/log_phrase \
  -H "Content-Type: application/json" \
  -d '{"phrase": "I need water please", "location": "Home"}'

# Get suggestions
curl "http://localhost:8000/suggestions?location=Home&partial=I+need"

# Agent intent
curl -X POST http://localhost:8000/agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Call mom", "location": "Home"}'

# List reminders
curl http://localhost:8000/reminders

# Analytics
curl http://localhost:8000/analytics/summary
```
