// GET /api/homepage — anasayfa içeriğini döndür
import { getDb } from "../utils/db"
import { homepageCtaDefaults, resolvePageCtaButtons } from "../../utils/page-cta"
import { normalizeHomepageServiceItems } from "../../utils/homepage-service-icons"

export default defineEventHandler(async () => {
  const db = await getDb()
  const row = await db.prepare("SELECT * FROM homepage WHERE id = 1").get() as any
  if (!row) return {}
  const legacySettings = await db.prepare("SELECT hero_image FROM site_settings WHERE id = 1").get() as any
  const fallbackHeroImage = row.hero_bg_image || legacySettings?.hero_image || ""
  const heroImages = normalizeHeroImages(row.hero_images, fallbackHeroImage)

  const ctaButtons = resolvePageCtaButtons({
    primaryLabel: row.cta_primary_label || "",
    primaryUrl: row.cta_primary_url || "",
    secondaryLabel: row.cta_secondary_label || "",
    secondaryUrl: row.cta_secondary_url || "",
  }, homepageCtaDefaults)

  return {
    hero: {
      eyebrow:     row.hero_eyebrow,
      title:       row.hero_title,
      description: row.hero_description,
      badge1:      row.hero_badge1,
      badge2:      row.hero_badge2,
      badge3:      row.hero_badge3,
      bgImage:     fallbackHeroImage,
      images:      heroImages,
      primaryLabel: row.hero_primary_label || "",
      primaryUrl: row.hero_primary_url || "",
      secondaryLabel: row.hero_secondary_label || "",
      secondaryUrl: row.hero_secondary_url || "",
    },
    accreditations: normalizeAccreditations(row.accreditations),
    about: {
      eyebrow:    row.about_eyebrow,
      title:      row.about_title,
      role:       row.about_role,
      paragraph1: row.about_paragraph1,
      paragraph2: row.about_paragraph2,
      photo:      row.about_photo,
    },
    services: {
      eyebrow:     row.services_eyebrow,
      title:       row.services_title,
      description: row.services_description,
      bgImage:     row.services_bg_image || "",
    },
    process: {
      eyebrow:     row.process_eyebrow,
      title:       row.process_title,
      description: row.process_description,
      steps:       safeJson(row.process_steps, []),
    },
    testimonials: {
      eyebrow:     row.testimonials_eyebrow,
      title:       row.testimonials_title,
      description: row.testimonials_description,
    },
    cta: {
      title:       row.cta_title,
      description: row.cta_description,
      bgImage:     row.cta_bg_image || "",
      primaryLabel: ctaButtons.primaryLabel,
      primaryUrl: ctaButtons.primaryUrl,
      secondaryLabel: ctaButtons.secondaryLabel,
      secondaryUrl: ctaButtons.secondaryUrl,
    },
    servicesItems: normalizeHomepageServiceItems(safeJson(row.services_items, [])),
  }
})

function safeJson(val: string, fallback: any) {
  try { return JSON.parse(val) } catch { return fallback }
}

function normalizeHeroImages(val: string, fallbackImage: string) {
  const items = safeJson(val, [])
  const images = Array.isArray(items)
    ? items.map((item) => String(item || "").trim()).filter(Boolean)
    : []

  return images.length ? images : (fallbackImage ? [fallbackImage] : [])
}

function normalizeAccreditations(val: string) {
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
