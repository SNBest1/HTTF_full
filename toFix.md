# ConnectAble — Codebase Audit

Harsh, honest assessment. Priority ordered. No sugar-coating.

---

## DEAD FILES — DELETE THESE

### `frontend/src/components/NavLink.tsx`
Never imported anywhere. A React Router NavLink wrapper that wraps nothing and is called by nobody. Delete it.

### `frontend/src/hooks/use-mobile.tsx`
Not imported or called in any component. Dead on arrival. Delete it.

### `backend/instruction.txt`
A spec document sitting in the repo root. Not code. Not config. Not a README. Delete it or move it outside the repo.

---

## UNUSED DEPENDENCIES — INSTANT WINS

### Frontend (`package.json`)

**`@tanstack/react-query`** — installed, QueryClient initialized in App.tsx, wraps the whole app in a provider. Not a single `useQuery` or `useMutation` anywhere. All data fetching is raw `fetch()` in `lib/api.ts`. This adds 50KB+ to the bundle for zero benefit.
```
npm remove @tanstack/react-query
```
Then remove the `QueryClient` and `QueryClientProvider` from `App.tsx`.

**`zod`** — 30KB validation library. Never imported. Never used. No schemas. No `z.object()` anywhere.
```
npm remove zod
```

**`lovable-tagger`** — unknown AI-generated code tagger in devDependencies. Never used. Remove it.
```
npm remove lovable-tagger
```

Total: ~80KB+ of dead weight removed from the bundle.

### Frontend — Shadcn/UI Graveyard
53 UI components exist. Approximately 10 are actually used. The rest sit in `src/components/ui/` bloating the repo. Unused ones:

`accordion.tsx`, `alert-dialog.tsx`, `aspect-ratio.tsx`, `breadcrumb.tsx`, `calendar.tsx`, `carousel.tsx`, `chart.tsx`, `collapsible.tsx`, `command.tsx`, `context-menu.tsx`, `drawer.tsx`, `form.tsx`, `hover-card.tsx`, `input-otp.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `pagination.tsx`, `popover.tsx`, `progress.tsx`, `radio-group.tsx`, `resizable.tsx`, `separator.tsx`, `sheet.tsx`, `sidebar.tsx`, `skeleton.tsx`, `slider.tsx`, `table.tsx`, `toggle-group.tsx`, `toggle.tsx`

Audit each, delete the ones you don't use. They won't shrink the JS bundle much since tree-shaking handles most of it, but they're noise in the codebase.

**`sonner.tsx`** — rendered as `<Sonner />` in App.tsx, but `toast()` is never called anywhere. The app also has its own `use-toast.ts` hook. Two toast systems, zero actual toasts from Sonner. Remove the import and the component render from App.tsx.

---

## DEAD UI — UI THAT LIES TO THE USER

### `frontend/src/components/ProfileView.tsx` — Voice Clone Toggle
Line 7: `voiceClone` state defined. Line ~45: toggle renders. There is no voice cloning feature in the backend. The TTS router doesn't have a clone endpoint. The toggle switches state that affects nothing.

Either implement it or delete the toggle. Right now it's a lie.

### `frontend/src/components/SOSModal.tsx` — "Notify Contacts (Coming Soon)"
A disabled button that says "Coming Soon." This is placeholder UI that made it to production. If the feature isn't built, remove the button entirely. A disabled "coming soon" button in an emergency SOS modal is particularly bad UX.

### `frontend/src/pages/NotFound.tsx` — console.error left in
Line 8: `console.error("404 Error: User attempted to access non-existent route:", ...)`. Use the logger or remove it.

---

## CODE DUPLICATION

### JSON Parsing Logic Duplicated Exactly
`services/llm_service.py` lines 19–57 (`parse_llm_suggestions`) and `services/agent_service.py` lines 54–85 (`_parse_classification_response`) are the same 4-stage JSON parsing strategy: strip markdown → `json.loads` → regex for JSON block → plain text fallback. Different fallback dicts, identical logic.

Extract to `services/utils.py`:
```python
def parse_json_response(text: str, fallback: dict) -> dict:
    ...
```

### Default Location "Home" Has 5 Sources of Truth
- `user_config.json` line 3
- `models/schemas.py` line 14
- `routers/config.py` line 18
- `frontend/src/pages/Index.tsx` line 39
- `frontend/src/lib/api.ts` line 193

The frontend and backend independently default to "Home" without talking to each other. The GET /config endpoint exists but the frontend hardcodes a fallback anyway. Pick one authoritative source.

### `lib/api.ts` — Silent Failure Pattern × 7
Every API function has a catch block that swallows the error and returns a default value. The user never knows if their phrase was logged, if suggestions are stale, or if the agent call failed. Seven separate places doing this.

At minimum, log these errors. Ideally surface failures to the user instead of silently showing stale data.

---

## OVERCOMPLICATED CODE

### `frontend/src/pages/Index.tsx` — 215 Lines of State Soup
8 `useState` hooks. 3 `useEffect` hooks. 6 `useCallback` hooks. Manages: sentence building, suggestions, location, all locations list, settings panel visibility, current time, pending agent messages, TTS state. Passes 10+ props down to TopBar and BottomBar.

This file is the entire app's brain. Split it:
- `useSuggestions(location, sentence)` → manages suggestion fetching
- `useAACSession()` → manages sentence state, speaking, clearing
- `useSettings()` → manages settings, location changes

### `frontend/src/components/AgentView.tsx` — 316 Lines With Inline Sub-Components
`CallCard`, `FoodCard`, and `ReminderCard` are defined as functions inside the file. They should be extracted to their own files. `handleSend` + `handleSendRef` is a workaround for a stale closure that wouldn't exist if the logic were structured better.

### `backend/routers/tts.py` — 3 Implementations of 1 Feature
One feature (speak text) has: macOS subprocess path, pyttsx3 path, ElevenLabs path, plus a config loader called on every request. `_load_config()` reads from disk synchronously every single time `/speak` is hit. Cache it at startup.

Also: pyttsx3 is re-initialized per call on non-macOS platforms. This is documented as intentional but creates a new engine object every time, which is wasteful.

### `backend/services/tools/reminder_tool.py` — Time Parsing Theater
Three regex patterns with lambda transformers. `_normalize_time()` returns empty string on failure. Empty string gets stored in the database. UI displays "Anytime" for empty time. The parser fails silently and the database records garbage.

Use `python-dateutil` or validate the time before storing. Don't let empty strings into the database.

---

## SILENT FAILURES — THINGS THAT BREAK WITHOUT TELLING ANYONE

These are all places where exceptions are caught and swallowed, returning defaults instead of signaling failure:

| Location | What fails silently |
|---|---|
| `routers/phrases.py` line 25 | ChromaDB embedding failure — phrase logged but not indexed |
| `routers/suggestions.py` line 53 | LLM fallback failure — returns empty list, no indication why |
| `main.py` line 54 | Vector store init failure — server starts in degraded state with no warning |
| `services/llm_service.py` lines 38, 48 | JSON parse failure — raw LLM response is dropped, fallback returned |
| `services/agent_service.py` line 80 | Classification failure — default intent used silently |
| `lib/api.ts` × 7 | All API calls — network errors, 500s, timeouts all return defaults silently |
| `AgentView.tsx` line 144 | Reminders refresh failure — stale list shown silently |

The LLM parse failures are especially bad: the raw response is lost, there's no way to diagnose why the LLM is returning unparseable output.

---

## CONFIGURATION HARDCODING

### `frontend/src/lib/api.ts` line 1
```ts
const BASE_URL = "http://localhost:8000"
```
Hardcoded. Not configurable for any environment beyond local dev. Move to `.env`:
```
VITE_API_URL=http://localhost:8000
```
```ts
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"
```

### `backend/services/vector_store.py` line 21
```python
EMBED_MODEL = "all-MiniLM-L6-v2"
```
Hardcoded. 2GB+ download. Not in config. Not swappable without code change.

### `backend/services/llm_service.py` line 16 + `agent_service.py`
```python
DEFAULT_MODEL = "phi3"
```
Repeated in two files. Should be in `user_config.json`.

### `backend/routers/tts.py`
`_load_config()` is called on every `/speak` request — reads `user_config.json` from disk synchronously every time. Cache this at startup in `lifespan()` and pass it through or store as module-level after loading once.

---

## ACCEPTANCE SCORING QUERY — PERFORMANCE

`db/database.py` `get_phrase_acceptance_scores()` runs a `GROUP BY` query on `autocomplete_logs` every time `/suggestions` is called. This is potentially called on every keystroke. Cache the result for 60 seconds or recalculate only when new acceptance/dismissal events occur.

---

## WHAT TO SHORTEN

These files are long because logic wasn't extracted, not because the features are complex:

| File | Lines | What to extract |
|---|---|---|
| `frontend/src/components/AgentView.tsx` | 316 | CallCard, FoodCard, ReminderCard → separate files |
| `frontend/src/pages/Index.tsx` | 215 | useSuggestions, useAACSession, useSettings → custom hooks |
| `frontend/src/lib/aac-data.ts` | ~200 | Fine as-is, it's just data |
| `backend/routers/tts.py` | ~140 | Extract TTS mode to factory/strategy |
| `frontend/src/components/AnalyticsView.tsx` | 107 | Extract chart to its own component |

---

## MISSING THINGS THAT WILL HURT LATER

### No Error Boundary
App.tsx has no `<ErrorBoundary>`. One runtime crash in any component takes down the entire UI. Add one.

### No TypeScript Strict Mode
Check `tsconfig.json` — if `strict: true` isn't set, you're missing null checks, implicit any, and a lot of bugs that the compiler would catch for free.

### No Prop-Type / Interface Enforcement on API Responses
`lib/api.ts` casts API responses to TypeScript interfaces with no runtime validation. If the backend changes a field name, TypeScript won't catch it at runtime. The `zod` package was installed for exactly this reason but never used. Either use Zod or add basic null-checks on critical fields.

### Backend Has No Health Check Endpoint
`GET /health` doesn't exist. Frontend has no way to know if the backend is up before making requests. The graceful fallback pattern works but hides failures.

---

## SUMMARY

**Delete immediately:** `NavLink.tsx`, `use-mobile.tsx`, `instruction.txt`, Sonner import in App.tsx  
**Remove packages:** `@tanstack/react-query`, `zod`, `lovable-tagger`  
**Fix UI lies:** ProfileView voice toggle, SOSModal notify button  
**Extract shared code:** JSON parser utility, default location constant  
**Split large files:** AgentView (316 lines), Index.tsx (215 lines)  
**Add error signaling:** 7 silent API failures, 5 backend silent failures  
**Fix config:** BASE_URL to env var, TTS config cached at startup, model names in user_config.json  
