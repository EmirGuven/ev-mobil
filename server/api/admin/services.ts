import { getDb } from "../../utils/db"
import { verifyToken, parseCookies } from "../../utils/auth"
import { createUniqueServiceSlug, mapServiceSummaryRow } from "../../utils/services"
import { serviceCtaDefaults } from "../../../utils/page-cta"

async function checkAuth(event: any) {
  const cookies = parseCookies(getHeader(event, "cookie") || null)
  const payload = await verifyToken(cookies.admin_token || "")
  if (!payload) throw createError({ statusCode: 401, message: "Yetkisiz erişim." })
}

export default defineEventHandler(async (event) => {
  await checkAuth(event)
  const db = await getDb()

  if (event.method === "GET") {
    const rows = await db.prepare(`
      SELECT id, slug, hero_eyebrow, hero_title, hero_lead, what_lead, hero_bg_image
      FROM service_pages
      ORDER BY id ASC
    `).all() as any[]

    return rows.map(mapServiceSummaryRow)
  }

  if (event.method === "POST") {
    const body = await readBody(event)
    const title = String(body?.title || "").trim()

    if (!title) {
      throw createError({ statusCode: 400, message: "Hizmet adı zorunludur." })
    }

    const slug = await createUniqueServiceSlug(db, String(body?.slug || title))

    const result = await db.prepare(`
      INSERT INTO service_pages (
        slug, hero_eyebrow, hero_title, hero_lead, hero_bg_image,
        what_title, what_lead, benefits,
        issues_title, issues_lead, issues,
        process_title, process_lead, process_steps,
        cta_title, cta_lead, cta_bg_image,
        cta_primary_label, cta_primary_url, cta_secondary_label, cta_secondary_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      slug,
      String(body?.heroEyebrow || "Profesyonel Taşımacılık"),
      title,
      String(body?.heroLead || `${title} hizmetinin kapsamını ve süreç detaylarını burada inceleyebilirsiniz.`),
      String(body?.heroBgImage || ""),
      String(body?.whatTitle || `${title} Nedir?`),
      String(body?.whatLead || `${title} hizmetinin nasıl ilerlediğini ve hangi ihtiyaçlara uygun olduğunu burada bulabilirsiniz.`),
      JSON.stringify([]),
      String(body?.issuesTitle || "Kullanım Alanları"),
      String(body?.issuesLead || ""),
      JSON.stringify([]),
      String(body?.processTitle || "Süreç Nasıl İşler?"),
      String(body?.processLead || ""),
      JSON.stringify([]),
      String(body?.ctaTitle || `${title} için teklif alın`),
      String(body?.ctaLead || ""),
      String(body?.ctaBgImage || ""),
      String(body?.ctaPrimaryLabel || serviceCtaDefaults.primaryLabel),
      String(body?.ctaPrimaryUrl || serviceCtaDefaults.primaryUrl),
      String(body?.ctaSecondaryLabel || serviceCtaDefaults.secondaryLabel),
      String(body?.ctaSecondaryUrl || serviceCtaDefaults.secondaryUrl),
    )

    return {
      success: true,
      id: result.lastInsertRowid,
      slug,
    }
  }
})
