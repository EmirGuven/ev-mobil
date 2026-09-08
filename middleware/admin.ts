export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/admin/login') return

  try {
    await $fetch('/api/admin/settings', { method: 'GET' })
  } catch {
    return navigateTo('/admin/login')
  }
})
