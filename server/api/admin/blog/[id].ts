// PUT /api/admin/blog/:id — yazı güncelle
// DELETE /api/admin/blog/:id — yazı sil
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

  if (event.method === "GET") {
    const post = await db.prepare("SELECT * FROM blog_posts WHERE id = ?").get(id)
    if (!post) throw createError({ statusCode: 404, message: "Yazı bulunamadı." })
    return post
  }

  if (event.method === "PUT") {
    const body = await readBody(event)
    await db.prepare(`
      UPDATE blog_posts SET
        title = ?, excerpt = ?, content = ?, category = ?, tags = ?, quote = ?, read_time = ?,
        date = ?, image = ?, hero_bg_image = ?, featured = ?, published = ?,
        updated_at = now()::text
      WHERE id = ?
    `).run(body.title, body.excerpt || "", body.content || "",
      body.category || "", body.tags || "", body.quote || "", body.read_time || "", body.date || "",
      body.image || "", body.hero_bg_image || "", body.featured ? 1 : 0, body.published ? 1 : 0, id)
    return { success: true }
  }

  if (event.method === "DELETE") {
    await db.prepare("DELETE FROM blog_posts WHERE id = ?").run(id)
    return { success: true }
  }
})
