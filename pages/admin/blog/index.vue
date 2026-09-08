<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1>Blog</h1>
      <NuxtLink v-if="tab === 'yazilar'" to="/admin/blog/new" class="btn-admin-primary">+ Yeni Yazı</NuxtLink>
      <button v-else class="btn-admin-primary" :disabled="pageSaving" @click="savePage">
        {{ pageSaving ? 'Kaydediliyor…' : 'Kaydet' }}
      </button>
    </div>

    <!-- ANA SEKMELER -->
    <div class="admin-tabs" style="margin-bottom:1.5rem;">
      <button class="admin-tab" :class="{ 'admin-tab--active': tab === 'yazilar' }" @click="tab = 'yazilar'">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Yazılar
        <span v-if="posts?.length" style="margin-left:4px;background:#e0eaf5;color:#1b4f72;padding:1px 7px;border-radius:99px;font-size:0.75rem;font-weight:700;">{{ posts.length }}</span>
      </button>
      <button class="admin-tab" :class="{ 'admin-tab--active': tab === 'sayfa' }" @click="tab = 'sayfa'">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        Sayfa Hero
      </button>
    </div>

    <!-- ── YAZILAR SEKMESİ ── -->
    <div v-if="tab === 'yazilar'">
      <div v-if="pending" class="admin-loading">Yükleniyor…</div>
      <div v-else-if="!posts?.length" class="admin-empty">Henüz blog yazısı yok.</div>
      <table v-else class="admin-table">
        <thead>
          <tr>
            <th>Başlık</th>
            <th>Kategori</th>
            <th>Tarih</th>
            <th>Yayın</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in posts" :key="post.id">
            <td>{{ post.title }}</td>
            <td>{{ post.category }}</td>
            <td>{{ post.date }}</td>
            <td>
              <button
                :class="['admin-toggle', post.published ? 'admin-toggle--on' : 'admin-toggle--off']"
                @click="togglePublished(post)"
              >
                {{ post.published ? 'Yayında' : 'Taslak' }}
              </button>
            </td>
            <td class="admin-actions">
              <NuxtLink :to="`/admin/blog/${post.id}`" class="btn-admin-sm">Düzenle</NuxtLink>
              <button class="btn-admin-sm btn-admin-sm--danger" @click="deletePost(post.id)">Sil</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── SAYFA HERO SEKMESİ ── -->
    <div v-if="tab === 'sayfa'">
      <div v-if="pageError" class="admin-login-error">{{ pageError }}</div>
      <div v-if="pageSuccess" class="admin-success">Hero ayarları kaydedildi.</div>
      <div class="admin-form">
        <div class="admin-form__grid">
          <div class="form-group">
            <label>Hero Eyebrow</label>
            <input v-model="pageForm.heroEyebrow" type="text" placeholder="Blog · Yazılar" />
          </div>
          <div class="form-group">
            <label>Hero Başlık</label>
            <input v-model="pageForm.heroTitle" type="text" placeholder="Blog" />
          </div>
        </div>
        <div class="form-group">
          <label>Hero Alt Yazı</label>
          <textarea v-model="pageForm.heroLead" rows="2" placeholder="İşitme sağlığı ve işitme cihazları üzerine..." />
        </div>
        <div class="form-group">
          <label>Hero Arka Plan Görseli</label>
          <input v-model="pageForm.heroBgImage" type="text" placeholder="/uploads/..." />
          <ImageUpload v-model="pageForm.heroBgImage" @uploaded="(url: string) => pageForm.heroBgImage = url" />
        </div>
        <!-- Önizleme -->
        <div v-if="pageForm.heroBgImage" style="margin-top:0.5rem;">
          <img :src="pageForm.heroBgImage" style="max-height:140px;border-radius:10px;object-fit:cover;width:100%;" alt="Önizleme" />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

// ── SEKMELER ───────────────────────────────────────────────────
const tab = ref<'yazilar' | 'sayfa'>('yazilar')

// ── YAZILAR ────────────────────────────────────────────────────
const { data: posts, pending, refresh } = await useFetch<any[]>('/api/admin/blog')

async function togglePublished(post: any) {
  await $fetch(`/api/admin/blog/${post.id}`, {
    method: 'PUT',
    body: { ...post, published: post.published ? 0 : 1 },
  })
  await refresh()
}

async function deletePost(id: number) {
  if (!confirm('Bu yazıyı silmek istediğinize emin misiniz?')) return
  await $fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
  await refresh()
}

// ── SAYFA HERO ─────────────────────────────────────────────────
interface BlogPageForm { heroEyebrow: string; heroTitle: string; heroLead: string; heroBgImage: string }

const { data: rawPage } = await useFetch<BlogPageForm>('/api/admin/blog-page')

const pageForm = reactive<BlogPageForm>({
  heroEyebrow: '', heroTitle: '', heroLead: '', heroBgImage: ''
})

watch(rawPage, (val) => {
  if (!val) return
  Object.assign(pageForm, val)
}, { immediate: true })

const pageSaving = ref(false)
const pageError  = ref('')
const pageSuccess = ref(false)

async function savePage() {
  pageSaving.value  = true
  pageError.value   = ''
  pageSuccess.value = false
  try {
    await $fetch('/api/admin/blog-page', { method: 'PUT', body: pageForm })
    pageSuccess.value = true
    setTimeout(() => (pageSuccess.value = false), 3000)
  } catch (err: any) {
    pageError.value = err?.data?.message || 'Bir hata oluştu.'
  } finally {
    pageSaving.value = false
  }
}
</script>
