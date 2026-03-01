# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Generate the database encryption key (run once per machine, never commit)
python3 -c "import secrets; print(secrets.token_hex(32))" > aac.key && chmod 0600 aac.key

# Seed the SQLite database (run once — idempotent)
python -m data.seed_phrases

# Train: build bigram vocab + embed phrases into ChromaDB
python nightly_train.py

# Start the API (hot-reload)
uvicorn main:app --reload --port 8000

# Start Ollama LLM backend (separate terminal, required for /llm_suggest, /agent, and cold-start fallback)
ollama serve
ollama pull phi3
```

## Architecture

### Startup sequence (`main.py` lifespan)
1. `load_db_key()` — Read AES-256 passphrase from `aac.key`
2. `init_db()` — Create SQLite tables if missing
3. `init_vector_store()` — Load ChromaDB + sentence-transformer model
4. `load_vocab()` — Load bigram map from `vocab_store.json`
5. `start_tts_worker()` — Spawn pyttsx3 daemon thread
6. `start_scheduler()` — Register APScheduler cron job (nightly at 02:00)

### 3-layer prediction pipeline

```
User logs phrase → SQLite (db/database.py)
                       ↓
           python nightly_train.py
           ├── Bigram map → vocab_store.json
           └── Sentence embeddings → chroma_db/

GET /suggestions cascade:
  Layer 1 — Bigram next-word (services/vocab.py) — instant dict lookup
  Layer 2 — ChromaDB vector similarity (services/vector_store.py) — semantic search (if ≥ 5 phrases)
  Layer 3 — Ollama LLM fallback (services/llm_service.py) — cold start (< 5 phrases)
```

### Agent pipeline

```
POST /agent {message, location}
      ↓
IntentClassifier.classify(message) via phi3
      ↓
Intent: make_call | order_food | set_reminder | general_chat
      ↓
Tool: call_tool.py | food_tool.py | reminder_tool.py | LLM reply
      ↓
AgentResponse {reply, action_type, action_payload}
```

## Module responsibilities

| Module | Role |
|---|---|
| `db/database.py` | SQLCipher-encrypted SQLite singleton with `threading.Lock`; owns `phrase_logs`, `autocomplete_logs`, `reminders` tables |
| `services/vocab.py` | Bigram frequency map; `predict_next_words()` uses in-memory dict loaded from `vocab_store.json` |
| `services/vector_store.py` | ChromaDB + `all-MiniLM-L6-v2` embeddings; module-level singletons initialised once at startup |
| `services/llm_service.py` | Ollama async client; builds persona-aware system prompt; robustly parses JSON array response |
| `services/context.py` | Maps hour → time-of-day band (6 bands); composes `"{location}_{band}"` context tags stored as ChromaDB metadata |
| `services/agent_service.py` | `IntentClassifier`: classifies message via phi3; generates reply for general_chat via phi3 |
| `services/tools/call_tool.py` | Static contact book (mom, dad, doctor, nurse); returns `tel:` URI |
| `services/tools/food_tool.py` | Static menu with prices; fuzzy matches items, returns order summary + ETA |
| `services/tools/reminder_tool.py` | Inserts reminder into SQLite `reminders` table |
| `routers/tts.py` | macOS: delegates to `say` subprocess (stateless); others: pyttsx3 queue; ElevenLabs: `StreamingResponse audio/mpeg` |
| `nightly_train.py` | Dual-purpose: importable by APScheduler (2 AM cron) and runnable standalone |

## Key constraints & gotchas

- **`aac.key` required at startup**: `load_db_key()` raises `FileNotFoundError` if missing — server refuses to start rather than silently opening an unencrypted DB. Generate with the command above.
- **ChromaDB n_results guard**: always `min(n_results, collection.count())` before `.query()` — ChromaDB 1.x raises (not returns fewer) when `n_results > collection size`. See `services/vector_store.py`.
- **pyttsx3 thread**: must run on a single dedicated daemon thread. On macOS, the router delegates to the `say` subprocess directly (stateless, avoids pyttsx3 corruption). The `queue.Queue` in `routers/tts.py` is the correct interface for non-macOS.
- **ChromaDB API**: uses 1.x `PersistentClient(path=...)` — the old 0.4.x `Settings` API is gone.
- **Bigram keys**: pipe-delimited `"word1|word2"` — outer dict key is the first word, inner dict maps next-words to counts.
- **Document IDs in ChromaDB**: MD5 hash of phrase text — makes upserts idempotent without a separate existence check.
- **LLM response parsing** (`llm_service.py`): tries `json.loads()` → regex for first `[...]` block → plain-text line split. Never raises on malformed LLM output.

## Runtime-generated files (gitignored)

- `aac.key` — AES-256 passphrase (mode 0o600)
- `aac_data.db` — SQLite database (encrypted)
- `vocab_store.json` — bigram frequency map
- `chroma_db/` — ChromaDB persistent storage

## Configuration

- `user_config.json` — locations list, default location, `tts_mode` (`"offline"` or `"elevenlabs"`), ElevenLabs voice ID
- `.env` — `ELEVENLABS_API_KEY` (only needed when `tts_mode = "elevenlabs"`)
