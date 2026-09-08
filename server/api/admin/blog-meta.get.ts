// GET /api/admin/blog-meta — mevcut kategoriler ve etiketler
import { getDb } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = await getDb()
  const rows = await db.prepare("SELECT category, tags FROM blog_posts WHERE category != '' OR tags != ''").all() as any[]

  const categories = [...new Set(rows.map(r => r.category).filter(Boolean))].sort()
  const tags = [...new Set(
    rows.flatMap(r => (r.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean))
  )].sort()

  return { categories, tags }
})
