import { resolvePageCtaButtons, serviceCtaDefaults } from "../../utils/page-cta"

const RESERVED_SERVICE_SLUGS = new Set([
  "",
  "admin",
  "blog",
  "gizlilik",
  "hakkimda",
  "iletisim",
  "index",
  "kullanim-kosullari",
  "kvkk",
  "sss",
])

function parseJson(value: unknown, fallback: any[] = []) {
  if (typeof value !== "string") return Array.isArray(value) ? value : fallback
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

export function slugifyServiceSlug(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}

export function isReservedServiceSlug(slug: string) {
  return RESERVED_SERVICE_SLUGS.has(slug)
}

export async function createUniqueServiceSlug(db: any, source: string) {
  const baseSlug = slugifyServiceSlug(source)
  if (!baseSlug) {
    throw createError({ statusCode: 400, message: "Geçerli bir hizmet bağlantısı girin." })
  }
  if (isReservedServiceSlug(baseSlug)) {
    throw createError({ statusCode: 400, message: "Bu bağlantı adı kullanılamaz." })
  }

  let slug = baseSlug
  let attempt = 0

  while (await db.prepare("SELECT id FROM service_pages WHERE slug = ?").get(slug)) {
    attempt += 1
    slug = `${baseSlug}-${attempt}`
  }

  return slug
}

export function mapServiceRow(row: any) {
  const ctaButtons = resolvePageCtaButtons({
    primaryLabel: row.cta_primary_label || "",
    primaryUrl: row.cta_primary_url || "",
    secondaryLabel: row.cta_secondary_label || "",
    secondaryUrl: row.cta_secondary_url || "",
  }, serviceCtaDefaults)

  return {
    id: row.id,
    slug: row.slug,
    heroEyebrow: row.hero_eyebrow || "",
    heroTitle: row.hero_title || "",
    heroLead: row.hero_lead || "",
    heroBgImage: row.hero_bg_image || "",
    whatTitle: row.what_title || "",
    whatLead: row.what_lead || "",
    benefits: parseJson(row.benefits),
    issuesTitle: row.issues_title || "",
    issuesLead: row.issues_lead || "",
    issues: parseJson(row.issues),
    processTitle: row.process_title || "",
    processLead: row.process_lead || "",
    processSteps: parseJson(row.process_steps),
    ctaTitle: row.cta_title || "",
    ctaLead: row.cta_lead || "",
    ctaBgImage: row.cta_bg_image || "",
    ctaPrimaryLabel: ctaButtons.primaryLabel,
    ctaPrimaryUrl: ctaButtons.primaryUrl,
    ctaSecondaryLabel: ctaButtons.secondaryLabel,
    ctaSecondaryUrl: ctaButtons.secondaryUrl,
  }
}

export function mapServiceSummaryRow(row: any) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.hero_title || row.slug,
    eyebrow: row.hero_eyebrow || "",
    description: row.hero_lead || row.what_lead || "",
    image: row.hero_bg_image || "",
  }
}
