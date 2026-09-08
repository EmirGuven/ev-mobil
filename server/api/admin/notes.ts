// GET    /api/admin/notes          — tüm notları listele
// POST   /api/admin/notes          — yeni not oluştur
// PUT    /api/admin/notes?id=X     — notu güncelle
// DELETE /api/admin/notes?id=X     — notu sil
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
    const { done } = getQuery(event)
    const query = done === "1"
      ? "SELECT * FROM admin_notes WHERE done = 1 ORDER BY updated_at DESC"
      : "SELECT * FROM admin_notes ORDER BY pinned DESC, remind_at ASC, created_at DESC"
    return await db.prepare(query).all()
  }

  if (event.method === "POST") {
    const body = await readBody(event)
    const result = await db.prepare(`
      INSERT INTO admin_notes (title, content, remind_at, color, pinned, done)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(
      body.title || "",
      body.content || "",
      body.remind_at || "",
      body.color || "yellow",
      body.pinned ? 1 : 0
    )
    return { success: true, id: result.lastInsertRowid }
  }

  if (event.method === "PUT") {
    const body = await readBody(event)
    const { id } = getQuery(event)
    await db.prepare(`
      UPDATE admin_notes
      SET title = ?, content = ?, remind_at = ?, color = ?, pinned = ?, done = ?, updated_at = now()::text
      WHERE id = ?
    `).run(
      body.title ?? "",
      body.content ?? "",
      body.remind_at ?? "",
      body.color ?? "yellow",
      body.pinned ? 1 : 0,
      body.done ? 1 : 0,
      id
    )
    return { success: true }
  }

  if (event.method === "DELETE") {
    const { id } = getQuery(event)
    await db.prepare("DELETE FROM admin_notes WHERE id = ?").run(id)
    return { success: true }
  }
})
