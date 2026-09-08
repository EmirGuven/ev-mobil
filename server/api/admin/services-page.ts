// GET + PUT /api/admin/services-page
import { getDb } from "../../utils/db"
import { verifyToken, parseCookies } from "../../utils/auth"

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
    return await db.prepare("SELECT * FROM services_page WHERE id = 1").get()
  }

  if (event.method === "PUT") {
    const body = await readBody(event)
    await db.prepare(`UPDATE services_page SET hero_eyebrow=?, hero_title=?, hero_lead=?, hero_bg_image=?, intro_title=?, intro_lead=?, cta_title=?, cta_lead=?, cta_bg_image=? WHERE id=1`)
      .run(body.hero_eyebrow||'', body.hero_title||'', body.hero_lead||'', body.hero_bg_image||'', body.intro_title||'', body.intro_lead||'', body.cta_title||'', body.cta_lead||'', body.cta_bg_image||'')
    return { success: true }
  }
})
