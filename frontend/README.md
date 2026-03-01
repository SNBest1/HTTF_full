# ConnectAble Frontend

A React SPA communication board for the ConnectAble AAC system. Users press symbol buttons to build sentences, which are spoken aloud and logged for personalised AI predictions.

## Features

- **66-button AAC grid** — 5 semantic categories (food, feelings, actions, places, people), emoji + label per button
- **Real-time AI suggestions** — debounced calls to the backend prediction API; falls back to browser `speechSynthesis` and hardcoded defaults if backend is unavailable
- **Agent chat** — natural language input with intent-based action cards (make call, order food, set reminder, general chat)
- **Analytics dashboard** — word frequency heatmap and bar chart from logged phrase history
- **Accessibility settings** — dark theme, dyslexia font, high contrast mode
- **SOS modal** — one-tap emergency call

## Quick start

```bash
npm install
npm run dev       # starts on http://localhost:8080
```

The UI works standalone without the backend — all API calls have graceful fallbacks.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 8080 |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Run tests once (vitest) |
| `npm run test:watch` | Run tests in watch mode |

## Directory structure

```
src/
├── pages/
│   ├── Index.tsx          # Root page — all app state, orchestrates tabs and API calls
│   └── NotFound.tsx       # 404 page
├── components/
│   ├── AACGrid.tsx        # 11×6 symbol button grid
│   ├── SuggestionRow.tsx  # Horizontal suggestion pills
│   ├── TopBar.tsx         # Location, time, settings, SOS
│   ├── BottomBar.tsx      # Sentence bar, backspace, speak, send-to-agent
│   ├── NavTabs.tsx        # 4-tab bottom navigation
│   ├── AnalyticsView.tsx  # Heatmap + bar chart + summary
│   ├── ProfileView.tsx    # User profile + voice mode
│   ├── AgentView.tsx      # Reminders + agent chat with action cards
│   ├── SOSModal.tsx       # Emergency modal
│   ├── SettingsMenu.tsx   # Theme/font/contrast toggles
│   └── ui/                # shadcn/ui primitives
├── lib/
│   ├── api.ts             # All backend API calls with fallbacks
│   ├── aac-data.ts        # 66 button definitions + category colours
│   └── utils.ts           # clsx/cn helpers
├── hooks/
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── test/
│   ├── example.test.ts
│   └── setup.ts
└── index.css              # CSS variables (dark theme), custom utility classes
```

## Tech stack

- React 18, TypeScript, Vite 5
- Tailwind CSS 3 + shadcn/ui
- Recharts (analytics charts)
- Lucide React (icons)
- TanStack Query (server state)
- Vitest + jsdom (tests)
- Zod (validation)
