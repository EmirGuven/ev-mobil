import { getDb } from "../../utils/db"
import { verifyToken, parseCookies } from "../../utils/auth"
import {
  defaultFooterContactTitle,
  defaultFooterLegalLinks,
  defaultFooterMenuItems,
  defaultFooterMenuTitle,
  defaultFooterServicesTitle,
  parseFooterLinkItems,
  serializeFooterLinkItems,
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
      footer_tagline: row.footer_tagline || "",
      footer_services_title: row.footer_services_title || defaultFooterServicesTitle,
      footer_menu_title: row.footer_menu_title || defaultFooterMenuTitle,
      footer_menu_items: parseFooterLinkItems(row.footer_menu_items, defaultFooterMenuItems),
      footer_contact_title: row.footer_contact_title || defaultFooterContactTitle,
      footer_bottom_text: row.footer_bottom_text || "",
      footer_legal_links: parseFooterLinkItems(row.footer_legal_links, defaultFooterLegalLinks),
    }
  }

  if (event.method === "PUT") {
    const body = await readBody(event)

    await db.prepare(`
      UPDATE site_settings SET
        footer_tagline = ?,
        footer_services_title = ?,
        footer_menu_title = ?,
        footer_menu_items = ?,
        footer_contact_title = ?,
        footer_bottom_text = ?,
        footer_legal_links = ?
      WHERE id = 1
    `).run(
      body.footer_tagline || "",
      body.footer_services_title || defaultFooterServicesTitle,
      body.footer_menu_title || defaultFooterMenuTitle,
      serializeFooterLinkItems(body.footer_menu_items),
      body.footer_contact_title || defaultFooterContactTitle,
      body.footer_bottom_text || "",
      serializeFooterLinkItems(body.footer_legal_links),
    )

    return { success: true }
  }
})
