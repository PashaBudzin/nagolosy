# nagolosy — AGENTS.md

Ukrainian word-stress training SPA ("Наголоси НМТ").

## Stack

- React 19, react-router-dom 7, Vite 8, TypeScript ~6, Bun
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin), CSS variables in `apps/web/src/index.css` via `@theme inline`
- shadcn/ui with `"style": "base-sera"` (not new-york/default), `"baseColor": "olive"`, RSC disabled
- `@base-ui/react` (not Radix) for UI primitives — e.g. `<Button>` wraps `<ButtonPrimitive>`
- `class-variance-authority` + `clsx` + `tailwind-merge` (`cn()` in `@/lib/utils`)
- Remix Icons (`@remixicon/react`), `tw-animate-css`
- Fonts: Noto Serif Variable (serif), Public Sans Variable (sans-serif)

## Commands

This is a **Turborepo monorepo** with Bun workspaces:

```sh
bun dev          # turbo: Vite dev server + Express server concurrently (HTTP + WS)
bun build        # turbo: web (tsc -b && vite build) + server (tsc emit)
bun lint         # eslint flat config across the whole repo
bun format       # prettier --write "**/*.{ts,tsx}"
bun typecheck    # turbo: web tsc -b + server tsc -p
bun test         # turbo: vitest run
bun test:watch   # turbo: vitest watch
bun preview      # turbo: vite preview (API calls need the server running)
bun start        # run the built Express server (apps/web/dist + /api)
```

Running a workspace task directly (Bun `--cwd`):

```sh
bun run --cwd apps/web dev
bun run --cwd apps/server dev
bun run --cwd apps/server start # runs the built server (serves apps/web/dist, /api and /api/ws)
```

Pre-commit hook (`.husky/pre-commit`): runs only `bun test`.

Recommended verification order for changes: `bun lint && bun typecheck && bun test`.

⚠️ **Before every push** run `bun run dev` (smoke-check that the app boots) and `bun run build`
(what the CD pipeline runs). A commit that fails `bun run build` passes the pre-commit hook but
breaks deployment. `bun typecheck` now checks both workspaces (`tsc -b` for web, `tsc -p` for
server), but `bun run build` remains the authoritative gate.
`bun build` (no `run`) invokes Bun's native bundler, NOT the npm script.

## Project structure

```
apps/
  web/                  # Vite SPA (@nagolosy/web)
    index.html
    vite.config.ts      # dev/preview proxy: /api -> http://localhost:3001 (ws: true)
    tsconfig.json       # project references (app + node configs)
    src/
      main.tsx          # entry: renders <App> inside <ThemeProvider>
      App.tsx           # BrowserRouter with routes: /, /competition, /test, /stats, /idiom-test, /idiom-stats, /history-test, /history-stats, /term-test, /term-stats, /visual-history-test, /visual-history-stats, /answers/*
      pages/            # home.tsx, competition.tsx, test.tsx, stats.tsx, idiom-test.tsx, ...
      components/       # stress-trainer.tsx, session-results.tsx, trainer-shell.tsx, competition-*.tsx, ..., theme-provider.tsx
      components/ui/    # shadcn primitives (button.tsx) + shared widgets (kbd.tsx, quiz-mode-switch.tsx)
      hooks/            # use-sessions.ts, use-idiom-sessions.ts, use-history-sessions.ts, use-term-sessions.ts, use-timer.ts, use-competition.ts
      lib/              # stress.ts, idioms.ts, history.ts, match.ts, terms.ts, competition-types.ts, competition-questions.ts, session-store.ts, session-stats.ts, format.ts, utils.ts (cn)
      data/             # words.ts, groups.ts, idioms.ts, idiom-groups.ts, history.ts, history-groups.ts, terms.ts, term-groups.ts
      types.ts          # shared types
      index.css         # Tailwind entry + CSS variables + dark mode
  server/               # Express 5 app (@nagolosy/server)
    src/app.ts          # createApp({ staticDir? }): /api/health, API 404, optional SPA serving
    src/index.ts        # Node entry: listens on PORT (default 3001), serves apps/web/dist, attaches /api/ws
    src/realtime.ts     # WebSocket room state machine: create/join/rejoin, questions, answers, scoring, leaderboard
    src/protocol.ts     # server copy of the competition wire protocol
    tsconfig.json       # typecheck (src + root api)
    tsconfig.build.json # emit to dist (for `bun run --cwd apps/server start`)
api/[...all].ts         # Vercel serverless entry: exports the Express app
api/ws.ts               # Vercel WebSocket function: exported node:http.Server + attachRealtime()
turbo.json              # task graph
vercel.json             # Vercel build/output/functions config
```

## Key conventions

- Path alias `@/` → `apps/web/src/` (configured in `apps/web/vite.config.ts` + `apps/web/tsconfig.app.json`).
- `apps/web/tsconfig.json` uses **project references** (`tsconfig.app.json` + `tsconfig.node.json`).
- `verbatimModuleSyntax: true` → use `import type` for type-only imports.
- `erasableSyntaxOnly: true` → no enums, no namespaces.
- Prettier: `semi: false`, `singleQuote: false`, `trailingComma: "es5"`, `tailwindStylesheet: "apps/web/src/index.css"`.
- Dark mode: `.dark` class on `<html>`. Pressing `d` key toggles (handled in `ThemeProvider`).
- Express app is built by `createApp()` in `apps/server/src/app.ts`, so the same code powers the
  local/Node server (`apps/server/src/index.ts`) and the Vercel function (`api/[...all].ts`).
- In dev, Vite proxies `/api` (HTTP and WebSocket upgrades) to Express on port `3001`; templates should call same-origin `/api/...`.
- Group competition protocol is duplicated: `apps/server/src/protocol.ts` and
  `apps/web/src/lib/competition-types.ts`. Update both together.
- The host browser generates questions (`apps/web/src/lib/competition-questions.ts`) from
  the normal quiz datasets and sends them to the server on `start`; the server owns timers,
  answers, scores and the leaderboard.

## Data model

- Word stress is encoded as **uppercase Ukrainian vowels** in raw strings in `words.ts` (e.g. `"агронОмія"` → stress on о).
- `parseWord()` in `apps/web/src/lib/stress.ts` converts to lowercase text + `stressIndices` (character offsets).
- Parenthetical content = explanation (e.g. `"вИгода (користь)"` → explanation `"користь"`).
- Homonyms with different stress **must** have disambiguating explanations (enforced by test in `words.test.ts`).
- Words are grouped in `apps/web/src/data/groups.ts`; not all groups are equal size (group 8 has only 23 words).
- Idioms are raw strings `"Idiom – definition"` (en-dash separator) in `idioms.ts`; `parseIdiom()` in `apps/web/src/lib/idioms.ts` splits them.
- Idiom quiz options are built by `buildQuizOptions()` in `apps/web/src/lib/idioms.ts` — correct definition + unique distractors (definitions are deduped, so near-identical idioms never collide as options).
- Idioms are grouped in `apps/web/src/data/idiom-groups.ts` (11 groups of ~22 entries).
- History facts are structured `{ date, event }` objects in `history.ts` (566 entries, e.g. `{ date: "988", event: "Запровадження..." }`); dates vary widely (single years, ranges `882–912`, months `травень 1648`, full dates `19 лютого 1861`, centuries `IX–VII ст. до н. е.`, millennia).
- History quiz options are built by `buildHistoryQuizOptions()` in `apps/web/src/lib/history.ts` — the correct date + 3 chronologically nearest unique dates (plausible distractors). `dateEpoch()` normalizes any date string to a numeric epoch for distance sorting.
- History facts are grouped by period in `apps/web/src/data/history-groups.ts` (5 parent groups named by the source table's periods, e.g. "Найдавніші часи – перша половина XVI ст."). Each parent group is split into **3 chronologically ordered subgroups** (`subgroups` array), so `HISTORY_GROUPS` covers every fact exactly once at both parent and subgroup level.
- Duplicate history events (same event text, different dates) are disambiguated by appending `(date)` to the later occurrence (e.g. "Масовий голод в Україні (1946–1947)").
- Terms are raw strings `"Term – definition"` (en-dash separator) in `terms.ts` (222 entries); `parseTerm()` in `apps/web/src/lib/terms.ts` splits them. Definitions follow the НМТ history program.
- Terms quiz options are built by `buildMatchOptions()` in `apps/web/src/lib/match.ts`; terms are grouped in `apps/web/src/data/term-groups.ts` (22 groups, 19th-century sections combined, revolution sections 21/22 kept separate).

## Shared infra

All trainers (words + idioms + history + terms) are thin wrappers around shared shells that own the common session UX:

- `apps/web/src/components/trainer-shell.tsx` — progress header, timer, ✓/✗ counts, feedback + next button. Trainers inject their question UI as `children`.
- `apps/web/src/components/session-results-shell.tsx` — results header (%, ✓/✗, time) + restart/home buttons + scrollable list; rows injected via `renderRow`.
- `apps/web/src/components/session-page.tsx` — generic trainer→results page flow: reads indices from router state, redirects to `/` when empty, saves the session on completion. `test.tsx` / `idiom-test.tsx` / `history-test.tsx` / `term-test.tsx` are thin config wrappers.
- `apps/web/src/components/stats-page.tsx` — generic stats page (sort, group/status/attempted/explanation/date filters, totals, clear). `stats.tsx` / `idiom-stats.tsx` / `history-stats.tsx` / `term-stats.tsx` are thin config wrappers; the words page alone passes an `explanation` getter to enable that filter.
- `apps/web/src/lib/match.ts` — shared two-direction match-quiz pattern (`MatchMode`, `matchPrompt`/`matchAnswer`, `buildMatchOptions(entries, correct, mode, count, distractorPool?)`). `term-trainer.tsx` restricts distractors to the **same historical group** as the correct term (so options are plausible, not obviously wrong era); the quiz direction is chosen **before** the session starts — `QuizModeSwitch` in `apps/web/src/components/ui/quiz-mode-switch.tsx` lives on the home page's terms panel and is passed to `/term-test` via router state (`termMode`). Pattern intended to be reused when idioms gain the same feature.
- `apps/web/src/lib/session-store.ts` — `createSessionStore<T>()` factory: localStorage key + max-sessions cap live here; `useSessionStore()` wraps it with `useSyncExternalStore`.
- `apps/web/src/lib/session-stats.ts` — `aggregateStats()` (seeds + sessions → per-item stats) and `pickProblematic()` (worst-ratio items, capped).
- `apps/web/src/hooks/use-timer.ts` — elapsed-milliseconds timer + `now()` callback.
- `apps/web/src/lib/format.ts` — `formatTime()` (mm:ss).

## Testing

- Vitest, tests colocated as `*.test.ts` (`apps/web/src/lib/stress.test.ts`, `apps/web/src/data/words.test.ts`, `apps/web/src/lib/idioms.test.ts`, `apps/web/src/data/idioms.test.ts`, `apps/web/src/lib/history.test.ts`, `apps/web/src/data/history.test.ts`, `apps/web/src/lib/terms.test.ts`, `apps/web/src/data/terms.test.ts`).
- No separate `__tests__/` dir, no coverage config.
- `words.test.ts` validates dataset integrity (every entry has stress marker, stress indices in bounds, homonyms have explanations, valid characters).
- `idioms.test.ts` validates dataset integrity (every entry splits into idiom + definition, no duplicate idioms, no stray whitespace).
- `history.test.ts` validates dataset integrity (566 entries, unique events, every date parseable to an epoch, groups cover all facts once); `lib/history.test.ts` checks epoch mapping and that quiz options are 4 unique dates with plausible (chronologically near) distractors.
- `terms.test.ts` validates dataset integrity (every entry splits into term + definition, no duplicate terms or definitions, groups cover all 222 entries once); `lib/terms.test.ts` checks that `buildMatchOptions()` returns 4 unique options with the correct answer in both modes.
- `lib/competition-questions.test.ts` checks that competition questions have unique options, a valid `correctIndex` and match the regular quiz answers; also verifies group filtering.

## State persistence

- Session storage settings (storage key, max sessions) are defined in `createSessionStore()` in `apps/web/src/lib/session-store.ts`.
- Word sessions stored in `localStorage` under key `nagolosy-sessions`, max 5 sessions.
- Idiom sessions stored under key `nagolosy-idiom-sessions`, max 5 sessions (separate from word sessions).
- History sessions stored under key `nagolosy-history-sessions`, max 5 sessions (separate from word/idiom sessions).
- Term sessions stored under key `nagolosy-term-sessions`, max 5 sessions (separate from word/idiom/history sessions).
- `useSessions()` / `useIdiomSessions()` / `useHistorySessions()` / `useTermSessions()` hooks use `useSyncExternalStore` for reactivity.

## Deployment

- Vercel project root is the repo root. `vercel.json` sets:
  - `buildCommand: bun run build` (Turborepo builds both workspaces), `outputDirectory: apps/web/dist`
  - `api/[...all].ts` as a Node serverless function behind `/api/*` (runtime auto-detected; do not set `runtime` without a version)
  - `api/ws.ts` exports a `node:http.Server` for `/api/ws` WebSockets (Vercel Fluid compute)
  - SPA fallback rewrite to `/index.html` (filesystem + function routes take precedence)
- On Vercel the SPA is served from the CDN; the Express app runs only as the `/api` function.
- Self-hosting the Node server: `bun run build` then `bun run --cwd apps/server start` —
  Express serves `apps/web/dist` plus `/api` and hosts the `/api/ws` competition rooms.
- Vercel Functions serve WebSockets on Fluid compute (default for projects created
  after 2025-04-23) through `api/ws.ts`. A reconnect may land on a different
  instance, so in-memory rooms are only shared within one instance; use an
  external store (e.g. Redis) for cross-instance rooms. `VITE_WS_URL` can point the
  SPA at a remote WS host.
- `.env*` files are gitignored (Vercel OIDC token present in local `.env.local`).
