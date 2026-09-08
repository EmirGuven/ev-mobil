<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1>Yasal Sayfalar</h1>
    </div>

    <div v-if="pending" class="admin-loading">Yükleniyor…</div>
    <div v-else>
      <div v-if="saveError" class="admin-login-error">{{ saveError }}</div>
      <div v-if="saveSuccess" class="admin-success">Sayfalar kaydedildi!</div>

      <!-- Sekme navigasyonu -->
      <div class="legal-tabs">
        <button
          v-for="p in pages"
          :key="p.slug"
          class="legal-tab"
          :class="{ 'is-active': activeTab === p.slug }"
          @click="activeTab = p.slug"
        >{{ p.label }}</button>
      </div>

      <div v-for="p in pages" v-show="activeTab === p.slug" :key="p.slug" class="admin-form">
        <div class="form-group">
          <label>Sayfa Başlığı</label>
          <input v-model="p.title" type="text" />
        </div>
        <div class="form-group">
          <label>
            İçerik
            <span class="form-note" style="display:inline;margin-left:0.5rem;">
              (Markdown desteklenir: # Başlık, ## Alt Başlık, **kalın**)
            </span>
          </label>
          <textarea v-model="p.content" rows="20" style="font-family:monospace;font-size:0.85rem;" />
        </div>
        <div class="legal-preview" v-html="renderMarkdown(p.content)" />
      </div>

      <div class="admin-form__actions">
        <button class="btn-admin-primary" :disabled="saving" @click="handleSave">
          {{ saving ? 'Kaydediliyor…' : 'Sayfaları Kaydet' }}
        </button>
        <a
          v-if="activeTab"
          :href="`/${activeTab}`"
          target="_blank"
          class="btn-admin-secondary"
        >Önizle →</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

interface LegalPageRow { slug: string; title: string; content: string; updated_at?: string }
interface PageItem { slug: string; label: string; title: string; content: string }

const SLUGS = [
  { slug: 'gizlilik',          label: 'Gizlilik Politikası' },
  { slug: 'kullanim-kosullari', label: 'Kullanım Koşulları' },
  { slug: 'kvkk',              label: 'KVKK Aydınlatma Metni' },
]

const { data: raw, pending } = await useFetch<LegalPageRow[]>('/api/admin/legal')

const pages     = ref<PageItem[]>([])
const activeTab = ref('gizlilik')

watch(raw, (val) => {
  pages.value = SLUGS.map(s => {
    const found = val?.find(r => r.slug === s.slug)
    return { slug: s.slug, label: s.label, title: found?.title || s.label, content: found?.content || '' }
  })
}, { immediate: true })

function renderMarkdown(text: string): string {
  if (!text) return ''
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .split('\n\n')
    .map(p => p.startsWith('<h') ? p : `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n')
}

const saving     = ref(false)
const saveError  = ref('')
const saveSuccess = ref(false)

async function handleSave() {
  saving.value = true
  saveError.value = ''
  saveSuccess.value = false
  try {
    await $fetch('/api/admin/legal', {
      method: 'PUT',
      body: pages.value.map(p => ({ slug: p.slug, title: p.title, content: p.content }))
    })
    saveSuccess.value = true
    setTimeout(() => (saveSuccess.value = false), 3000)
  } catch (err: any) {
    saveError.value = err?.data?.message || 'Bir hata oluştu.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.legal-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 1.5rem;
}
.legal-tab {
  padding: 0.6rem 1.25rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
  color: #718096;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.15s;
}
.legal-tab:hover   { color: #2d3748; }
.legal-tab.is-active {
  color: var(--primary, #1a5276);
  border-bottom-color: var(--primary, #1a5276);
  font-weight: 600;
}
.legal-preview {
  margin-top: 1rem;
  padding: 1.25rem;
  border: 1px dashed #cbd5e0;
  border-radius: 8px;
  background: #f8fafc;
  max-height: 300px;
  overflow-y: auto;
  font-size: 0.88rem;
  color: #4a5568;
  line-height: 1.7;
}
.legal-preview :deep(h1) { font-size: 1.3rem; margin: 0.5rem 0; }
.legal-preview :deep(h2) { font-size: 1.1rem; margin: 0.75rem 0 0.4rem; color: var(--primary, #1a5276); }
.legal-preview :deep(h3) { font-size: 0.95rem; margin: 0.5rem 0; }
.legal-preview :deep(p)  { margin-bottom: 0.5rem; }
.btn-admin-secondary {
  display: inline-flex;
  align-items: center;
  padding: 0.55rem 1.25rem;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #4a5568;
  text-decoration: none;
  background: #fff;
  transition: background 0.15s;
}
.btn-admin-secondary:hover { background: #edf2f7; }
</style>
