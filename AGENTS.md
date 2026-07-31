# nagolosy — AGENTS.md

Ukrainian word-stress training SPA ("Наголоси НМТ").

## Stack

- React 19, react-router-dom 7, Vite 8, TypeScript ~6, Bun
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin), CSS variables in `src/index.css` via `@theme inline`
- shadcn/ui with `"style": "base-sera"` (not new-york/default), `"baseColor": "olive"`, RSC disabled
- `@base-ui/react` (not Radix) for UI primitives — e.g. `<Button>` wraps `<ButtonPrimitive>`
- `class-variance-authority` + `clsx` + `tailwind-merge` (`cn()` in `@/lib/utils`)
- Remix Icons (`@remixicon/react`), `tw-animate-css`
- Fonts: Noto Serif Variable (serif), Public Sans Variable (sans-serif)

## Commands

```sh
bun dev          # vite dev server
bun build        # tsc -b && vite build (project references: app + node configs)
bun lint         # eslint flat config (ts, tsx)
bun format       # prettier --write "**/*.{ts,tsx}"
bun typecheck    # tsc --noEmit
bun test         # vitest run
bun test:watch   # vitest
bun preview      # vite preview
```

Pre-commit hook (`.husky/pre-commit`): runs only `bun test`.

Recommended verification order for changes: `bun lint && bun typecheck && bun test`.

## Project structure

```
src/
  main.tsx            # entry: renders <App> inside <ThemeProvider>
  App.tsx             # BrowserRouter with 5 routes: /, /test, /stats, /idiom-test, /idiom-stats
  pages/              # home.tsx, test.tsx, stats.tsx, idiom-test.tsx, idiom-stats.tsx
  components/         # stress-trainer.tsx, session-results.tsx, idiom-trainer.tsx, idiom-session-results.tsx, trainer-shell.tsx, session-results-shell.tsx, session-page.tsx, stats-page.tsx, theme-provider.tsx
  components/ui/      # shadcn primitives (currently only button.tsx)
  hooks/              # use-sessions.ts, use-idiom-sessions.ts (localStorage persistence), use-timer.ts
  lib/                # stress.ts (word parsing), idioms.ts (idiom parsing + quiz options), session-store.ts, session-stats.ts, format.ts, utils.ts (cn)
  data/               # words.ts (word list), groups.ts (group definitions), idioms.ts (idiom list), idiom-groups.ts (idiom group definitions)
  types.ts            # shared types
  index.css           # Tailwind entry + CSS variables + dark mode
```

## Key conventions

- Path alias `@/` → `./src/` (configured in both Vite and tsconfig).
- `tsconfig.json` uses **project references** (`tsconfig.app.json` + `tsconfig.node.json`).
- `verbatimModuleSyntax: true` → use `import type` for type-only imports.
- `erasableSyntaxOnly: true` → no enums, no namespaces.
- Prettier: `semi: false`, `singleQuote: false`, `trailingComma: "es5"`, `tailwindStylesheet: "src/index.css"`.
- Dark mode: `.dark` class on `<html>`. Pressing `d` key toggles (handled in `ThemeProvider`).

## Data model

- Word stress is encoded as **uppercase Ukrainian vowels** in raw strings in `words.ts` (e.g. `"агронОмія"` → stress on о).
- `parseWord()` in `src/lib/stress.ts` converts to lowercase text + `stressIndices` (character offsets).
- Parenthetical content = explanation (e.g. `"вИгода (користь)"` → explanation `"користь"`).
- Homonyms with different stress **must** have disambiguating explanations (enforced by test in `words.test.ts`).
- Words are grouped in `src/data/groups.ts`; not all groups are equal size (group 8 has only 23 words).
- Idioms are raw strings `"Idiom – definition"` (en-dash separator) in `idioms.ts`; `parseIdiom()` in `src/lib/idioms.ts` splits them.
- Idiom quiz options are built by `buildQuizOptions()` in `src/lib/idioms.ts` — correct definition + unique distractors (definitions are deduped, so near-identical idioms never collide as options).
- Idioms are grouped in `src/data/idiom-groups.ts` (11 groups of ~22 entries).

## Shared infra

Both trainers (words + idioms) are thin wrappers around shared shells that own the common session UX:

- `src/components/trainer-shell.tsx` — progress header, timer, ✓/✗ counts, feedback + next button. Trainers inject their question UI as `children`.
- `src/components/session-results-shell.tsx` — results header (%, ✓/✗, time) + restart/home buttons + scrollable list; rows injected via `renderRow`.
- `src/components/session-page.tsx` — generic trainer→results page flow: reads indices from router state, redirects to `/` when empty, saves the session on completion. `test.tsx` / `idiom-test.tsx` are thin config wrappers.
- `src/components/stats-page.tsx` — generic stats page (sort, group/status/attempted/explanation/date filters, totals, clear). `stats.tsx` / `idiom-stats.tsx` are thin config wrappers; the words page alone passes an `explanation` getter to enable that filter.
- `src/lib/session-store.ts` — `createSessionStore<T>()` factory: localStorage key + max-sessions cap live here; `useSessionStore()` wraps it with `useSyncExternalStore`.
- `src/lib/session-stats.ts` — `aggregateStats()` (seeds + sessions → per-item stats) and `pickProblematic()` (worst-ratio items, capped).
- `src/hooks/use-timer.ts` — elapsed-milliseconds timer + `now()` callback.
- `src/lib/format.ts` — `formatTime()` (mm:ss).

## Testing

- Vitest, tests colocated as `*.test.ts` (`src/lib/stress.test.ts`, `src/data/words.test.ts`, `src/lib/idioms.test.ts`, `src/data/idioms.test.ts`).
- No separate `__tests__/` dir, no coverage config.
- `words.test.ts` validates dataset integrity (every entry has stress marker, stress indices in bounds, homonyms have explanations, valid characters).
- `idioms.test.ts` validates dataset integrity (every entry splits into idiom + definition, no duplicate idioms, no stray whitespace).

## State persistence

- Session storage settings (storage key, max sessions) are defined in `createSessionStore()` in `src/lib/session-store.ts`.
- Word sessions stored in `localStorage` under key `nagolosy-sessions`, max 5 sessions.
- Idiom sessions stored under key `nagolosy-idiom-sessions`, max 5 sessions (separate from word sessions).
- `useSessions()` / `useIdiomSessions()` hooks use `useSyncExternalStore` for reactivity.

## Deployment

- SPA deployed on Vercel: `vercel.json` rewrites all routes to `/index.html`.
- `.env*` files are gitignored (Vercel OIDC token present in local `.env.local`).
