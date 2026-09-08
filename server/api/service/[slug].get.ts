// GET /api/service/[slug] — public
import { getDb } from "../../utils/db"
import { mapServiceRow } from "../../utils/services"

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const db   = await getDb()
  const row  = await db.prepare("SELECT * FROM service_pages WHERE slug = ?").get(slug) as any
  if (!row) throw createError({ statusCode: 404, message: "Sayfa bulunamadı." })
  return mapServiceRow(row)
})
