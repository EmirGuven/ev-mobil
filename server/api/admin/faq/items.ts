// POST /api/admin/faq/items — yeni soru ekle
import { getDb } from "../../../utils/db"
import { verifyToken, parseCookies } from "../../../utils/auth"

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

  if (event.method === "POST") {
    const { group_id, question, answer, sort_order } = await readBody(event)
    if (!group_id) throw createError({ statusCode: 400, message: "group_id zorunlu." })
    if (!question?.trim()) throw createError({ statusCode: 400, message: "Soru metni zorunlu." })
    if (!answer?.trim()) throw createError({ statusCode: 400, message: "Cevap metni zorunlu." })

    const maxOrder = (await db.prepare("SELECT MAX(sort_order) as m FROM faq_items WHERE group_id = ?").get(group_id) as any)?.m ?? 0
    const result = await db.prepare(
      "INSERT INTO faq_items (group_id, question, answer, sort_order) VALUES (?, ?, ?, ?)"
    ).run(group_id, question.trim(), answer.trim(), sort_order ?? maxOrder + 1)

    return { id: result.lastInsertRowid, group_id, question: question.trim(), answer: answer.trim(), sort_order: sort_order ?? maxOrder + 1 }
  }

  throw createError({ statusCode: 405, message: "Method not allowed." })
})
