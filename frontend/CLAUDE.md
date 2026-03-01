# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun run dev          # Start dev server on port 8080

# Build
bun run build        # Production build
bun run build:dev    # Development build
bun run preview      # Preview production build

# Code quality
bun run lint         # ESLint

# Testing
bun run test         # Run tests once (vitest)
bun run test:watch   # Run tests in watch mode
```

To run a single test file: `bunx vitest run src/test/example.test.ts`

## Architecture

This is a **ConnectAble AAC (Augmentative and Alternative Communication)** app — a symbol-based communication board. It is a Vite + React + TypeScript SPA.

### Data flow

All state lives in `src/pages/Index.tsx`. The page manages the current sentence being built, AI suggestions, active tab, settings, and pending agent messages. It coordinates async operations via `src/lib/api.ts`:

| Function | Endpoint | Fallback |
|---|---|---|
| `fetchSuggestions(location, partial)` | `GET /suggestions` | Hardcoded defaults |
| `fetchLLMSuggest(partial, location)` | `POST /llm_suggest` | — |
| `speakText(text)` | `POST /speak` | Browser `speechSynthesis` |
| `logPhrase(phrase, location)` | `POST /log_phrase` | Silent fail |
| `logAccepted(suggestion)` | `POST /autocomplete/accepted` | Silent fail |
| `logDismissed(suggestion)` | `POST /autocomplete/dismissed` | Silent fail |
| `fetchAnalyticsSummary()` | `GET /analytics/summary` | Zero-state defaults |
| `fetchHeatmap()` | `GET /analytics/heatmap` | 20 mock words |
| `sendAgentMessage(message, location)` | `POST /agent` | — |
| `fetchReminders()` | `GET /reminders` | — |

### Navigation tabs

Four tabs managed by `TabId` in `src/components/NavTabs.tsx`:
- **AAC Board** (`aac`) — main 66-button communication grid
- **Analytics** (`analytics`) — heatmap + bar chart + summary stats
- **Profile** (`profile`) — user settings (voice mode, dyslexia font, etc.)
- **Agent** (`agent`) — natural language chat with intent-based action cards

### AAC board

`src/lib/aac-data.ts` defines 66 buttons across 5 categories (`food`, `feelings`, `actions`, `places`, `people`). Each button has an emoji and a label.

`src/components/AACGrid.tsx` renders them in an 11-column × 6-row CSS grid. Pressing a button calls `onButtonPress(label)`, which appends the word to the sentence in `Index.tsx`.

Suggestions update in real time with a 400ms debounce on sentence changes. Tapping a suggestion pill calls `logAccepted()` before appending the text.

### Agent flow

From the AAC board, the BottomBar "Send to Agent" button sets `pendingAgentMessage` in `Index.tsx`, which switches to the `agent` tab and auto-sends the message to `AgentView`. The agent returns structured `AgentResponse` with `action_type` (`make_call`, `order_food`, `set_reminder`, `general_chat`) rendered as inline action cards.

### Styling conventions

The app uses a **dark theme only** — CSS variables defined in `src/index.css` with no light-mode toggle. All color tokens are HSL-based CSS variables. Custom tokens beyond shadcn defaults:
- `--cat-{food,feelings,actions,places,people}` and `--cat-{category}-bg` — AAC category colors
- `--speak` / `--speak-foreground` — speak button
- `--suggestion` / `--suggestion-foreground` — suggestion pills
- `--sentence-bg` — sentence display bar

Custom utility classes `.aac-grid-btn`, `.suggestion-pill`, `.speak-pulse`, `.animate-fade-in` are defined in `src/index.css`.

The `@` alias resolves to `src/`, so imports use `@/components/...`, `@/lib/...`, etc.

### Component responsibilities

| Component | Role |
|---|---|
| `AACGrid.tsx` | 11×6 CSS grid of 66 AAC symbol buttons |
| `SuggestionRow.tsx` | Horizontally scrollable pill row; staggered fade-in animation |
| `TopBar.tsx` | Location + time display, settings button, SOS trigger |
| `BottomBar.tsx` | Sentence input, backspace, clear, send-to-agent, speak button |
| `NavTabs.tsx` | 4-tab bottom navigation (aac, analytics, profile, agent) |
| `AnalyticsView.tsx` | Word frequency heatmap (top 50), bar chart (top 5), summary stats |
| `ProfileView.tsx` | Avatar, voice mode toggle, usage stats |
| `AgentView.tsx` | Reminders list, suggestion shortcuts, chat interface with action cards |
| `SOSModal.tsx` | Emergency modal — call 911 + notify contacts |
| `SettingsMenu.tsx` | Dropdown with dark/light theme, dyslexia font, high contrast toggles |

### UI components

`src/components/ui/` contains shadcn/ui primitives. Prefer using these existing components rather than raw HTML elements. New shadcn components can be added via `bunx shadcn@latest add <component>`.
