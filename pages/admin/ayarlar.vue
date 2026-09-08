<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1>Site Ayarları</h1>
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

      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'genel' }">
        <h2 class="admin-form__section-title">Genel Bilgiler</h2>
        <div class="admin-form__grid">
          <div class="form-group">
            <label>Site Adı / Marka</label>
            <input v-model="form.name" type="text" />
          </div>
          <div class="form-group">
            <label>Başlık Sonu</label>
            <input v-model="form.title_suffix" type="text" placeholder="Ev-Mobil" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Meta Açıklama</label>
            <textarea v-model="form.description" rows="2" />
          </div>
          <div class="form-group">
            <label>Telefon</label>
            <input v-model="form.phone" type="text" placeholder="05551234567" />
          </div>
          <div class="form-group">
            <label>Telefon Görüntüleme</label>
            <input v-model="form.phone_display" type="text" placeholder="0555 123 45 67" />
          </div>
          <div class="form-group">
            <label>E-posta</label>
            <input v-model="form.email" type="email" />
          </div>
          <div class="form-group">
            <label>Çalışma Saatleri</label>
            <input v-model="form.working_hours" type="text" placeholder="Pzt–Cum 09:00–18:00" />
          </div>
        </div>
      </div>

      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'tema' }">
        <h2 class="admin-form__section-title">Renk Paleti</h2>
        <p class="admin-form__hint">Butonlar, linkler, vurgu alanları ve genel tema rengi bu seçimle güncellenir.</p>
        <div class="theme-palette-grid">
          <label
            v-for="palette in paletteOptions"
            :key="palette.id"
            class="theme-palette-card"
            :class="{ 'theme-palette-card--active': form.theme_palette === palette.id }"
          >
            <input v-model="form.theme_palette" type="radio" :value="palette.id" />
            <div class="theme-palette-card__swatches">
              <span
                v-for="(color, index) in palette.preview"
                :key="`${palette.id}-${index}`"
                class="theme-palette-card__swatch"
                :style="{ background: color }"
              />
            </div>
            <strong>{{ palette.label }}</strong>
            <span>{{ palette.description }}</span>
          </label>
        </div>

        <div class="theme-custom-toggle">
          <label>
            <input v-model="form.custom_theme_enabled" type="checkbox" />
            Özel renkleri kullan
          </label>
          <p>Kapatıldığında seçilen preset palet uygulanır.</p>
        </div>

        <div v-if="form.custom_theme_enabled" class="theme-custom-grid">
          <label class="theme-color-field">
            <span>Ana Renk</span>
            <input v-model="form.custom_primary" type="color" />
            <small>{{ form.custom_primary }}</small>
          </label>
          <label class="theme-color-field">
            <span>Ana Renk (Koyu)</span>
            <input v-model="form.custom_primary_deep" type="color" />
            <small>{{ form.custom_primary_deep }}</small>
          </label>
          <label class="theme-color-field">
            <span>Koyu Zemin</span>
            <input v-model="form.custom_surface_dark" type="color" />
            <small>{{ form.custom_surface_dark }}</small>
          </label>
          <label class="theme-color-field">
            <span>Kontrast Metin</span>
            <input v-model="form.custom_accent_contrast" type="color" />
            <small>{{ form.custom_accent_contrast }}</small>
          </label>
        </div>
      </div>

      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'adres' }">
        <h2 class="admin-form__section-title">Adres Bilgileri</h2>
        <div class="admin-form__grid">
          <div class="form-group" style="grid-column:1/-1">
            <label>Sokak / Mahalle</label>
            <input v-model="form.address_street" type="text" />
          </div>
          <div class="form-group">
            <label>İlçe</label>
            <input v-model="form.address_region" type="text" placeholder="Hopa" />
          </div>
          <div class="form-group">
            <label>Şehir</label>
            <input v-model="form.address_city" type="text" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Google Maps URL</label>
            <input v-model="form.maps_url" type="text" placeholder="https://maps.google.com/..." />
          </div>
        </div>
      </div>

      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'sosyal' }">
        <h2 class="admin-form__section-title">Sosyal Medya</h2>
        <div class="admin-form__grid">
          <div class="form-group">
            <label>Instagram URL</label>
            <input v-model="form.social_instagram" type="text" placeholder="https://instagram.com/..." />
          </div>
          <div class="form-group">
            <label>LinkedIn URL</label>
            <input v-model="form.social_linkedin" type="text" placeholder="https://linkedin.com/in/..." />
          </div>
        </div>
      </div>

      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'gorseller' }">
        <h2 class="admin-form__section-title">Sistem Görselleri</h2>
        <p class="admin-form__hint">Anasayfa hero görseli artık Anasayfa yönetimindeki Hero bölümünden düzenlenir.</p>
        <div class="admin-form__grid">
          <div class="form-group" style="grid-column:1/-1">
            <label>OG / Paylaşım Görseli</label>
            <ImageUpload v-model="form.og_image" @uploaded="handleSave" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Favicon (Sekme İkonu)</label>
            <ImageUpload
              v-model="form.favicon"
              accept="image/png,image/svg+xml"
              label="Favicon yükle"
              hint="Kare PNG veya SVG önerilir · max 5 MB"
              @uploaded="handleSave"
            />
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
import { defaultThemePaletteId, themePalettes } from "~/utils/theme-palettes"

definePageMeta({ layout: "admin", middleware: "admin" })

const activeTab = ref("genel")
const paletteOptions = themePalettes

const tabs = [
  { key: "genel", label: "Genel", icon: '<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/>' },
  { key: "tema", label: "Tema", icon: '<circle cx="6" cy="12" r="3"/><circle cx="12" cy="7" r="3"/><circle cx="18" cy="12" r="3"/><circle cx="12" cy="17" r="3"/>' },
  { key: "adres", label: "Adres", icon: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>' },
  { key: "sosyal", label: "Sosyal Medya", icon: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>' },
  { key: "gorseller", label: "Görseller", icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>' },
]

const { data: raw, pending } = await useFetch<Record<string, any>>("/api/admin/settings")

const form = reactive({
  name: "",
  title_suffix: "",
  description: "",
  phone: "",
  phone_display: "",
  email: "",
  address_street: "",
  address_region: "",
  address_city: "",
  working_hours: "",
  maps_url: "",
  social_instagram: "",
  social_linkedin: "",
  theme_palette: defaultThemePaletteId,
  custom_theme_enabled: false,
  custom_primary: "#c9a35a",
  custom_primary_deep: "#9a7030",
  custom_surface_dark: "#2a3347",
  custom_accent_contrast: "#1a1209",
  og_image: "",
  favicon: "",
})

watch(raw, (val) => {
  if (!val) return
  form.name = val.name || ""
  form.title_suffix = val.title_suffix || val.name || ""
  form.description = val.description || ""
  form.phone = val.phone || ""
  form.phone_display = val.phone_display || ""
  form.email = val.email || ""
  form.address_street = val.address_street || ""
  form.address_region = val.address_region || ""
  form.address_city = val.address_city || ""
  form.working_hours = val.working_hours || ""
  form.maps_url = val.maps_url || ""
  form.social_instagram = val.social_instagram || ""
  form.social_linkedin = val.social_linkedin || ""
  form.theme_palette = val.theme_palette || defaultThemePaletteId
  form.custom_theme_enabled = Boolean(val.custom_theme_enabled)
  form.custom_primary = val.custom_primary || "#c9a35a"
  form.custom_primary_deep = val.custom_primary_deep || "#9a7030"
  form.custom_surface_dark = val.custom_surface_dark || "#2a3347"
  form.custom_accent_contrast = val.custom_accent_contrast || "#1a1209"
  form.og_image = val.og_image || ""
  form.favicon = val.favicon || ""
}, { immediate: true })

const saving = ref(false)
const saveError = ref("")
const saveSuccess = ref(false)

async function handleSave() {
  await nextTick()
  saving.value = true
  saveError.value = ""
  saveSuccess.value = false
  try {
    await $fetch("/api/admin/settings", { method: "PUT", body: form })
    saveSuccess.value = true
    setTimeout(() => (saveSuccess.value = false), 3000)
  } catch (err: any) {
    saveError.value = err?.data?.message || "Bir hata oluştu."
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.admin-form__hint {
  margin: 0 0 1rem;
  color: #6b7280;
  font-size: 0.92rem;
}

.theme-palette-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.theme-palette-card {
  display: grid;
  gap: 0.65rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.theme-palette-card input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.theme-palette-card:hover,
.theme-palette-card--active {
  border-color: #111827;
  box-shadow: 0 8px 24px rgba(17, 24, 39, 0.08);
  transform: translateY(-1px);
}

.theme-palette-card strong {
  font-size: 0.98rem;
  color: #111827;
}

.theme-palette-card span {
  color: #6b7280;
  font-size: 0.88rem;
  line-height: 1.45;
}

.theme-palette-card__swatches {
  display: flex;
  gap: 0.45rem;
}

.theme-palette-card__swatch {
  width: 100%;
  height: 18px;
  border-radius: 999px;
}

.theme-custom-toggle {
  margin-top: 1rem;
  display: grid;
  gap: 0.35rem;
}

.theme-custom-toggle label {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-weight: 600;
  color: #111827;
}

.theme-custom-toggle p {
  margin: 0;
  color: #6b7280;
  font-size: 0.88rem;
}

.theme-custom-grid {
  margin-top: 0.9rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.8rem;
}

.theme-color-field {
  display: grid;
  gap: 0.4rem;
  padding: 0.7rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.theme-color-field span {
  font-size: 0.82rem;
  font-weight: 600;
  color: #111827;
}

.theme-color-field input[type="color"] {
  width: 100%;
  height: 38px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 0.2rem;
  background: #fff;
}

.theme-color-field small {
  color: #6b7280;
  font-size: 0.78rem;
  text-transform: uppercase;
}
</style>
