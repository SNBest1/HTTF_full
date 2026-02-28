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

This is a **speak-easy AAC (Augmentative and Alternative Communication)** app — a symbol-based communication board for users who have difficulty speaking. It is a Vite + React + TypeScript SPA scaffolded via Lovable.

### Data flow

All state lives in `src/pages/Index.tsx`. The page manages the current sentence being built, the AI suggestions shown at the top, and the active navigation tab. It coordinates three async operations via `src/lib/api.ts`:

- `fetchSuggestions(location, time)` — calls `GET /suggestions` on a backend at `http://localhost:8000`; falls back to hardcoded defaults
- `speakText(text)` — calls `POST /speak`; falls back to browser `speechSynthesis` API
- `logPhrase(phrase)` — calls `POST /log_phrase` silently (fire-and-forget)
- `fetchHeatmap()` — calls `GET /analytics/heatmap`; falls back to mock data

The backend at `localhost:8000` is a separate service not in this repo. All API calls have graceful fallbacks so the UI functions without it.

### AAC board

`src/lib/aac-data.ts` defines the static grid of 66 buttons across 5 categories (`food`, `feelings`, `actions`, `places`, `people`). Each button has an emoji and a label. Category colors are defined as custom Tailwind tokens (`cat-food`, `cat-feelings`, etc.) and mapped in CSS variables in `src/index.css`.

`src/components/AACGrid.tsx` renders the buttons in an 11-column × 6-row CSS grid. Pressing a button calls `onButtonPress(label)`, appending the word to the sentence in `Index.tsx`.

### Navigation tabs

Three tabs managed by `TabId` in `src/components/NavTabs.tsx`:
- **AAC Board** (`aac`) — main communication grid
- **Analytics** (`analytics`) — vocabulary heatmap and bar chart via Recharts
- **Profile** (`profile`) — placeholder view

### Styling conventions

The app uses a **dark theme only** — CSS variables are defined only for dark mode (no `[data-theme=dark]` toggle). All color tokens are HSL-based CSS variables. Custom tokens beyond shadcn defaults include:
- `--cat-{food,feelings,actions,places,people}` and `--cat-{category}-bg` — AAC category colors
- `--speak` / `--speak-foreground` — speak button
- `--suggestion` / `--suggestion-foreground` — suggestion pills
- `--sentence-bg` — sentence display bar

Custom utility classes `.aac-grid-btn`, `.suggestion-pill`, `.speak-pulse`, `.animate-fade-in` are defined in `src/index.css`.

The `@` alias resolves to `src/`, so imports use `@/components/...`, `@/lib/...`, etc.

### UI components

`src/components/ui/` contains shadcn/ui primitives. Prefer using these existing components rather than raw HTML elements. New shadcn components can be added via `bunx shadcn@latest add <component>`.
