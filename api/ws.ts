import { createServer } from "node:http"
import { attachRealtime } from "../apps/server/dist/realtime.js"

// Vercel Functions serve WebSockets when the default export is a Node HTTP
// server. See https://vercel.com/docs/functions/websockets.
const server = createServer((_req, res) => {
  res.statusCode = 404
  res.end("Not found")
})

attachRealtime(server)

export default server
