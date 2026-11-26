# Наголоси НМТ

Ukrainian word-stress training SPA, organised as a Turborepo monorepo.

```
apps/web      Vite + React SPA
apps/server   Express server (API + optional static SPA serving)
api/          Vercel serverless entry for the Express app
```

## Development

```bash
bun install
bun dev        # Vite on :5173, Express on :3001 (Vite proxies /api)
```

## Build and run

```bash
bun run build  # build web + server
bun start      # Express serves apps/web/dist and /api on :3001
```

## Deploy

Deployed on Vercel from the repo root: static SPA output from `apps/web/dist` plus the
Express app as an `@vercel/node` function under `/api`. See `vercel.json` and `AGENTS.md`.
