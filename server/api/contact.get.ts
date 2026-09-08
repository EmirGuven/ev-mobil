// GET /api/contact — public
import { getDb } from "../utils/db"
import { getContactCtaDefaults, resolvePageCtaButtons } from "../../utils/page-cta"

function extractEmail(value: any) {
  const text = String(value || "").trim()
  const normalized = text.startsWith("mailto:") ? text.slice(7) : text
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : ""
}

export default defineEventHandler(async () => {
  const db  = await getDb()
  const row = await db.prepare("SELECT * FROM contact_page WHERE id = 1").get() as any
  if (!row) return {}

  const siteRow = await db.prepare("SELECT phone, email FROM site_settings WHERE id = 1").get() as any
  const pageEmail = row.contact_email || extractEmail(row.cta_primary_url) || siteRow?.email || ""
  const defaults = getContactCtaDefaults(siteRow?.email || "", siteRow?.phone || "")
  const ctaButtons = resolvePageCtaButtons({
    primaryLabel: row.cta_primary_label || "",
    primaryUrl: row.cta_primary_url || "",
    secondaryLabel: row.cta_secondary_label || "",
    secondaryUrl: row.cta_secondary_url || "",
  }, defaults)

  return {
    heroEyebrow: row.hero_eyebrow,
    heroTitle:   row.hero_title,
    heroLead:    row.hero_lead,
    heroBgImage: row.hero_bg_image || '',
    infoTitle:   row.info_title,
    infoLead:    row.info_lead,
    formTitle:   row.form_title,
    formLead:    row.form_lead,
    ctaTitle:    row.cta_title,
    ctaLead:     row.cta_lead,
    ctaBgImage:  row.cta_bg_image || "",
    ctaPrimaryLabel: ctaButtons.primaryLabel,
    ctaPrimaryUrl: ctaButtons.primaryUrl,
    ctaSecondaryLabel: ctaButtons.secondaryLabel,
    ctaSecondaryUrl: ctaButtons.secondaryUrl,
    email: pageEmail,
  }
})
