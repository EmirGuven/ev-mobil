// GET /api/stories — public, sadece aktif storyler, sıralı
import { getDb } from "../utils/db"

export default defineEventHandler(async () => {
  const db = await getDb()
  const rows = await db.prepare(
    "SELECT id, title, image, link_label, link_url, created_at FROM stories WHERE active = 1 ORDER BY sort_order ASC, id ASC"
  ).all()
  return rows
})
