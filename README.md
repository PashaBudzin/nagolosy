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
bun dev        # Vite on :5173, Express on :3001 (Vite proxies /api and /ws)
```

## Group competition

Open `/competition` (or the **Змагання в групі** button on the home page) to play a
live quiz with **2–10 players**:

- Create a room (you become the host) or join with the 4-character code / invite link.
- The host picks a topic (word stress, idioms, history dates or terms), a group,
  the number of questions and the time per question.
- The server sends the same questions to everyone, collects answers within the
  time limit and awards points for correctness and speed. Reveals and a live
  leaderboard are broadcast to the whole room.

The WebSocket endpoint is `/ws` (override with `VITE_WS_URL` if it lives on
another host). In development Vite proxies it to Express on `:3001`. Rooms live
in server memory and are removed when empty.

> Vercel Functions only handle HTTP requests, so the real-time competition needs
> the Node server (`bun dev` / `bun start`) or a separate WebSocket host. The
> static SPA and `/api` function still deploy normally.

## Build and run

```bash
bun run build  # build web + server
bun start      # Express serves apps/web/dist and /api on :3001
bun demo       # build + start in one command (production-style demo)
```

## Deploy

Deployed on Vercel from the repo root: static SPA output from `apps/web/dist` plus the
Express app as an `@vercel/node` function under `/api`. See `vercel.json` and `AGENTS.md`.
