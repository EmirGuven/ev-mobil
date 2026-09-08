// GET /api/blog — public, yayınlanmış blog yazılarını döner
import { getDb } from "../utils/db"

export default defineEventHandler(async (event) => {
  const db = await getDb()
  const query = getQuery(event)
  const slug = query.slug as string | undefined

  if (slug) {
    const post = await db.prepare("SELECT * FROM blog_posts WHERE slug = ? AND published = 1").get(slug) as any
    if (!post) throw createError({ statusCode: 404, message: "Yazı bulunamadı" })
    return formatPost(post)
  }

  const posts = await db.prepare("SELECT * FROM blog_posts WHERE published = 1 ORDER BY date DESC").all() as any[]
  return posts.map(formatPost)
})

function formatPost(p: any) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    content: p.content ? p.content.split("\n\n").filter(Boolean) : [],
    category: p.category,
    tags: p.tags || '',
    quote: p.quote || '',
    readTime: p.read_time,
    date: p.date,
    image: p.image,
    featured: p.featured === 1,
    published: p.published === 1
  }
}
