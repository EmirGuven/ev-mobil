// PUT /api/admin/stories/:id — story güncelle
// DELETE /api/admin/stories/:id — story sil
import { getDb } from "../../../utils/db"
import { verifyToken, parseCookies } from "../../../utils/auth"

async function checkAuth(event: any) {
  const cookies = parseCookies(getHeader(event, "cookie") || null)
  const payload = await verifyToken(cookies.admin_token || "")
  if (!payload) throw createError({ statusCode: 401, message: "Yetkisiz erişim." })
}

export default defineEventHandler(async (event) => {
  await checkAuth(event)
  const id = getRouterParam(event, "id")
  const db = await getDb()

  if (event.method === "PUT") {
    const body = await readBody(event)
    await db.prepare(`
      UPDATE stories SET
        title = ?, image = ?, link_label = ?, link_url = ?, sort_order = ?, active = ?
      WHERE id = ?
    `).run(
      body.title || "",
      body.image || "",
      body.link_label || "",
      body.link_url || "",
      body.sort_order ?? 0,
      body.active ? 1 : 0,
      id,
    )
    return { success: true }
  }

  if (event.method === "DELETE") {
    await db.prepare("DELETE FROM stories WHERE id = ?").run(id)
    return { success: true }
  }
})
