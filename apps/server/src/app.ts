import express, { type Express } from "express"
import fs from "node:fs"
import path from "node:path"

export interface CreateAppOptions {
  /** Directory containing the built Vite app. Omit to serve the API only. */
  staticDir?: string
}

export function createApp(options: CreateAppOptions = {}): Express {
  const app = express()

  app.disable("x-powered-by")
  app.use(express.json())

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() })
  })

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" })
  })

  if (options.staticDir) {
    const indexPath = path.join(options.staticDir, "index.html")

    if (fs.existsSync(indexPath)) {
      app.use(express.static(options.staticDir, { index: false }))

      app.use((req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next()
        res.sendFile(indexPath)
      })
    }
  }

  return app
}
