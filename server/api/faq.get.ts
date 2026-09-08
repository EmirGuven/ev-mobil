// GET /api/faq — public, tüm SSS gruplarını ve sorularını döner
import { getDb } from "../utils/db"

export default defineEventHandler(async () => {
  const db = await getDb()
  const groups = await db.prepare("SELECT * FROM faq_groups ORDER BY sort_order, id").all() as any[]
  const items  = await db.prepare("SELECT * FROM faq_items ORDER BY group_id, sort_order, id").all() as any[]

  return groups.map((g) => ({
    id       : g.id,
    category : g.category,
    sort_order: g.sort_order,
    items    : items
      .filter((i) => i.group_id === g.id)
      .map((i) => ({ id: i.id, question: i.question, answer: i.answer, sort_order: i.sort_order }))
  })) // düz array döner — sss.vue FaqGroup[] bekliyor
})
