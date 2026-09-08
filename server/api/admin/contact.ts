// GET + PUT /api/admin/contact
import { getDb } from "../../utils/db"
import { verifyToken, parseCookies } from "../../utils/auth"
import { CTA_HIDDEN_VALUE, getContactCtaDefaults } from "../../../utils/page-cta"

function extractEmail(value: any) {
  const text = String(value || "").trim()
  const normalized = text.startsWith("mailto:") ? text.slice(7) : text
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : ""
}

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
    const row = await db.prepare("SELECT * FROM contact_page WHERE id = 1").get() as any
    if (!row) return {}

    const siteRow = await db.prepare("SELECT phone, email FROM site_settings WHERE id = 1").get() as any
    const defaults = getContactCtaDefaults(siteRow?.email || "", siteRow?.phone || "")
    const pageEmail = row.contact_email || extractEmail(row.cta_primary_url) || siteRow?.email || ""

    return {
      ...row,
      email: pageEmail,
      cta_primary_label: row.cta_primary_label || defaults.primaryLabel,
      cta_primary_url: row.cta_primary_url || defaults.primaryUrl,
      cta_secondary_label: row.cta_secondary_label === CTA_HIDDEN_VALUE ? "" : (row.cta_secondary_label || defaults.secondaryLabel),
      cta_secondary_url: row.cta_secondary_label === CTA_HIDDEN_VALUE ? "" : (row.cta_secondary_url || defaults.secondaryUrl),
    }
  }

  if (event.method === "PUT") {
    const body = await readBody(event)
    const secondaryHidden = !String(body.cta_secondary_label || "").trim()
    const bodyCtaPrimaryUrl = String(body.cta_primary_url || "").trim()
    const ctaEmail = extractEmail(bodyCtaPrimaryUrl)
    const email = String(body.email || ctaEmail || "").trim()
    const currentSiteRow = await db.prepare("SELECT email FROM site_settings WHERE id = 1").get() as any
    const currentEmail = String(currentSiteRow?.email || "").trim()
    const ctaPrimaryUrl =
      ctaEmail
        ? `mailto:${ctaEmail}`
        : bodyCtaPrimaryUrl === "" || bodyCtaPrimaryUrl === `mailto:${currentEmail}`
        ? (email ? `mailto:${email}` : "")
        : bodyCtaPrimaryUrl

    await db.prepare(`
      UPDATE site_settings
      SET email = ?
      WHERE id = 1
    `).run(email)

    await db.prepare(`
      UPDATE contact_page SET
        hero_eyebrow  = ?,
        hero_title    = ?,
        hero_lead     = ?,
        hero_bg_image = ?,
        info_title    = ?,
        info_lead     = ?,
        contact_email = ?,
        form_title    = ?,
        form_lead     = ?,
        cta_title     = ?,
        cta_lead      = ?,
        cta_bg_image  = ?,
        cta_primary_label = ?,
        cta_primary_url = ?,
        cta_secondary_label = ?,
        cta_secondary_url = ?
      WHERE id = 1
    `).run(
      body.hero_eyebrow  || '',
      body.hero_title    || '',
      body.hero_lead     || '',
      body.hero_bg_image || '',
      body.info_title    || '',
      body.info_lead     || '',
      email,
      body.form_title    || '',
      body.form_lead     || '',
      body.cta_title     || '',
      body.cta_lead      || '',
      body.cta_bg_image  || '',
      body.cta_primary_label || 'E-posta Gönder',
      ctaPrimaryUrl,
      secondaryHidden ? CTA_HIDDEN_VALUE : (body.cta_secondary_label || 'Telefon Et'),
      secondaryHidden ? CTA_HIDDEN_VALUE : (body.cta_secondary_url || '')
    )
    return { success: true }
  }
})
