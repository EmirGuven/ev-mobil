import { getDb } from "../../utils/db"
import { verifyToken, parseCookies } from "../../utils/auth"
import { defaultThemePaletteId } from "../../../utils/theme-palettes"

const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/i

function safeHexColor(value: unknown, fallback: string) {
  const normalized = String(value || "").trim()
  return HEX_COLOR_REGEX.test(normalized) ? normalized : fallback
}

async function checkAuth(event: any) {
  const cookies = parseCookies(getHeader(event, "cookie") || null)
  const token = cookies.admin_token
  if (!token) throw createError({ statusCode: 401, message: "Yetkisiz erişim." })
  const payload = await verifyToken(token)
  if (!payload) throw createError({ statusCode: 401, message: "Oturum süresi doldu." })
}

export default defineEventHandler(async (event) => {
  await checkAuth(event)
  const db = await getDb()

  if (event.method === "GET") {
    const row = await db.prepare("SELECT * FROM site_settings WHERE id = 1").get() as any
    if (!row) return {}

    return {
      name: row.name || "",
      title_suffix: row.title_suffix || "",
      description: row.description || "",
      phone: row.phone || "",
      phone_display: row.phone_display || "",
      email: row.email || "",
      address_street: row.address_street || "",
      address_region: row.address_region || "",
      address_city: row.address_city || "",
      working_hours: row.working_hours || "",
      maps_url: row.maps_url || "",
      social_instagram: row.social_instagram || "",
      social_linkedin: row.social_linkedin || "",
      theme_palette: row.theme_palette || defaultThemePaletteId,
      custom_theme_enabled: Boolean(row.custom_theme_enabled),
      custom_primary: row.custom_primary || "#c9a35a",
      custom_primary_deep: row.custom_primary_deep || "#9a7030",
      custom_surface_dark: row.custom_surface_dark || "#2a3347",
      custom_accent_contrast: row.custom_accent_contrast || "#1a1209",
      og_image: row.og_image || "",
      favicon: row.favicon || "",
    }
  }

  if (event.method === "PUT") {
    const body = await readBody(event)
    const titleSuffix = String(body.title_suffix || body.name || "").trim()
    const phoneDisplay = String(body.phone_display || body.phone || "").trim()
    const customPrimary = safeHexColor(body.custom_primary, "#c9a35a")
    const customPrimaryDeep = safeHexColor(body.custom_primary_deep, "#9a7030")
    const customSurfaceDark = safeHexColor(body.custom_surface_dark, "#2a3347")
    const customAccentContrast = safeHexColor(body.custom_accent_contrast, "#1a1209")

    await db.prepare(`
      UPDATE site_settings SET
        name = ?,
        title_suffix = ?,
        description = ?,
        phone = ?,
        phone_display = ?,
        email = ?,
        address_street = ?,
        address_region = ?,
        address_city = ?,
        working_hours = ?,
        maps_url = ?,
        social_instagram = ?,
        social_linkedin = ?,
        theme_palette = ?,
        custom_theme_enabled = ?,
        custom_primary = ?,
        custom_primary_deep = ?,
        custom_surface_dark = ?,
        custom_accent_contrast = ?,
        og_image = ?,
        favicon = ?
      WHERE id = 1
    `).run(
      body.name || "",
      titleSuffix,
      body.description || "",
      body.phone || "",
      phoneDisplay,
      body.email || "",
      body.address_street || "",
      body.address_region || "",
      body.address_city || "",
      body.working_hours || "",
      body.maps_url || "",
      body.social_instagram || "",
      body.social_linkedin || "",
      body.theme_palette || defaultThemePaletteId,
      body.custom_theme_enabled ? 1 : 0,
      customPrimary,
      customPrimaryDeep,
      customSurfaceDark,
      customAccentContrast,
      body.og_image || "",
      body.favicon || "",
    )

    return { success: true }
  }
})
