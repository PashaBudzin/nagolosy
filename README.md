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

## НМТ пробні тести

Open `/nmt-tests` (or the **НМТ пробні тести** button on the home page) to browse
shortened practice sets built from past ЗНО/НМТ exams (226 sets across six
subjects: Ukrainian language, Ukrainian literature, history, geography, math and
English). Ukrainian language and literature are separate subjects. Pick a
subject from the dropdown, choose a year and variant, then work through every
question with question navigation, flags and a timer. Results include a
per-question review. Data lives in `apps/web/src/data/nmt-*.ts`
(lazy-loaded per subject) and is regenerated with:

```bash
bun run apps/web/scripts/generate-nmt-tests.ts
bun run apps/web/scripts/generate-nmt-english.ts
```

Because only text-only single/multi-choice tasks are kept, these are **shortened
practice sets**, not complete exam forms — each row shows `kept/original` task
counts. Use the **Швидка сесія** buttons for a quick random 10/20/30-question
session. The same question pools are available in group competitions under the
**НМТ тести** category.

Sources and licences are listed on the `/credits` page (linked from the home
page and the exam browser).

> **Licence notice:** the questions come from the
> [ZNO-Eval](https://huggingface.co/datasets/NLPForUA/zno-eval) dataset. The
> maintainers license only their annotations (CC BY 4.0) and explicitly grant **no
> rights** to the exam content itself, which was created for УЦОЯО. Keep the
> attribution shown in the UI, and obtain permission from the rights holders (or
> confirm an applicable educational-use exception) before publishing this content
> in a public product.

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
