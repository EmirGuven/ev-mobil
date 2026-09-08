<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1>Anasayfa İçeriği</h1>
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

      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'hero' }">
        <h2 class="admin-form__section-title">Hero Bölümü</h2>
        <div class="admin-form__grid">
          <div class="form-group">
            <label>Üst Etiket</label>
            <input v-model="form.hero_eyebrow" type="text" placeholder="2000'den bu yana tercih edilen ilk isim" />
          </div>
          <div class="form-group">
            <label>Başlık</label>
            <input v-model="form.hero_title" type="text" placeholder="Taşınma Sürecinizi Planlı ve Güvenli Hale Getirin" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Açıklama Paragrafı</label>
            <textarea v-model="form.hero_description" rows="3" />
          </div>
          <div class="form-group">
            <label>Rozet 1</label>
            <input v-model="form.hero_badge1" type="text" placeholder="Ücretsiz Ekspertiz" />
          </div>
          <div class="form-group">
            <label>Rozet 2</label>
            <input v-model="form.hero_badge2" type="text" placeholder="Paketleme ve Montaj" />
          </div>
          <div class="form-group">
            <label>Rozet 3</label>
            <input v-model="form.hero_badge3" type="text" placeholder="C2 yetki belgeli operasyon" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Hero Fotoğrafları</label>
            <ImageUpload
              v-model="heroImageUpload"
              multiple
              label="Hero fotoğrafı yükle"
              hint="Tek veya birden fazla fotoğraf seçebilirsiniz"
              @uploaded="addHeroImage"
            />
            <div v-if="form.hero_images.length" class="hero-image-list">
              <div
                v-for="(image, i) in form.hero_images"
                :key="`${image}-${i}`"
                class="hero-image-list__item"
              >
                <img :src="image" alt="" class="hero-image-list__thumb" />
                <input v-model="form.hero_images[i]" type="text" placeholder="/uploads/hero-slide.jpg" />
                <div class="hero-image-list__actions">
                  <button type="button" class="btn-admin-secondary hero-image-list__btn" :disabled="i === 0" @click="moveHeroImage(i, -1)">↑</button>
                  <button type="button" class="btn-admin-secondary hero-image-list__btn" :disabled="i === form.hero_images.length - 1" @click="moveHeroImage(i, 1)">↓</button>
                  <button type="button" class="btn-admin-danger-sm hero-image-list__btn" @click="removeHeroImage(i)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Birincil Buton Metni</label>
            <input v-model="form.hero_primary_label" type="text" placeholder="Hızlı Teklif İste" />
          </div>
          <div class="form-group">
            <label>Birincil Buton Linki</label>
            <input v-model="form.hero_primary_url" type="text" placeholder="/iletisim" />
          </div>
          <div class="form-group">
            <label>İkincil Buton Metni</label>
            <input v-model="form.hero_secondary_label" type="text" placeholder="Kurumsal" />
          </div>
          <div class="form-group">
            <label>İkincil Buton Linki</label>
            <input v-model="form.hero_secondary_url" type="text" placeholder="/hakkimda" />
          </div>
        </div>
      </div>

      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'accreditations' }">
        <h2 class="admin-form__section-title">Hero Alt Şeridi</h2>
        <p style="font-size:0.85rem;color:#6b7280;margin-bottom:1.25rem;">Hero alanının altındaki güven ve operasyon maddeleri. Her satır bir karttır.</p>
        <div
          v-for="(item, i) in form.accreditations"
          :key="i"
          class="admin-form__repeater-row admin-form__grid"
        >
          <div class="form-group">
            <label>İkon</label>
            <select v-model="item.icon">
              <option v-for="icon in accreditationIconOptions" :key="icon.value" :value="icon.value">
                {{ icon.label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Başlık</label>
            <input v-model="item.title" type="text" placeholder="Parsiyel ve komple yüklemeler" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Açıklama</label>
            <div class="admin-inline-group">
              <textarea v-model="item.description" rows="2" placeholder="Yük tipine göre esnek sevkiyat modeli" />
              <button type="button" class="btn-admin-danger-sm" @click="removeAccreditation(i)">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>
        <button type="button" class="btn-admin-secondary" style="margin-top:0.75rem;" @click="addAccreditation">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          Madde Ekle
        </button>
      </div>

      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'about' }">
        <h2 class="admin-form__section-title">Kurumsal Özet Bölümü</h2>
        <div class="admin-form__grid">
          <div class="form-group">
            <label>Üst Etiket</label>
            <input v-model="form.about_eyebrow" type="text" placeholder="Kurumsal" />
          </div>
          <div class="form-group">
            <label>İsim / Başlık</label>
            <input v-model="form.about_title" type="text" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Unvan</label>
            <input v-model="form.about_role" type="text" placeholder="Frigolu, Kara, Parsiyel ve Özel Taşımacılık" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Birinci Paragraf</label>
            <textarea v-model="form.about_paragraph1" rows="4" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>İkinci Paragraf</label>
            <textarea v-model="form.about_paragraph2" rows="4" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Fotoğraf</label>
            <ImageUpload v-model="form.about_photo" @uploaded="handleSave" />
          </div>
        </div>
      </div>

      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'services' }">
        <h2 class="admin-form__section-title">Hizmetler — Bölüm Başlıkları</h2>
        <div class="admin-form__grid">
          <div class="form-group">
            <label>Üst Etiket</label>
            <input v-model="form.services_eyebrow" type="text" />
          </div>
          <div class="form-group">
            <label>Başlık</label>
            <input v-model="form.services_title" type="text" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Açıklama</label>
            <textarea v-model="form.services_description" rows="2" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Arka Plan Fotoğrafı</label>
            <input v-model="form.services_bg_image" type="text" placeholder="/uploads/services-bg.jpg" />
            <ImageUpload v-model="form.services_bg_image" @uploaded="(url: string) => form.services_bg_image = url" />
          </div>
        </div>

        <h2 class="admin-form__section-title" style="margin-top:2rem;">Hizmet Kartları</h2>
        <div
          v-for="(svc, i) in form.services_items"
          :key="i"
          class="admin-form__repeater-row admin-form__grid"
        >
          <div class="form-group">
            <label>Kart Başlığı</label>
            <input v-model="svc.title" type="text" placeholder="Frigolu Taşıma" />
          </div>
          <div class="form-group">
            <label>URL Slug</label>
            <input v-model="svc.slug" type="text" placeholder="frigolu-tasima" />
          </div>
          <div class="form-group">
            <label>İkon</label>
            <select v-model="svc.icon">
              <option v-for="icon in serviceIconOptions" :key="icon.value" :value="icon.value">
                {{ icon.label }}
              </option>
            </select>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Kısa Açıklama</label>
            <div class="admin-inline-group">
              <textarea v-model="svc.description" rows="2" />
              <button type="button" class="btn-admin-danger-sm" @click="removeService(i)">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>
        <button type="button" class="btn-admin-secondary" @click="addService">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          Hizmet Ekle
        </button>
      </div>

      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'process' }">
        <h2 class="admin-form__section-title">Operasyon Süreci — Bölüm Başlıkları</h2>
        <div class="admin-form__grid">
          <div class="form-group">
            <label>Üst Etiket</label>
            <input v-model="form.process_eyebrow" type="text" />
          </div>
          <div class="form-group">
            <label>Başlık</label>
            <input v-model="form.process_title" type="text" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Açıklama</label>
            <textarea v-model="form.process_description" rows="2" />
          </div>
        </div>

        <h2 class="admin-form__section-title" style="margin-top:2rem;">Adımlar</h2>
        <div
          v-for="(step, i) in form.process_steps"
          :key="i"
          class="admin-form__repeater-row admin-form__grid"
        >
          <div class="form-group">
            <label>Adım Başlığı</label>
            <input v-model="step.title" type="text" />
          </div>
          <div class="form-group">
            <label>Numara</label>
            <input v-model="step.number" type="text" style="max-width:80px" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Açıklama</label>
            <div class="admin-inline-group">
              <textarea v-model="step.description" rows="2" />
              <button type="button" class="btn-admin-danger-sm" @click="removeStep(i)">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>
        <button type="button" class="btn-admin-secondary" @click="addStep">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          Adım Ekle
        </button>
      </div>

      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'testimonials' }">
        <h2 class="admin-form__section-title">Müşteri Yorumları Bölümü</h2>
        <div class="admin-form__grid">
          <div class="form-group">
            <label>Üst Etiket</label>
            <input v-model="form.testimonials_eyebrow" type="text" />
          </div>
          <div class="form-group">
            <label>Başlık</label>
            <input v-model="form.testimonials_title" type="text" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Açıklama</label>
            <textarea v-model="form.testimonials_description" rows="2" />
          </div>
        </div>
      </div>

      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'cta' }">
        <h2 class="admin-form__section-title">Çağrı Bölümü (CTA)</h2>
        <AdminCtaPreview
          :title="form.cta_title || 'Hızlı teklif isteyin'"
          :lead="form.cta_description || 'Parsiyel ve komple yüklemelerden tıbbi cihaz taşımasına kadar sevkiyat detaylarınızı paylaşın, size uygun çözümü hazırlayalım.'"
          :background-image="form.cta_bg_image"
          :primary-label="form.cta_primary_label || 'Hızlı Teklif İste'"
          :secondary-label="form.cta_secondary_label || 'Frigolu Taşıma'"
        />
        <div class="admin-form__grid">
          <div class="form-group">
            <label>Başlık</label>
            <input v-model="form.cta_title" type="text" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Açıklama</label>
            <textarea v-model="form.cta_description" rows="3" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>CTA Arka Plan Görseli</label>
            <input v-model="form.cta_bg_image" type="text" placeholder="/uploads/cta-home.jpg" />
            <ImageUpload v-model="form.cta_bg_image" @uploaded="(url: string) => form.cta_bg_image = url" />
          </div>
          <div class="form-group">
            <label>Birincil Buton Metni</label>
            <input v-model="form.cta_primary_label" type="text" placeholder="Hızlı Teklif İste" />
          </div>
          <div class="form-group">
            <label>Birincil Buton Linki</label>
            <input v-model="form.cta_primary_url" type="text" placeholder="/iletisim" />
          </div>
          <div class="form-group">
            <label>İkincil Buton Metni</label>
            <input v-model="form.cta_secondary_label" type="text" placeholder="Frigolu Taşıma" />
          </div>
          <div class="form-group">
            <label>İkincil Buton Linki</label>
            <input v-model="form.cta_secondary_url" type="text" placeholder="/frigolu-tasima" />
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
import {
  homepageServiceIconOptions,
  type HomepageServiceItem,
} from "~/utils/homepage-service-icons"

definePageMeta({ layout: 'admin', middleware: 'admin' })

const activeTab = ref('hero')

const tabs = [
  {
    key: 'hero',
    label: 'Hero',
    icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  },
  {
    key: 'accreditations',
    label: 'Hero Alt Şerit',
    icon: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  },
  {
    key: 'about',
    label: 'Kurumsal Özet',
    icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  },
  {
    key: 'services',
    label: 'Hizmetler',
    icon: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  },
  {
    key: 'process',
    label: 'Operasyon Süreci',
    icon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  },
  {
    key: 'testimonials',
    label: 'Müşteri Yorumları',
    icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  },
  {
    key: 'cta',
    label: 'CTA',
    icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  },
]

const { data: raw, pending } = await useFetch<any>('/api/admin/homepage')
const accreditationIconOptions = [
  { value: 'shield', label: 'Kalkan / Güven' },
  { value: 'clock', label: 'Saat / Randevu' },
  { value: 'ear', label: 'Kulak / İşitme Testi' },
  { value: 'device', label: 'İşitme Cihazı' },
  { value: 'tune', label: 'Ayarlama / Uygulama' },
]
const serviceIconOptions = homepageServiceIconOptions
const heroImageUpload = ref('')

const form = reactive({
  hero_eyebrow:             '',
  hero_title:               '',
  hero_description:         '',
  hero_badge1:              '',
  hero_badge2:              '',
  hero_badge3:              '',
  hero_bg_image:            '',
  hero_images:              [] as string[],
  hero_primary_label:       '',
  hero_primary_url:         '',
  hero_secondary_label:     '',
  hero_secondary_url:       '',
  accreditations:           [] as { icon: string; title: string; description: string }[],
  about_eyebrow:            '',
  about_title:              '',
  about_role:               '',
  about_paragraph1:         '',
  about_paragraph2:         '',
  about_photo:              '',
  services_eyebrow:         '',
  services_title:           '',
  services_description:     '',
  services_bg_image:        '',
  process_eyebrow:          '',
  process_title:            '',
  process_description:      '',
  process_steps:            [] as { number: string; title: string; description: string }[],
  testimonials_eyebrow:     '',
  testimonials_title:       '',
  testimonials_description: '',
  cta_title:                '',
  cta_description:          '',
  cta_bg_image:             '',
  cta_primary_label:        '',
  cta_primary_url:          '',
  cta_secondary_label:      '',
  cta_secondary_url:        '',
  services_items:           [] as HomepageServiceItem[],
})

watch(raw, (val) => {
  if (!val) return
  form.hero_eyebrow             = val.hero_eyebrow             || ''
  form.hero_title               = val.hero_title               || ''
  form.hero_description         = val.hero_description         || ''
  form.hero_badge1              = val.hero_badge1              || ''
  form.hero_badge2              = val.hero_badge2              || ''
  form.hero_badge3              = val.hero_badge3              || ''
  form.hero_bg_image            = val.hero_bg_image            || ''
  form.hero_images              = Array.isArray(val.hero_images) && val.hero_images.length ? val.hero_images : (form.hero_bg_image ? [form.hero_bg_image] : [])
  form.hero_primary_label       = val.hero_primary_label       || ''
  form.hero_primary_url         = val.hero_primary_url         || ''
  form.hero_secondary_label     = val.hero_secondary_label     || ''
  form.hero_secondary_url       = val.hero_secondary_url       || ''
  form.accreditations           = Array.isArray(val.accreditations) ? val.accreditations.map((a: any) => ({
    icon: a.icon || 'shield',
    title: a.title || a.label || '',
    description: a.description || '',
  })) : []
  form.about_eyebrow            = val.about_eyebrow            || ''
  form.about_title              = val.about_title              || ''
  form.about_role               = val.about_role               || ''
  form.about_paragraph1         = val.about_paragraph1         || ''
  form.about_paragraph2         = val.about_paragraph2         || ''
  form.about_photo              = val.about_photo              || ''
  form.services_eyebrow         = val.services_eyebrow         || ''
  form.services_title           = val.services_title           || ''
  form.services_description     = val.services_description     || ''
  form.services_bg_image        = val.services_bg_image        || ''
  form.process_eyebrow          = val.process_eyebrow          || ''
  form.process_title            = val.process_title            || ''
  form.process_description      = val.process_description      || ''
  form.process_steps            = Array.isArray(val.process_steps) ? val.process_steps : []
  form.testimonials_eyebrow     = val.testimonials_eyebrow     || ''
  form.testimonials_title       = val.testimonials_title       || ''
  form.testimonials_description = val.testimonials_description || ''
  form.cta_title                = val.cta_title                || ''
  form.cta_description          = val.cta_description          || ''
  form.cta_bg_image             = val.cta_bg_image             || ''
  form.cta_primary_label        = val.cta_primary_label        || ''
  form.cta_primary_url          = val.cta_primary_url          || ''
  form.cta_secondary_label      = val.cta_secondary_label      || ''
  form.cta_secondary_url        = val.cta_secondary_url        || ''
  form.services_items           = Array.isArray(val.services_items) ? val.services_items : []
}, { immediate: true })

function addHeroImage(url: string) {
  const image = String(url || '').trim()
  if (image && !form.hero_images.includes(image)) form.hero_images.push(image)
  heroImageUpload.value = ''
}
function removeHeroImage(i: number) {
  form.hero_images.splice(i, 1)
}
function moveHeroImage(i: number, direction: -1 | 1) {
  const target = i + direction
  if (target < 0 || target >= form.hero_images.length) return
  const [image] = form.hero_images.splice(i, 1)
  form.hero_images.splice(target, 0, image)
}

function addAccreditation() {
  form.accreditations.push({ icon: 'shield', title: '', description: '' })
}
function removeAccreditation(i: number) {
  form.accreditations.splice(i, 1)
}
function addStep() {
  form.process_steps.push({ number: String(form.process_steps.length + 1), title: '', description: '' })
}
function removeStep(i: number) {
  form.process_steps.splice(i, 1)
}

function addService() {
  form.services_items.push({ slug: '', title: '', description: '', icon: 'device' })
}
function removeService(i: number) {
  form.services_items.splice(i, 1)
}

const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)

async function handleSave() {
  await nextTick()
  form.hero_bg_image = form.hero_images[0] || ''
  saving.value = true
  saveError.value = ''
  saveSuccess.value = false
  try {
    await $fetch('/api/admin/homepage', { method: 'PUT', body: form })
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
.hero-image-list {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
}

.hero-image-list__item {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.hero-image-list__thumb {
  width: 96px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.hero-image-list__actions {
  display: flex;
  gap: 0.35rem;
}

.hero-image-list__btn {
  min-width: 34px;
  justify-content: center;
  padding-inline: 0.65rem;
}

.hero-image-list__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 720px) {
  .hero-image-list__item {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .hero-image-list__thumb {
    width: 72px;
    height: 52px;
  }

  .hero-image-list__actions {
    grid-column: 1 / -1;
  }
}
</style>
