<template>
  <div class="admin-login-page">
    <div class="admin-login-card">
      <div class="admin-login-card__logo">
        <strong>Ev-Mobil</strong>
        <small>Admin Girişi</small>
      </div>

      <form class="admin-login-form" @submit.prevent="handleLogin">
        <div v-if="error" class="admin-login-error">{{ error }}</div>

        <div class="form-group">
          <label for="username">Kullanıcı Adı</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            placeholder="admin"
            required
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="password">Şifre</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn-admin-login" :disabled="loading">
          {{ loading ? 'Giriş yapılıyor…' : 'Giriş Yap' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const router = useRouter()
const form = reactive({ username: '', password: '' })
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: form,
    })
    await router.push('/admin')
  } catch (err: any) {
    error.value = err?.data?.message || 'Kullanıcı adı veya şifre hatalı.'
  } finally {
    loading.value = false
  }
}
</script>
