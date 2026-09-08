// GET    /api/admin/appointments           — listele (type=request|appointment|all)
// POST   /api/admin/appointments           — yeni randevu (admin tarafından)
// PUT    /api/admin/appointments?id=X      — güncelle
// DELETE /api/admin/appointments?id=X      — sil
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
    const { type } = getQuery(event)
    if (type === "request") {
      return await db.prepare("SELECT * FROM appointments WHERE type = 'request' ORDER BY created_at DESC").all()
    }
    if (type === "appointment") {
      return await db.prepare("SELECT * FROM appointments WHERE type = 'appointment' ORDER BY appointment_date DESC, appointment_time DESC").all()
    }
    return await db.prepare("SELECT * FROM appointments ORDER BY created_at DESC").all()
  }

  if (event.method === "POST") {
    const body = await readBody(event)
    const result = await db.prepare(`
      INSERT INTO appointments
        (name, phone, email, service, message, status, notes, type, appointment_date, appointment_time, first_visit_date, issue_date, session_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      body.name || "",
      body.phone || "",
      body.email || "",
      body.service || "",
      body.message || "",
      body.status || "new",
      body.notes || "",
      body.type || "appointment",
      body.appointment_date || "",
      body.appointment_time || "",
      body.first_visit_date || "",
      body.issue_date || "",
      body.session_count ?? 0
    )
    return { success: true, id: result.lastInsertRowid }
  }

  if (event.method === "PUT") {
    const body = await readBody(event)
    const { id } = getQuery(event)
    await db.prepare(`
      UPDATE appointments
      SET status = ?, notes = ?, first_visit_date = ?, issue_date = ?, session_count = ?,
          type = ?, appointment_date = ?, appointment_time = ?
      WHERE id = ?
    `).run(
      body.status,
      body.notes || "",
      body.first_visit_date || "",
      body.issue_date || "",
      body.session_count ?? 0,
      body.type || "request",
      body.appointment_date || "",
      body.appointment_time || "",
      id
    )
    return { success: true }
  }

  if (event.method === "DELETE") {
    const { id } = getQuery(event)
    await db.prepare("DELETE FROM appointments WHERE id = ?").run(id)
    return { success: true }
  }
})
