// GET /api/services-page — public
import { getDb } from "../utils/db"

export default defineEventHandler(async () => {
  const db  = await getDb()
  const row = await db.prepare("SELECT * FROM services_page WHERE id = 1").get() as any
  if (!row) return {}
  return {
    heroEyebrow: row.hero_eyebrow,
    heroTitle:   row.hero_title,
    heroLead:    row.hero_lead,
    heroBgImage: row.hero_bg_image || '',
    introTitle:  row.intro_title,
    introLead:   row.intro_lead,
    ctaTitle:    row.cta_title,
    ctaLead:     row.cta_lead,
    ctaBgImage:  row.cta_bg_image || '',
  }
})
