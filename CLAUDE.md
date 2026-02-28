# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

```
├── backend/     FastAPI prediction API — see backend/CLAUDE.md for details
└── frontend/    React/TypeScript SPA  — see frontend/CLAUDE.md for details
```

## Commands

### Backend (`cd backend`)

```bash
pip install -r requirements.txt

python -m data.seed_phrases   # seed SQLite (run once)
python nightly_train.py       # build bigram map + ChromaDB embeddings

ollama serve                  # separate terminal — required for /llm_suggest
ollama pull phi3

uvicorn main:app --reload --port 8000
```

### Frontend (`cd frontend`)

```bash
bun install
bun run dev          # dev server on port 8080
bun run build        # production build
bun run lint
bun run test         # vitest
bunx vitest run src/test/example.test.ts   # single test file
```

## How the two services connect

`frontend/src/lib/api.ts` calls the backend at `http://localhost:8000`:

- `GET /suggestions?location=&partial=` — returns `{ predictions: string[], source: string }`
- `POST /llm_suggest` — body `{ partial_input, location }` — returns `{ suggestions: string[], model: string }`
- `POST /log_phrase` — body `{ phrase, location }`
- `POST /autocomplete/accepted` / `/dismissed` — body `{ suggested_phrase }`
- `GET /analytics/heatmap` — returns `{ data: [{ word, count }] }`
- `GET /analytics/summary` — returns `{ total_phrases, acceptance_rate, top_phrases, top_locations }`
- `POST /speak` — body `{ text }`

All calls have graceful fallbacks so the frontend works without the backend.

## Key architecture notes

See `backend/CLAUDE.md` for backend-specific gotchas (ChromaDB n_results guard, pyttsx3 threading, bigram key format).

See `frontend/CLAUDE.md` for frontend conventions (dark-theme-only CSS variables, AAC category color tokens, shadcn/ui usage).
