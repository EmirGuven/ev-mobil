// composables/useAdminAuth.ts
import { ref } from "vue"
import { useRouter } from "vue-router"

export function useAdminAuth() {
  const router = useRouter()
  const loading = ref(false)
  const error = ref("")

  async function logout() {
    await $fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
  }

  return { loading, error, logout }
}
