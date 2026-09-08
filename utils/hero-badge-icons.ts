export type HeroBadgeIconId = "shield" | "clock" | "ear" | "device" | "tune"

export type HeroBadgeItem = {
  icon: HeroBadgeIconId
  title: string
  description: string
}

export const heroBadgeIconOptions: Array<{ value: HeroBadgeIconId; label: string }> = [
  { value: "ear", label: "Kulak / İşitme" },
  { value: "device", label: "İşitme Cihazı" },
  { value: "tune", label: "Ayarlama / Uygulama" },
  { value: "shield", label: "Kalkan / Güven" },
  { value: "clock", label: "Saat / Randevu" },
]

export const heroBadgeIconSvgMap: Record<HeroBadgeIconId, string> = {
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  ear: '<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4"/>',
  device: '<path d="M4 10v4"/><path d="M8 6v12"/><path d="M12 3v18"/><path d="M16 6v12"/><path d="M20 10v4"/>',
  tune: '<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/>',
}

export function resolveHeroBadgeIcon(icon?: string): HeroBadgeIconId {
  const candidate = String(icon || "").trim() as HeroBadgeIconId
  if (candidate && heroBadgeIconSvgMap[candidate]) return candidate
  return "shield"
}
