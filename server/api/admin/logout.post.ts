// POST /api/admin/logout
export default defineEventHandler((event) => {
  deleteCookie(event, "admin_token", { path: "/" })
  return { success: true }
})
