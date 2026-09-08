export type LogoType = "text" | "image"
export type HeaderMenuItemType = "link" | "services"

export interface SiteLinkItem {
  label: string
  to: string
}

export interface HeaderMenuItem extends SiteLinkItem {
  type: HeaderMenuItemType
}

export const defaultLogoType: LogoType = "text"
export const defaultHeaderCtaLabel = "Randevu Al"
export const defaultHeaderCtaUrl = "/iletisim"
export const defaultFooterServicesTitle = "Hizmetler"
export const defaultFooterMenuTitle = "Kurumsal"
export const defaultFooterContactTitle = "İletişim"

export const defaultHeaderMenuItems: HeaderMenuItem[] = [
  { label: "Ana Sayfa", to: "/", type: "link" },
  { label: "Kurumsal", to: "/hakkimda", type: "link" },
  { label: "Hizmetler", to: "", type: "services" },
  { label: "Yardım Merkezi", to: "/sss", type: "link" },
]

export const defaultFooterMenuItems: SiteLinkItem[] = [
  { label: "Kurumsal", to: "/hakkimda" },
  { label: "Blog", to: "/blog" },
  { label: "Sık Sorulan Sorular", to: "/sss" },
  { label: "Randevu Al", to: "/iletisim" },
]

export const defaultFooterLegalLinks: SiteLinkItem[] = [
  { label: "Gizlilik Politikası", to: "/gizlilik" },
  { label: "Kullanım Koşulları", to: "/kullanim-kosullari" },
  { label: "KVKK", to: "/kvkk" },
]

function parseArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value
  if (typeof value !== "string") return null
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function cloneHeaderItems(items: HeaderMenuItem[]) {
  return items.map((item) => ({ ...item }))
}

function cloneLinkItems(items: SiteLinkItem[]) {
  return items.map((item) => ({ ...item }))
}

function normalizeHeaderMenuItem(value: unknown): HeaderMenuItem | null {
  if (!value || typeof value !== "object") return null

  const record = value as Record<string, unknown>
  const type: HeaderMenuItemType = record.type === "services" ? "services" : "link"
  const label = String(record.label || "").trim()
  const to = String(record.to || "").trim()

  if (!label) return null
  if (type === "services") return { label, to: "", type }
  if (!to) return null

  return { label, to, type }
}

function normalizeLinkItem(value: unknown): SiteLinkItem | null {
  if (!value || typeof value !== "object") return null

  const record = value as Record<string, unknown>
  const label = String(record.label || "").trim()
  const to = String(record.to || "").trim()

  if (!label || !to) return null
  return { label, to }
}

export function parseHeaderMenuItems(value: unknown, fallback: HeaderMenuItem[] = defaultHeaderMenuItems) {
  const parsed = parseArray(value)
  if (!parsed) return cloneHeaderItems(fallback)

  const items = parsed.map(normalizeHeaderMenuItem).filter(Boolean) as HeaderMenuItem[]
  if (!items.length && parsed.length > 0) return cloneHeaderItems(fallback)

  return items
}

export function parseFooterLinkItems(value: unknown, fallback: SiteLinkItem[] = defaultFooterMenuItems) {
  const parsed = parseArray(value)
  if (!parsed) return cloneLinkItems(fallback)

  const items = parsed.map(normalizeLinkItem).filter(Boolean) as SiteLinkItem[]
  if (!items.length && parsed.length > 0) return cloneLinkItems(fallback)

  return items
}

export function serializeHeaderMenuItems(value: unknown) {
  return JSON.stringify(parseHeaderMenuItems(value, []))
}

export function serializeFooterLinkItems(value: unknown) {
  return JSON.stringify(parseFooterLinkItems(value, []))
}

export function createHeaderMenuItem(type: HeaderMenuItemType = "link"): HeaderMenuItem {
  return {
    label: type === "services" ? "Hizmetler" : "",
    to: "",
    type,
  }
}

export function createSiteLinkItem(): SiteLinkItem {
  return { label: "", to: "" }
}

export function isExternalLink(url: string) {
  return /^(https?:\/\/|mailto:|tel:)/i.test(String(url || ""))
}
