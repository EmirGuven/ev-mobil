// GET /api/blog-page — public
import { getDb } from "../utils/db"

export default defineEventHandler(async () => {
  const db  = await getDb()
  const row = await db.prepare("SELECT * FROM blog_page WHERE id = 1").get() as any
  if (!row) return {}
  return {
    heroEyebrow: row.hero_eyebrow,
    heroTitle:   row.hero_title,
    heroLead:    row.hero_lead,
    heroBgImage: row.hero_bg_image || '',
  }
})
