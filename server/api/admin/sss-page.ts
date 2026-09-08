// GET + PUT /api/admin/sss-page
import { getDb } from "../../utils/db"
import { verifyToken, parseCookies } from "../../utils/auth"
import { CTA_HIDDEN_VALUE, faqCtaDefaults } from "../../../utils/page-cta"

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
    const row = await db.prepare("SELECT * FROM sss_page WHERE id = 1").get() as any
    if (!row) return {}
    return {
      heroEyebrow : row.hero_eyebrow  || '',
      heroTitle   : row.hero_title    || '',
      heroLead    : row.hero_lead     || '',
      heroBgImage : row.hero_bg_image || '',
      ctaTitle    : row.cta_title     || '',
      ctaLead     : row.cta_lead      || '',
      ctaBgImage  : row.cta_bg_image  || '',
      ctaPrimaryLabel: row.cta_primary_label || faqCtaDefaults.primaryLabel,
      ctaPrimaryUrl: row.cta_primary_url || faqCtaDefaults.primaryUrl,
      ctaSecondaryLabel: row.cta_secondary_label === CTA_HIDDEN_VALUE ? "" : (row.cta_secondary_label || faqCtaDefaults.secondaryLabel),
      ctaSecondaryUrl: row.cta_secondary_label === CTA_HIDDEN_VALUE ? "" : (row.cta_secondary_url || faqCtaDefaults.secondaryUrl),
    }
  }

  if (event.method === "PUT") {
    const body = await readBody(event)
    const secondaryLabel = body.ctaSecondaryLabel ?? body.cta_secondary_label ?? ""
    const secondaryUrl = body.ctaSecondaryUrl ?? body.cta_secondary_url ?? ""
    const secondaryHidden = !String(secondaryLabel || "").trim()
    // camelCase ve snake_case body'nin ikisini de destekle
    await db.prepare(`UPDATE sss_page SET hero_eyebrow=?, hero_title=?, hero_lead=?, hero_bg_image=?, cta_title=?, cta_lead=?, cta_bg_image=?, cta_primary_label=?, cta_primary_url=?, cta_secondary_label=?, cta_secondary_url=? WHERE id=1`)
      .run(
        body.heroEyebrow  ?? body.hero_eyebrow  ?? '',
        body.heroTitle    ?? body.hero_title     ?? '',
        body.heroLead     ?? body.hero_lead      ?? '',
        body.heroBgImage  ?? body.hero_bg_image  ?? '',
        body.ctaTitle     ?? body.cta_title      ?? '',
        body.ctaLead      ?? body.cta_lead       ?? '',
        body.ctaBgImage   ?? body.cta_bg_image   ?? '',
        body.ctaPrimaryLabel ?? body.cta_primary_label ?? faqCtaDefaults.primaryLabel,
        body.ctaPrimaryUrl ?? body.cta_primary_url ?? faqCtaDefaults.primaryUrl,
        secondaryHidden ? CTA_HIDDEN_VALUE : (secondaryLabel || faqCtaDefaults.secondaryLabel),
        secondaryHidden ? CTA_HIDDEN_VALUE : (secondaryUrl || faqCtaDefaults.secondaryUrl),
      )
    return { success: true }
  }
})
