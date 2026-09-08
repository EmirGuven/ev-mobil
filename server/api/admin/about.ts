// GET + PUT /api/admin/about
import { getDb } from "../../utils/db"
import { verifyToken, parseCookies } from "../../utils/auth"
import { aboutCtaDefaults, CTA_HIDDEN_VALUE } from "../../../utils/page-cta"

async function checkAuth(event: any) {
  const cookies = parseCookies(getHeader(event, "cookie") || null)
  const token = cookies.admin_token
  if (!token) throw createError({ statusCode: 401, message: "Yetkisiz erişim." })
  const payload = await verifyToken(token)
  if (!payload) throw createError({ statusCode: 401, message: "Oturum süresi doldu." })
}

export default defineEventHandler(async (event) => {
  await checkAuth(event)
  const db = await getDb()

  if (event.method === "GET") {
    const row = await db.prepare("SELECT * FROM about_page WHERE id = 1").get() as any
    if (!row) return {}
    return {
      ...row,
      cta_primary_label: row.cta_primary_label || aboutCtaDefaults.primaryLabel,
      cta_primary_url: row.cta_primary_url || aboutCtaDefaults.primaryUrl,
      cta_secondary_label: row.cta_secondary_label === CTA_HIDDEN_VALUE ? "" : (row.cta_secondary_label || aboutCtaDefaults.secondaryLabel),
      cta_secondary_url: row.cta_secondary_label === CTA_HIDDEN_VALUE ? "" : (row.cta_secondary_url || aboutCtaDefaults.secondaryUrl),
    }
  }

  if (event.method === "PUT") {
    const body = await readBody(event)
    const stringify = (v: any) => typeof v === "string" ? v : JSON.stringify(v ?? [])
    const secondaryHidden = !String(body.cta_secondary_label || "").trim()

    await db.prepare(`
      UPDATE about_page SET
        hero_eyebrow = ?, hero_title = ?, hero_lead = ?, hero_bg_image = ?, photo_url = ?,
        bio_title = ?, bio_paragraphs = ?, bio_badge_value = ?, bio_badge_label = ?, specialties = ?,
        hero_badges = ?,
        timeline = ?, approach_title = ?, approach_lead = ?, approach_values = ?,
        cta_title = ?, cta_text = ?, cta_bg_image = ?,
        cta_primary_label = ?, cta_primary_url = ?, cta_secondary_label = ?, cta_secondary_url = ?
      WHERE id = 1
    `).run(
      body.hero_eyebrow   || '',
      body.hero_title     || '',
      body.hero_lead      || '',
      body.hero_bg_image  || '',
      body.photo_url      || '',
      body.bio_title      || '',
      stringify(body.bio_paragraphs),
      body.bio_badge_value || '',
      body.bio_badge_label || '',
      stringify(body.specialties),
      stringify(body.hero_badges),
      stringify(body.timeline),
      body.approach_title || '',
      body.approach_lead  || '',
      stringify(body.approach_values),
      body.cta_title      || '',
      body.cta_text       || '',
      body.cta_bg_image   || '',
      body.cta_primary_label || aboutCtaDefaults.primaryLabel,
      body.cta_primary_url || aboutCtaDefaults.primaryUrl,
      secondaryHidden ? CTA_HIDDEN_VALUE : (body.cta_secondary_label || aboutCtaDefaults.secondaryLabel),
      secondaryHidden ? CTA_HIDDEN_VALUE : (body.cta_secondary_url || aboutCtaDefaults.secondaryUrl),
    )
    return { success: true }
  }
})
