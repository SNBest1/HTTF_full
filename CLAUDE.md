# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Seed the SQLite database (run once — idempotent)
python -m data.seed_phrases

# Train: build bigram vocab + embed phrases into ChromaDB
python nightly_train.py

# Start the API (hot-reload)
uvicorn main:app --reload --port 8000

# Start Ollama LLM backend (separate terminal, required for /llm_suggest and cold-start fallback)
ollama serve
ollama pull phi3
```

## Architecture

The system is a 3-layer AAC prediction pipeline:

```
User logs phrase → SQLite (db/database.py)
                       ↓
           python nightly_train.py
           ├── Bigram map → vocab_store.json
           └── Sentence embeddings → chroma_db/

GET /suggestions cascade:
  Layer 1 — Bigram next-word (services/vocab.py) — instant dict lookup
  Layer 2 — ChromaDB vector similarity (services/vector_store.py) — semantic
  Layer 3 — Ollama LLM fallback (services/llm_service.py) — when < 5 phrases in DB
```

**Startup sequence** (`main.py` lifespan): `init_db()` → `init_vector_store()` → `load_vocab()` → `start_tts_worker()` → `start_scheduler()`

### Key constraints & gotchas

- **ChromaDB n_results guard**: always `min(n_results, collection.count())` before `.query()` — ChromaDB 1.x raises (not returns fewer) when `n_results > collection size`. See `services/vector_store.py:query_similar()`.
- **pyttsx3 thread**: must run on a single dedicated daemon thread — never call `pyttsx3.init()` from async code or multiple threads. The `queue.Queue` in `routers/tts.py` is the only correct interface.
- **ChromaDB API**: uses 1.x `PersistentClient(path=...)` — the old 0.4.x `Settings` API is gone.
- **Bigram keys**: pipe-delimited `"word1|word2"` — outer dict key is the first word, inner dict maps next-words to counts.
- **Document IDs in ChromaDB**: MD5 hash of phrase text — makes upserts idempotent without a separate existence check.

### Module responsibilities

| Module | Role |
|---|---|
| `db/database.py` | Thread-safe SQLite singleton with `threading.Lock`; owns `phrase_logs` and `autocomplete_logs` tables |
| `services/vocab.py` | Bigram frequency map; `predict_next_words()` uses in-memory dict loaded from `vocab_store.json` |
| `services/vector_store.py` | ChromaDB + `all-MiniLM-L6-v2` embeddings; module-level singletons initialised once at startup |
| `services/llm_service.py` | Ollama async client; builds persona-aware system prompt; expects JSON array response |
| `services/context.py` | Maps hour → time-of-day band (5 bands); composes `"{location}_{band}"` context tags stored as ChromaDB metadata |
| `nightly_train.py` | Dual-purpose: importable by APScheduler (2 AM cron) and runnable standalone |
| `routers/tts.py` | Two paths: pyttsx3 (offline, via queue) or ElevenLabs (streaming, `StreamingResponse audio/mpeg`) |

### Runtime-generated files (gitignored)

- `aac_data.db` — SQLite database
- `vocab_store.json` — bigram frequency map
- `chroma_db/` — ChromaDB persistent storage

### Configuration

- `user_config.json` — locations list, default location, `tts_mode` (`"offline"` or `"elevenlabs"`), ElevenLabs voice ID
- `.env` — `ELEVENLABS_API_KEY` (only needed when `tts_mode = "elevenlabs"`)
