import { createServer } from "node:http"
import { createApp } from "../apps/server/src/app.ts"
import { attachRealtime } from "../apps/server/src/realtime.ts"

// Vercel Functions can serve WebSockets by exporting the underlying Node HTTP
// server (see https://vercel.com/docs/functions/websockets). This function is
// served at `/api/ws`; the standalone Node server uses the same path.
const app = createApp()
const server = createServer(app)

attachRealtime(server)

export default server
