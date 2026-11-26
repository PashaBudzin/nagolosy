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
bun dev        # Vite on :5173, Express on :3001 (Vite proxies /api, including WebSockets)
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

The WebSocket endpoint is `/api/ws` (override with `VITE_WS_URL` if it lives on
another host). In development Vite proxies it to Express on `:3001`; on Vercel it
is served by the `api/ws.ts` Function. Rooms live in server memory and are removed
when empty.

> Vercel Functions support WebSockets on Fluid compute (enabled by default for
> projects created after 2025-04-23). Because a reconnect can land on a different
> instance, in-memory rooms are only shared between clients pinned to the same
> instance. Use an external store (for example Redis) for cross-instance rooms.

## Build and run

```bash
bun run build  # build web + server
bun start      # Express serves apps/web/dist and /api on :3001
bun demo       # build + start in one command (production-style demo)
```

## Deploy

Deployed on Vercel from the repo root: static SPA output from `apps/web/dist`,
`api/[...all].ts` for HTTP `/api/*`, and `api/ws.ts` for `/api/ws` WebSockets.
See `vercel.json` and `AGENTS.md`.
