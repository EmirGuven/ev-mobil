<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1>Header Ayarları</h1>
    </div>

    <div v-if="pending" class="admin-loading">Yükleniyor…</div>
    <form v-else class="admin-form" @submit.prevent="handleSave">
      <div v-if="saveError" class="admin-login-error">{{ saveError }}</div>
      <div v-if="saveSuccess" class="admin-success">Değişiklikler kaydedildi.</div>

      <div class="admin-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="admin-tab"
          :class="{ 'admin-tab--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="tab.icon" />
          {{ tab.label }}
        </button>
      </div>

      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'logo' }">
        <h2 class="admin-form__section-title">Logo</h2>
        <div class="admin-form__grid">
          <div class="form-group">
            <label>Marka Adı</label>
            <input :value="form.name || 'Marka Adı'" type="text" disabled />
            <small class="admin-form__hint">Bu alan Site Ayarları sayfasındaki genel bilgilerden yönetilir.</small>
          </div>
          <div class="form-group">
            <label>Logo Tipi</label>
            <select v-model="form.logo_type">
              <option value="text">Yazı</option>
              <option value="image">Resim</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Logo Alt Yazısı</label>
            <input v-model="form.logo_tagline" type="text" placeholder="Frigolu · Parsiyel · Kara Taşımacılığı" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Logo Önizleme</label>
            <div class="admin-logo-preview">
              <img
                v-if="hasImageLogo"
                :src="form.logo_image"
                :alt="form.name || 'Logo'"
                class="admin-logo-preview__image"
              >
              <div v-else class="admin-logo-preview__text">
                <strong>{{ logoPreviewParts[0] }}</strong>
                <span v-if="logoPreviewParts[1]">{{ logoPreviewParts[1] }}</span>
                <small>{{ form.logo_tagline }}</small>
              </div>
            </div>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Logo Görseli</label>
            <input v-model="form.logo_image" type="text" placeholder="/uploads/logo.png" />
            <ImageUpload v-model="form.logo_image" @uploaded="(url: string) => form.logo_image = url" />
          </div>
        </div>
      </div>

      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'menu' }">
        <h2 class="admin-form__section-title">Header Menü Öğeleri</h2>
        <div
          v-for="(item, i) in form.header_menu_items"
          :key="`header-${i}`"
          class="admin-form__repeater-row admin-form__grid"
        >
          <div class="form-group">
            <label>Menü Metni</label>
            <input v-model="item.label" type="text" placeholder="Ana Sayfa" />
          </div>
          <div class="form-group">
            <label>Tür</label>
            <select v-model="item.type">
              <option value="link">Normal Link</option>
              <option value="services">Hizmet Açılır Menü</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Bağlantı</label>
            <div class="admin-inline-group">
              <input
                v-model="item.to"
                type="text"
                :disabled="item.type === 'services'"
                :placeholder="item.type === 'services' ? 'Bu tipte link kullanılmaz' : '/hakkimda'"
              />
              <button type="button" class="btn-admin-sm" :disabled="i === 0" @click="moveHeaderItem(i, -1)">
                Yukarı
              </button>
              <button type="button" class="btn-admin-sm" :disabled="i === form.header_menu_items.length - 1" @click="moveHeaderItem(i, 1)">
                Aşağı
              </button>
              <button type="button" class="btn-admin-danger-sm" @click="form.header_menu_items.splice(i, 1)">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>
        <div class="admin-form__actions" style="justify-content:flex-start;">
          <button type="button" class="btn-admin-secondary" @click="form.header_menu_items.push(createHeaderMenuItem('link'))">
            Link Ekle
          </button>
          <button type="button" class="btn-admin-secondary" @click="form.header_menu_items.push(createHeaderMenuItem('services'))">
            Hizmet Menüsü Ekle
          </button>
        </div>
      </div>

      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'cta' }">
        <h2 class="admin-form__section-title">Header CTA</h2>
        <div class="admin-form__grid">
          <div class="form-group">
            <label>Buton Metni</label>
            <input v-model="form.header_cta_label" type="text" placeholder="Teklif Al" />
          </div>
          <div class="form-group">
            <label>Buton Linki</label>
            <input v-model="form.header_cta_url" type="text" placeholder="/iletisim" />
          </div>
        </div>
      </div>

      <div class="admin-form__actions">
        <button type="submit" class="btn-admin-primary" :disabled="saving">
          {{ saving ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { HeaderMenuItem } from "~/utils/site-settings"
import { createHeaderMenuItem } from "~/utils/site-settings"

definePageMeta({ layout: "admin", middleware: "admin" })

const activeTab = ref("logo")

const tabs = [
  { key: "logo", label: "Logo", icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>' },
  { key: "menu", label: "Menü", icon: '<path d="M3 5h18"/><path d="M3 12h18"/><path d="M3 19h18"/>' },
  { key: "cta", label: "CTA", icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
]

const { data: raw, pending } = await useFetch<Record<string, any>>("/api/admin/header")

const form = reactive({
  name: "",
  logo_tagline: "",
  logo_type: "text",
  logo_image: "",
  header_cta_label: "",
  header_cta_url: "",
  header_menu_items: [] as HeaderMenuItem[],
})

watch(raw, (val) => {
  if (!val) return
  form.name = val.name || ""
  form.logo_tagline = val.logo_tagline || ""
  form.logo_type = val.logo_type || "text"
  form.logo_image = val.logo_image || ""
  form.header_cta_label = val.header_cta_label || "Randevu Al"
  form.header_cta_url = val.header_cta_url || "/iletisim"
  form.header_menu_items = Array.isArray(val.header_menu_items) ? val.header_menu_items : []
}, { immediate: true })

const hasImageLogo = computed(() => form.logo_type === "image" && !!form.logo_image)
const logoPreviewParts = computed(() => {
  const value = form.name || "Marka Adı"
  const splitIndex = value.lastIndexOf(" ")
  return splitIndex > 0 ? [value.slice(0, splitIndex), value.slice(splitIndex + 1)] : [value, ""]
})

function moveHeaderItem(index: number, delta: -1 | 1) {
  const nextIndex = index + delta
  if (nextIndex < 0 || nextIndex >= form.header_menu_items.length) return
  ;[form.header_menu_items[index], form.header_menu_items[nextIndex]] = [form.header_menu_items[nextIndex]!, form.header_menu_items[index]!]
}

const saving = ref(false)
const saveError = ref("")
const saveSuccess = ref(false)

async function handleSave() {
  await nextTick()
  saving.value = true
  saveError.value = ""
  saveSuccess.value = false
  try {
    await $fetch("/api/admin/header", { method: "PUT", body: form })
    saveSuccess.value = true
    setTimeout(() => (saveSuccess.value = false), 3000)
  } catch (err: any) {
    saveError.value = err?.data?.message || "Bir hata oluştu."
  } finally {
    saving.value = false
  }
}
</script>
