import { setHeader } from "h3"

export default defineEventHandler((event) => {
  setHeader(event, "content-type", "text/plain; charset=utf-8")

  return [
    "ok",
    `service=frontend`,
    `timestamp=${new Date().toISOString()}`,
    `uptime=${Math.round(process.uptime())}`,
  ].join("\n")
})