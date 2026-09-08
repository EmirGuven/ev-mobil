import { getDb } from "../../utils/db"
import { verifyToken, parseCookies } from "../../utils/auth"
import {
  defaultHeaderCtaLabel,
  defaultHeaderCtaUrl,
  defaultHeaderMenuItems,
  defaultLogoType,
  parseHeaderMenuItems,
  serializeHeaderMenuItems,
} from "../../../utils/site-settings"

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
      logo_tagline: row.logo_tagline || "Frigolu · Parsiyel · Kara Taşımacılığı",
      logo_type: row.logo_type || defaultLogoType,
      logo_image: row.logo_image || "",
      header_cta_label: row.header_cta_label || defaultHeaderCtaLabel,
      header_cta_url: row.header_cta_url || defaultHeaderCtaUrl,
      header_menu_items: parseHeaderMenuItems(row.header_menu_items, defaultHeaderMenuItems),
    }
  }

  if (event.method === "PUT") {
    const body = await readBody(event)

    await db.prepare(`
      UPDATE site_settings SET
        logo_tagline = ?,
        logo_type = ?,
        logo_image = ?,
        header_cta_label = ?,
        header_cta_url = ?,
        header_menu_items = ?
      WHERE id = 1
    `).run(
      body.logo_tagline || "Frigolu · Parsiyel · Kara Taşımacılığı",
      body.logo_type === "image" ? "image" : "text",
      body.logo_image || "",
      body.header_cta_label || defaultHeaderCtaLabel,
      body.header_cta_url || defaultHeaderCtaUrl,
      serializeHeaderMenuItems(body.header_menu_items),
    )

    return { success: true }
  }
})
