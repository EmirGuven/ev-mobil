import { setResponseStatus } from "h3"
import { getDb } from "../utils/db"

export default defineEventHandler(async (event) => {
  try {
    const db = await getDb()
    await db.prepare("SELECT 1 AS ok").get()

    return {
      status: "ok",
      service: "backend",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      database: "ok",
    }
  } catch (error) {
    setResponseStatus(event, 503)

    return {
      status: "error",
      service: "backend",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      database: "error",
      message: error instanceof Error ? error.message : "Unknown database error",
    }
  }
})