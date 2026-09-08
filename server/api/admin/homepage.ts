// GET /api/admin/homepage  — ham DB satırını döndür
// PUT /api/admin/homepage  — güncelle
import { getDb } from "../../utils/db"
import { verifyToken, parseCookies } from "../../utils/auth"
import { CTA_HIDDEN_VALUE, homepageCtaDefaults } from "../../../utils/page-cta"
import { normalizeHomepageServiceItems } from "../../../utils/homepage-service-icons"

async function checkAuth(event: any) {
  const cookies = parseCookies(getHeader(event, "cookie") || null)
  const payload = await verifyToken(cookies.admin_token || "")
  if (!payload) throw createError({ statusCode: 401, message: "Yetkisiz erişim." })
}

function safeJson(val: any, fallback: any = []) {
  if (typeof val === "string") { try { return JSON.parse(val) } catch { return fallback } }
  return val ?? fallback
}

function normalizeAccreditations(val: any) {
  const items = safeJson(val, [])
  if (!Array.isArray(items)) return []

  return items
    .map((item: any) => {
      if (typeof item === "string") {
        return { icon: "shield", title: item, description: "" }
      }

      return {
        icon: String(item?.icon || "shield"),
        title: String(item?.title || item?.label || ""),
        description: String(item?.description || item?.text || ""),
      }
    })
    .filter((item) => item.title)
}

function normalizeHeroImages(val: any) {
  const items = safeJson(val, [])
  if (!Array.isArray(items)) return []
  return items.map((item) => String(item || "").trim()).filter(Boolean)
}

export default defineEventHandler(async (event) => {
  await checkAuth(event)
  const db = await getDb()

  if (event.method === "GET") {
    const row = await db.prepare("SELECT * FROM homepage WHERE id = 1").get() as any
    if (!row) return {}
    const legacySettings = await db.prepare("SELECT hero_image FROM site_settings WHERE id = 1").get() as any
    // JSON alanlarını parse ederek döndür
    return {
      ...row,
      hero_bg_image: row.hero_bg_image || legacySettings?.hero_image || "",
      hero_images: normalizeHeroImages(row.hero_images),
      accreditations: normalizeAccreditations(row.accreditations),
      process_steps:  safeJson(row.process_steps, []),
      services_items: normalizeHomepageServiceItems(safeJson(row.services_items, [])),
      cta_primary_label: row.cta_primary_label || homepageCtaDefaults.primaryLabel,
      cta_primary_url: row.cta_primary_url || homepageCtaDefaults.primaryUrl,
      cta_secondary_label: row.cta_secondary_label === CTA_HIDDEN_VALUE ? "" : (row.cta_secondary_label || homepageCtaDefaults.secondaryLabel),
      cta_secondary_url: row.cta_secondary_label === CTA_HIDDEN_VALUE ? "" : (row.cta_secondary_url || homepageCtaDefaults.secondaryUrl),
    }
  }

  if (event.method === "PUT") {
    const b = await readBody(event)

    // process_steps ve accreditations array ise stringify et
    const processSteps     = typeof b.process_steps  === "string" ? b.process_steps  : JSON.stringify(b.process_steps  || [])
    const heroImages       = JSON.stringify(normalizeHeroImages(b.hero_images))
    const accreditations   = JSON.stringify(normalizeAccreditations(b.accreditations))
    const servicesItems    = JSON.stringify(normalizeHomepageServiceItems(b.services_items || []))
    const secondaryHidden = !String(b.cta_secondary_label || "").trim()

    await db.prepare(`
      UPDATE homepage SET
        hero_eyebrow           = ?,
        hero_title             = ?,
        hero_description       = ?,
        hero_badge1            = ?,
        hero_badge2            = ?,
        hero_badge3            = ?,
        hero_bg_image          = ?,
        hero_images            = ?,
        hero_primary_label     = ?,
        hero_primary_url       = ?,
        hero_secondary_label   = ?,
        hero_secondary_url     = ?,
        accreditations         = ?,
        about_eyebrow          = ?,
        about_title            = ?,
        about_role             = ?,
        about_paragraph1       = ?,
        about_paragraph2       = ?,
        about_photo            = ?,
        services_eyebrow       = ?,
        services_title         = ?,
        services_description   = ?,
        services_bg_image      = ?,
        process_eyebrow        = ?,
        process_title          = ?,
        process_description    = ?,
        process_steps          = ?,
        testimonials_eyebrow   = ?,
        testimonials_title     = ?,
        testimonials_description = ?,
        cta_title              = ?,
        cta_description        = ?,
        cta_bg_image           = ?,
        cta_primary_label      = ?,
        cta_primary_url        = ?,
        cta_secondary_label    = ?,
        cta_secondary_url      = ?,
        services_items         = ?
      WHERE id = 1
    `).run(
      b.hero_eyebrow           || "",
      b.hero_title             || "",
      b.hero_description       || "",
      b.hero_badge1            || "",
      b.hero_badge2            || "",
      b.hero_badge3            || "",
      b.hero_bg_image          || "",
      heroImages,
      b.hero_primary_label     || "",
      b.hero_primary_url       || "",
      b.hero_secondary_label   || "",
      b.hero_secondary_url     || "",
      accreditations,
      b.about_eyebrow          || "",
      b.about_title            || "",
      b.about_role             || "",
      b.about_paragraph1       || "",
      b.about_paragraph2       || "",
      b.about_photo            || "",
      b.services_eyebrow       || "",
      b.services_title         || "",
      b.services_description   || "",
      b.services_bg_image      || "",
      b.process_eyebrow        || "",
      b.process_title          || "",
      b.process_description    || "",
      processSteps,
      b.testimonials_eyebrow   || "",
      b.testimonials_title     || "",
      b.testimonials_description || "",
      b.cta_title              || "",
      b.cta_description        || "",
      b.cta_bg_image           || "",
      b.cta_primary_label      || homepageCtaDefaults.primaryLabel,
      b.cta_primary_url        || homepageCtaDefaults.primaryUrl,
      secondaryHidden ? CTA_HIDDEN_VALUE : (b.cta_secondary_label || homepageCtaDefaults.secondaryLabel),
      secondaryHidden ? CTA_HIDDEN_VALUE : (b.cta_secondary_url || homepageCtaDefaults.secondaryUrl),
      servicesItems,
    )
    return { success: true }
  }
})
