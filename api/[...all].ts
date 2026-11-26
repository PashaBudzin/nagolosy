import { createApp } from "../apps/server/src/app.ts"

// Vercel runs this as a serverless function. The catch-all filename keeps the
// original `/api/...` URL, which Express routes directly.
const app = createApp()

export default app
