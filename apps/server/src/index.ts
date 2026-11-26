import path from "node:path"
import { fileURLToPath } from "node:url"

import { createApp } from "./app.ts"
import { attachRealtime } from "./realtime.ts"

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const staticDir =
  process.env.STATIC_DIR ?? path.resolve(currentDir, "../../web/dist")
const port = Number(process.env.PORT ?? 3001)

const app = createApp({ staticDir })

const server = app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})

attachRealtime(server)
