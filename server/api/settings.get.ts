// GET /api/settings — public, site ayarlarını döner
import { getDb } from "../utils/db"
import {
  defaultFooterContactTitle,
  defaultFooterLegalLinks,
  defaultFooterMenuItems,
  defaultFooterMenuTitle,
  defaultFooterServicesTitle,
  defaultHeaderCtaLabel,
  defaultHeaderCtaUrl,
  defaultHeaderMenuItems,
  defaultLogoType,
  parseFooterLinkItems,
  parseHeaderMenuItems,
} from "../../utils/site-settings"
import { defaultThemePaletteId } from "../../utils/theme-palettes"

export default defineEventHandler(async () => {
  const db = await getDb()
  const row = await db.prepare("SELECT * FROM site_settings WHERE id = 1").get() as any
  if (!row) return {}

  return {
    name: row.name,
    titleSuffix: row.title_suffix,
    description: row.description,
    logoTagline: row.logo_tagline,
    footerTagline: row.footer_tagline,
    phone: row.phone,
    phoneDisplay: row.phone_display,
    email: row.email,
    address: {
      street: row.address_street,
      region: row.address_region,
      city: row.address_city,
    },
    workingHours: row.working_hours,
    mapsUrl: row.maps_url,
    social: [row.social_instagram, row.social_linkedin],
    themePalette: row.theme_palette || defaultThemePaletteId,
    customThemeEnabled: Boolean(row.custom_theme_enabled),
    customTheme: {
      primary: row.custom_primary || "#c9a35a",
      primaryDeep: row.custom_primary_deep || "#9a7030",
      surfaceDark: row.custom_surface_dark || "#2a3347",
      accentContrast: row.custom_accent_contrast || "#1a1209",
    },
    ogImage: row.og_image,
    favicon: row.favicon || "",
    logoType: row.logo_type || defaultLogoType,
    logoImage: row.logo_image || "",
    headerCtaLabel: row.header_cta_label || defaultHeaderCtaLabel,
    headerCtaUrl: row.header_cta_url || defaultHeaderCtaUrl,
    headerMenuItems: parseHeaderMenuItems(row.header_menu_items, defaultHeaderMenuItems),
    footerServicesTitle: row.footer_services_title || defaultFooterServicesTitle,
    footerMenuTitle: row.footer_menu_title || defaultFooterMenuTitle,
    footerMenuItems: parseFooterLinkItems(row.footer_menu_items, defaultFooterMenuItems),
    footerContactTitle: row.footer_contact_title || defaultFooterContactTitle,
    footerBottomText: row.footer_bottom_text || "",
    footerLegalLinks: parseFooterLinkItems(row.footer_legal_links, defaultFooterLegalLinks),
  }
})
