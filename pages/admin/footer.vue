<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1>Footer Ayarları</h1>
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

      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'brand' }">
        <h2 class="admin-form__section-title">Marka Alanı</h2>
        <div class="admin-form__grid">
          <div class="form-group" style="grid-column:1/-1">
            <label>Footer Açıklaması</label>
            <textarea v-model="form.footer_tagline" rows="2" placeholder="Footer'da markanın altında görünecek kısa açıklama..." />
          </div>
          <div class="form-group">
            <label>Hizmetler Başlığı</label>
            <input v-model="form.footer_services_title" type="text" placeholder="Hizmetler" />
          </div>
          <div class="form-group">
            <label>Menü Başlığı</label>
            <input v-model="form.footer_menu_title" type="text" placeholder="Kurumsal" />
          </div>
          <div class="form-group">
            <label>İletişim Başlığı</label>
            <input v-model="form.footer_contact_title" type="text" placeholder="İletişim" />
          </div>
        </div>
      </div>

      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'menus' }">
        <h2 class="admin-form__section-title">Footer Menü Linkleri</h2>
        <div
          v-for="(item, i) in form.footer_menu_items"
          :key="`footer-menu-${i}`"
          class="admin-form__repeater-row admin-form__grid"
        >
          <div class="form-group">
            <label>Metin</label>
            <input v-model="item.label" type="text" placeholder="Hakkımda" />
          </div>
          <div class="form-group">
            <label>Bağlantı</label>
            <div class="admin-inline-group">
              <input v-model="item.to" type="text" placeholder="/hakkimda" />
              <button type="button" class="btn-admin-sm" :disabled="i === 0" @click="moveFooterItem(form.footer_menu_items, i, -1)">
                Yukarı
              </button>
              <button type="button" class="btn-admin-sm" :disabled="i === form.footer_menu_items.length - 1" @click="moveFooterItem(form.footer_menu_items, i, 1)">
                Aşağı
              </button>
              <button type="button" class="btn-admin-danger-sm" @click="form.footer_menu_items.splice(i, 1)">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>
        <button type="button" class="btn-admin-secondary" @click="form.footer_menu_items.push(createSiteLinkItem())">
          Footer Linki Ekle
        </button>

        <h2 class="admin-form__section-title" style="margin-top:2rem;">Alt Yasal Linkler</h2>
        <div
          v-for="(item, i) in form.footer_legal_links"
          :key="`footer-legal-${i}`"
          class="admin-form__repeater-row admin-form__grid"
        >
          <div class="form-group">
            <label>Metin</label>
            <input v-model="item.label" type="text" placeholder="Gizlilik Politikası" />
          </div>
          <div class="form-group">
            <label>Bağlantı</label>
            <div class="admin-inline-group">
              <input v-model="item.to" type="text" placeholder="/gizlilik" />
              <button type="button" class="btn-admin-sm" :disabled="i === 0" @click="moveFooterItem(form.footer_legal_links, i, -1)">
                Yukarı
              </button>
              <button type="button" class="btn-admin-sm" :disabled="i === form.footer_legal_links.length - 1" @click="moveFooterItem(form.footer_legal_links, i, 1)">
                Aşağı
              </button>
              <button type="button" class="btn-admin-danger-sm" @click="form.footer_legal_links.splice(i, 1)">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>
        <button type="button" class="btn-admin-secondary" @click="form.footer_legal_links.push(createSiteLinkItem())">
          Yasal Link Ekle
        </button>
      </div>

      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'bottom' }">
        <h2 class="admin-form__section-title">Alt Alan</h2>
        <div class="admin-form__grid">
          <div class="form-group" style="grid-column:1/-1">
            <label>Alt Satır Metni</label>
            <input v-model="form.footer_bottom_text" type="text" placeholder="© 2026 ..." />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Önizleme</label>
            <div class="admin-logo-preview">
              <div class="admin-logo-preview__text">
                <strong>{{ form.footer_bottom_text || '© 2026 Marka Adı. Tüm hakları saklıdır.' }}</strong>
                <span>{{ legalLinksPreview }}</span>
                <small>Footer Alt Alanı</small>
              </div>
            </div>
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
import type { SiteLinkItem } from "~/utils/site-settings"
import { createSiteLinkItem } from "~/utils/site-settings"

definePageMeta({ layout: "admin", middleware: "admin" })

const activeTab = ref("brand")

const tabs = [
  { key: "brand", label: "Marka", icon: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>' },
  { key: "menus", label: "Menüler", icon: '<path d="M3 5h18"/><path d="M3 12h18"/><path d="M3 19h18"/>' },
  { key: "bottom", label: "Alt Alan", icon: '<path d="M3 19h18"/><path d="M7 15h10"/><path d="M9 11h6"/>' },
]

const { data: raw, pending } = await useFetch<Record<string, any>>("/api/admin/footer")

const form = reactive({
  footer_tagline: "",
  footer_services_title: "",
  footer_menu_title: "",
  footer_menu_items: [] as SiteLinkItem[],
  footer_contact_title: "",
  footer_bottom_text: "",
  footer_legal_links: [] as SiteLinkItem[],
})

watch(raw, (val) => {
  if (!val) return
  form.footer_tagline = val.footer_tagline || ""
  form.footer_services_title = val.footer_services_title || "Hizmetler"
  form.footer_menu_title = val.footer_menu_title || "Kurumsal"
  form.footer_menu_items = Array.isArray(val.footer_menu_items) ? val.footer_menu_items : []
  form.footer_contact_title = val.footer_contact_title || "İletişim"
  form.footer_bottom_text = val.footer_bottom_text || ""
  form.footer_legal_links = Array.isArray(val.footer_legal_links) ? val.footer_legal_links : []
}, { immediate: true })

const legalLinksPreview = computed(() => {
  if (!form.footer_legal_links.length) return "Yasal linkler burada listelenir."
  return form.footer_legal_links.map((item) => item.label).filter(Boolean).join(" · ")
})

function moveFooterItem(items: SiteLinkItem[], index: number, delta: -1 | 1) {
  const nextIndex = index + delta
  if (nextIndex < 0 || nextIndex >= items.length) return
  ;[items[index], items[nextIndex]] = [items[nextIndex]!, items[index]!]
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
    await $fetch("/api/admin/footer", { method: "PUT", body: form })
    saveSuccess.value = true
    setTimeout(() => (saveSuccess.value = false), 3000)
  } catch (err: any) {
    saveError.value = err?.data?.message || "Bir hata oluştu."
  } finally {
    saving.value = false
  }
}
</script>
