// GET /api/admin/stories — tüm storyler (pasifler dahil)
// POST /api/admin/stories — yeni story
import { getDb } from "../../utils/db"
import { verifyToken, parseCookies } from "../../utils/auth"

async function checkAuth(event: any) {
  const cookies = parseCookies(getHeader(event, "cookie") || null)
  const payload = await verifyToken(cookies.admin_token || "")
  if (!payload) throw createError({ statusCode: 401, message: "Yetkisiz erişim." })
}

export default defineEventHandler(async (event) => {
  await checkAuth(event)
  const db = await getDb()

  if (event.method === "GET") {
    return await db.prepare("SELECT * FROM stories ORDER BY sort_order ASC, id ASC").all()
  }

  if (event.method === "POST") {
    const body = await readBody(event)
    const maxOrder = await db.prepare("SELECT COALESCE(MAX(sort_order), -1) as m FROM stories").get() as any
    const result = await db.prepare(`
      INSERT INTO stories (title, image, link_label, link_url, sort_order, active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      body.title || "",
      body.image || "",
      body.link_label || "",
      body.link_url || "",
      (maxOrder?.m ?? -1) + 1,
      body.active === false ? 0 : 1,
    )
    return { success: true, id: result.lastInsertRowid }
  }
})
