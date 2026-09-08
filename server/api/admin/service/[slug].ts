// GET + PUT /api/admin/service/[slug]
import { getDb } from "../../../utils/db"
import { verifyToken, parseCookies } from "../../../utils/auth"
import { mapServiceRow } from "../../../utils/services"
import { CTA_HIDDEN_VALUE, serviceCtaDefaults } from "../../../../utils/page-cta"

async function checkAuth(event: any) {
  const cookies = parseCookies(getHeader(event, "cookie") || null)
  const token = cookies.admin_token
  if (!token) throw createError({ statusCode: 401, message: "Yetkisiz erişim." })
  const payload = await verifyToken(token)
  if (!payload) throw createError({ statusCode: 401, message: "Oturum süresi doldu." })
}

export default defineEventHandler(async (event) => {
  await checkAuth(event)
  const slug = getRouterParam(event, 'slug')
  const db   = await getDb()

  if (event.method === "GET") {
    const row = await db.prepare("SELECT * FROM service_pages WHERE slug = ?").get(slug) as any
    if (!row) throw createError({ statusCode: 404, message: "Sayfa bulunamadı." })
    return mapServiceRow(row)
  }

  if (event.method === "PUT") {
    const body = await readBody(event)
    const str  = (v: any) => typeof v === 'string' ? v : JSON.stringify(v ?? [])
    const g    = (a: string, b: string) => body[a] ?? body[b] ?? ''
    const secondaryHidden = !String(g("ctaSecondaryLabel", "cta_secondary_label") || "").trim()
    await db.prepare(`UPDATE service_pages SET
      hero_eyebrow=?, hero_title=?, hero_lead=?, hero_bg_image=?,
      what_title=?, what_lead=?, benefits=?,
      issues_title=?, issues_lead=?, issues=?,
      process_title=?, process_lead=?, process_steps=?,
      cta_title=?, cta_lead=?, cta_bg_image=?,
      cta_primary_label=?, cta_primary_url=?, cta_secondary_label=?, cta_secondary_url=?
      WHERE slug=?`)
      .run(
        g('heroEyebrow','hero_eyebrow'), g('heroTitle','hero_title'),
        g('heroLead','hero_lead'),       g('heroBgImage','hero_bg_image'),
        g('whatTitle','what_title'),     g('whatLead','what_lead'),
        str(body.benefits),
        g('issuesTitle','issues_title'), g('issuesLead','issues_lead'),
        str(body.issues),
        g('processTitle','process_title'), g('processLead','process_lead'),
        str(body.processSteps ?? body.process_steps),
        g('ctaTitle','cta_title'), g('ctaLead','cta_lead'),
        g('ctaBgImage','cta_bg_image'),
        g('ctaPrimaryLabel','cta_primary_label') || serviceCtaDefaults.primaryLabel,
        g('ctaPrimaryUrl','cta_primary_url') || serviceCtaDefaults.primaryUrl,
        secondaryHidden ? CTA_HIDDEN_VALUE : (g('ctaSecondaryLabel','cta_secondary_label') || serviceCtaDefaults.secondaryLabel),
        secondaryHidden ? CTA_HIDDEN_VALUE : (g('ctaSecondaryUrl','cta_secondary_url') || serviceCtaDefaults.secondaryUrl),
        slug
      )
    return { success: true }
  }

  if (event.method === "DELETE") {
    const result = await db.prepare("DELETE FROM service_pages WHERE slug = ?").run(slug)
    if (!result.changes) {
      throw createError({ statusCode: 404, message: "Silinecek hizmet bulunamadı." })
    }
    return { success: true }
  }
})
