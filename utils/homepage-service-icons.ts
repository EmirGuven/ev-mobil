export type HomepageServiceIconId =
  | "device"
  | "zap"
  | "inear"
  | "bte"
  | "kit"
  | "support"

export type HomepageServiceItem = {
  slug: string
  title: string
  description: string
  icon: HomepageServiceIconId
}

export const homepageServiceIconOptions: Array<{ value: HomepageServiceIconId; label: string }> = [
  { value: "device", label: "İşitme Cihazı" },
  { value: "zap", label: "Şarjlı Cihaz" },
  { value: "inear", label: "Kulak İçi Cihaz" },
  { value: "bte", label: "Kulak Arkası Cihaz" },
  { value: "kit", label: "Aksesuar" },
  { value: "support", label: "Bakım / Servis" },
]

export const homepageServiceIconSvgMap: Record<HomepageServiceIconId, string> = {
  device: '<path d="M4 10v4"/><path d="M8 6v12"/><path d="M12 3v18"/><path d="M16 6v12"/><path d="M20 10v4"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  inear: '<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><circle cx="12" cy="13" r="2.2" fill="currentColor" stroke="none"/>',
  bte: '<path d="M8 3c4 0 7 3 7 7v7a3 3 0 0 1-6 0v-6"/><path d="M8 3C5 3.5 3 6 3 9"/>',
  kit: '<path d="M3 7h18v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  support: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
}

export function resolveHomepageServiceIcon(icon?: string, slug?: string): HomepageServiceIconId {
  const candidate = String(icon || "").trim() as HomepageServiceIconId
  if (candidate && homepageServiceIconSvgMap[candidate]) return candidate
  return getDefaultHomepageServiceIcon(slug)
}

export function getDefaultHomepageServiceIcon(slug?: string): HomepageServiceIconId {
  switch (slug) {
    case "isitme-cihazlari":
      return "device"
    case "sarjli-isitme-cihazlari":
      return "zap"
    case "kulak-ici-isitme-cihazlari":
      return "inear"
    case "kulak-arkasi-isitme-cihazlari":
      return "bte"
    case "isitme-cihazi-aksesuarlari":
      return "kit"
    case "isitme-cihazi-bakim-ve-servisi":
      return "support"
    default:
      return "device"
  }
}

export function normalizeHomepageServiceItems(val: any): HomepageServiceItem[] {
  let items = val
  if (typeof items === "string") {
    try {
      items = JSON.parse(items)
    } catch {
      items = []
    }
  }
  items = Array.isArray(items) ? items : []

  return items
    .map((item: any) => ({
      slug: String(item?.slug || ""),
      title: String(item?.title || ""),
      description: String(item?.description || ""),
      icon: resolveHomepageServiceIcon(item?.icon, item?.slug),
    }))
    .filter((item) => item.slug || item.title)
}
