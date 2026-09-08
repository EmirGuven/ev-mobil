<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1>İletişim Sayfası</h1>
    </div>

    <div v-if="pending" class="admin-loading">Yükleniyor…</div>
    <form v-else class="admin-form" @submit.prevent="handleSave">
      <div v-if="saveError"   class="admin-login-error">{{ saveError }}</div>
      <div v-if="saveSuccess" class="admin-success">Değişiklikler kaydedildi.</div>

      <!-- TABS -->
      <div class="admin-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="admin-tab"
          :class="{ 'admin-tab--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >{{ tab.label }}</button>
      </div>

      <!-- HERO -->
      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'hero' }">
        <h2 class="admin-form__section-title">Hero Bölümü</h2>
        <div class="admin-form__grid">
          <div class="form-group">
            <label>Üst Etiket</label>
            <input v-model="form.hero_eyebrow" type="text" placeholder="İletişim" />
          </div>
          <div class="form-group">
            <label>Ana Başlık</label>
            <input v-model="form.hero_title" type="text" placeholder="İletişim ve Teklif Talebi" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Öncü Metin</label>
            <textarea v-model="form.hero_lead" rows="3" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Hero Arka Plan Görseli</label>
            <ImageUpload v-model="form.hero_bg_image" @uploaded="handleSave" />
            <p style="font-size:0.75rem;color:#9ca3af;margin:4px 0 0">Boş bırakılırsa varsayılan koyu renk kullanılır.</p>
          </div>
        </div>
      </div>

      <!-- BİLGİ KUTUSU -->
      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'info' }">
        <h2 class="admin-form__section-title">İletişim Bilgileri Kutusu</h2>
        <div class="admin-form__grid">
          <div class="form-group">
            <label>Başlık</label>
            <input v-model="form.info_title" type="text" placeholder="İletişim Bilgileri" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Açıklama</label>
            <textarea v-model="form.info_lead" rows="2" />
          </div>
          <div class="form-group">
            <label>E-posta</label>
            <input v-model="form.email" type="email" placeholder="bilgi@ev-mobil.com.tr" />
          </div>
        </div>
      </div>

      <!-- FORM -->
      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'form' }">
        <h2 class="admin-form__section-title">Teklif Formu</h2>
        <div class="admin-form__grid">
          <div class="form-group">
            <label>Form Başlığı</label>
            <input v-model="form.form_title" type="text" placeholder="Teklif Talebi" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Form Açıklaması</label>
            <textarea v-model="form.form_lead" rows="2" />
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'cta' }">
        <h2 class="admin-form__section-title">Alt CTA Bölümü</h2>
        <AdminCtaPreview
          :title="form.cta_title || 'Hızlı Ulaşım'"
          :lead="form.cta_lead || 'Formu doldurmak yerine doğrudan telefon veya e-posta ile de ulaşabilirsiniz.'"
          :background-image="form.cta_bg_image"
          :primary-label="form.cta_primary_label || 'E-posta Gönder'"
          :secondary-label="form.cta_secondary_label || 'Telefon Et'"
        />
        <div class="admin-form__grid">
          <div class="form-group">
            <label>Başlık</label>
            <input v-model="form.cta_title" type="text" placeholder="Hızlı Ulaşım" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Açıklama</label>
            <textarea v-model="form.cta_lead" rows="2" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>CTA Arka Plan Görseli</label>
            <input v-model="form.cta_bg_image" type="text" placeholder="/uploads/cta-contact.jpg" />
            <ImageUpload v-model="form.cta_bg_image" @uploaded="(url: string) => form.cta_bg_image = url" />
          </div>
          <div class="form-group">
            <label>Birincil Buton Metni</label>
            <input v-model="form.cta_primary_label" type="text" placeholder="E-posta Gönder" />
          </div>
          <div class="form-group">
            <label>Birincil Buton Linki</label>
            <input v-model="form.cta_primary_url" type="text" placeholder="mailto:ornek@email.com" />
          </div>
          <div class="form-group">
            <label>İkincil Buton Metni</label>
            <input v-model="form.cta_secondary_label" type="text" placeholder="Telefon Et" />
          </div>
          <div class="form-group">
            <label>İkincil Buton Linki</label>
            <input v-model="form.cta_secondary_url" type="text" placeholder="tel:+905551112233" />
          </div>
        </div>
      </div>

      <!-- KAYDET -->
      <div class="admin-form__actions">
        <button type="submit" class="btn-admin-primary" :disabled="saving">
          {{ saving ? 'Kaydediliyor…' : 'Kaydet' }}
        </button>
        <a href="/iletisim" target="_blank" class="btn-admin-secondary">Sayfayı Önizle →</a>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const activeTab = ref('hero')
const tabs = [
  { key: 'hero', label: 'Hero' },
  { key: 'info', label: 'Bilgi Kutusu' },
  { key: 'form', label: 'Form' },
  { key: 'cta',  label: 'CTA' },
]

const form = reactive({
  hero_eyebrow:  '',
  hero_title:    '',
  hero_lead:     '',
  hero_bg_image: '',
  info_title:    '',
  info_lead:     '',
  email:         '',
  form_title:    '',
  form_lead:     '',
  cta_title:     '',
  cta_lead:      '',
  cta_bg_image:  '',
  cta_primary_label: '',
  cta_primary_url: '',
  cta_secondary_label: '',
  cta_secondary_url: '',
})

const { data: raw, pending } = await useFetch<Record<string, any>>('/api/admin/contact')

watch(raw, (val) => {
  if (!val) return
  form.hero_eyebrow  = val.hero_eyebrow  || ''
  form.hero_title    = val.hero_title    || ''
  form.hero_lead     = val.hero_lead     || ''
  form.hero_bg_image = val.hero_bg_image || ''
  form.info_title    = val.info_title    || ''
  form.info_lead     = val.info_lead     || ''
  form.email         = val.email         || ''
  form.form_title    = val.form_title    || ''
  form.form_lead     = val.form_lead     || ''
  form.cta_title     = val.cta_title     || ''
  form.cta_lead      = val.cta_lead      || ''
  form.cta_bg_image  = val.cta_bg_image  || ''
  form.cta_primary_label = val.cta_primary_label || ''
  form.cta_primary_url = val.cta_primary_url || ''
  form.cta_secondary_label = val.cta_secondary_label || ''
  form.cta_secondary_url = val.cta_secondary_url || ''
}, { immediate: true })

const saving      = ref(false)
const saveError   = ref('')
const saveSuccess = ref(false)

async function handleSave() {
  await nextTick()
  saving.value = true
  saveError.value = ''
  saveSuccess.value = false
  try {
    await $fetch('/api/admin/contact', { method: 'PUT', body: { ...form } })
    saveSuccess.value = true
    setTimeout(() => (saveSuccess.value = false), 3000)
  } catch (err: any) {
    saveError.value = err?.data?.message || 'Bir hata oluştu.'
  } finally {
    saving.value = false
  }
}
</script>
