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
  App.tsx             # BrowserRouter with 3 routes: /, /test, /stats
  pages/              # home.tsx, test.tsx, stats.tsx
  components/         # stress-trainer.tsx, session-results.tsx, theme-provider.tsx
  components/ui/      # shadcn primitives (currently only button.tsx)
  hooks/              # use-sessions.ts (localStorage persistence)
  lib/                # stress.ts (word parsing), utils.ts (cn)
  data/               # words.ts (word list), groups.ts (group definitions)
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

## Testing

- Vitest, tests colocated as `*.test.ts` (`src/lib/stress.test.ts`, `src/data/words.test.ts`).
- No separate `__tests__/` dir, no coverage config.
- `words.test.ts` validates dataset integrity (every entry has stress marker, stress indices in bounds, homonyms have explanations, valid characters).

## State persistence

- Sessions stored in `localStorage` under key `nagolosy-sessions`, max 5 sessions.
- `useSessions()` hook uses `useSyncExternalStore` for reactivity.

## Deployment

- SPA deployed on Vercel: `vercel.json` rewrites all routes to `/index.html`.
- `.env*` files are gitignored (Vercel OIDC token present in local `.env.local`).
