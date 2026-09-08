<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1>Kurumsal Sayfa</h1>
    </div>

    <div v-if="pending" class="admin-loading">Yükleniyor…</div>
    <form v-else class="admin-form" @submit.prevent="handleSave">
      <div v-if="saveError" class="admin-login-error">{{ saveError }}</div>
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
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="tab.icon" />
          {{ tab.label }}
        </button>
      </div>

      <!-- HERO -->
      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'hero' }">
        <h2 class="admin-form__section-title">Hero Bölümü</h2>
        <div class="admin-form__grid">
          <div class="form-group">
            <label>Üst Etiket</label>
            <input v-model="form.hero_eyebrow" type="text" placeholder="Kurumsal Taşımacılık Çözümleri" />
          </div>
          <div class="form-group">
            <label>Ana Başlık</label>
            <input v-model="form.hero_title" type="text" placeholder="Ev-Mobil" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Öncü Metin</label>
            <textarea v-model="form.hero_lead" rows="3" placeholder="Hero bölümünde görünecek açıklama..." />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Hero Arka Plan Görseli</label>
            <ImageUpload v-model="form.hero_bg_image" @uploaded="handleSave" />
            <p style="font-size:0.75rem;color:#9ca3af;margin:4px 0 0">Hero bölümünün arka planında görünecek görsel. Boş bırakılırsa varsayılan renk kullanılır.</p>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Profil Fotoğrafı</label>
            <ImageUpload v-model="form.photo_url" @uploaded="handleSave" />
          </div>
          <div class="form-group">
            <label>Fotoğraf Üzeri Rozet — Değer</label>
            <input v-model="form.bio_badge_value" type="text" placeholder="20+" />
          </div>
          <div class="form-group">
            <label>Fotoğraf Üzeri Rozet — Etiket</label>
            <input v-model="form.bio_badge_label" type="text" placeholder="Yıl Deneyim" />
          </div>
          <p style="font-size:0.75rem;color:#9ca3af;margin:0;grid-column:1/-1">Fotoğrafın üzerinde görünen rozet. Değer boş bırakılırsa rozet hiç gösterilmez.</p>
        </div>

        <h2 class="admin-form__section-title" style="margin-top:1.5rem;">Hero Alt Rozet Bandı</h2>
        <p class="admin-form__hint">Hero bölümünün altındaki güven şeridi. Her satır bir karttır, boş bırakılırsa şerit hiç gösterilmez.</p>
        <div
          v-for="(item, i) in form.hero_badges"
          :key="i"
          class="admin-form__repeater-row admin-form__grid"
        >
          <div class="form-group">
            <label>İkon</label>
            <select v-model="item.icon">
              <option v-for="icon in heroBadgeIconOptions" :key="icon.value" :value="icon.value">
                {{ icon.label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Başlık</label>
            <input v-model="item.title" type="text" placeholder="Uzman Değerlendirme" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Açıklama</label>
            <div class="admin-inline-group">
              <textarea v-model="item.description" rows="2" style="font-family:inherit;" />
              <button type="button" class="btn-admin-danger-sm" @click="form.hero_badges.splice(i,1)">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>
        <button type="button" class="btn-admin-secondary" @click="form.hero_badges.push({icon:'shield', title:'', description:''})">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Rozet Ekle
        </button>
      </div>

      <!-- BİYOGRAFİ -->
      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'bio' }">
        <h2 class="admin-form__section-title">Biyografi</h2>
        <div class="admin-form__grid">
          <div class="form-group" style="grid-column:1/-1">
            <label>Bölüm Başlığı</label>
            <input v-model="form.bio_title" type="text" />
          </div>
        </div>
        <h2 class="admin-form__section-title" style="margin-top:1.5rem;">Paragraflar</h2>
        <div
          v-for="(para, i) in form.bio_paragraphs"
          :key="i"
          class="admin-form__repeater-row"
          style="display:flex;gap:0.75rem;align-items:flex-start;"
        >
          <span class="admin-form__repeater-number">{{ i + 1 }}</span>
          <textarea v-model="form.bio_paragraphs[i]" rows="3" style="flex:1;font-family:inherit;" />
          <button type="button" class="btn-admin-danger-sm" @click="form.bio_paragraphs.splice(i,1)">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <button type="button" class="btn-admin-secondary" style="margin-top:0.75rem;" @click="addBioPara">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Paragraf Ekle
        </button>
      </div>

      <!-- UZMANLIK -->
      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'specialties' }">
        <h2 class="admin-form__section-title">Hizmet Başlıkları</h2>
        <div
          v-for="(sp, i) in form.specialties"
          :key="i"
          class="admin-form__repeater-row admin-form__grid"
        >
          <div class="form-group">
            <label>Başlık</label>
            <input v-model="sp.title" type="text" placeholder="Frigolu Taşıma" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Açıklama</label>
            <div class="admin-inline-group">
              <textarea v-model="sp.desc" rows="2" style="font-family:inherit;" />
              <button type="button" class="btn-admin-danger-sm" @click="form.specialties.splice(i,1)">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>
        <button type="button" class="btn-admin-secondary" @click="form.specialties.push({title:'',desc:''})">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Uzmanlık Ekle
        </button>
      </div>

      <!-- EĞİTİM -->
      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'timeline' }">
        <h2 class="admin-form__section-title">Operasyon Adımları</h2>
        <div
          v-for="(item, i) in form.timeline"
          :key="i"
          class="admin-form__repeater-row admin-form__grid"
        >
          <div class="form-group">
            <label>Yıllar</label>
            <input v-model="item.years" type="text" placeholder="2016 – 2019" />
          </div>
          <div class="form-group">
            <label>Başlık</label>
            <input v-model="item.title" type="text" placeholder="Ekspertiz ve Planlama" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Açıklama</label>
            <div class="admin-inline-group">
              <textarea v-model="item.desc" rows="2" style="font-family:inherit;" />
              <button type="button" class="btn-admin-danger-sm" @click="form.timeline.splice(i,1)">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>
        <button type="button" class="btn-admin-secondary" @click="form.timeline.push({years:'',title:'',desc:''})">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Eğitim Ekle
        </button>
      </div>

      <!-- YAKLAŞIM -->
      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'approach' }">
        <h2 class="admin-form__section-title">Çalışma Prensipleri</h2>
        <div class="admin-form__grid">
          <div class="form-group">
            <label>Bölüm Başlığı</label>
            <input v-model="form.approach_title" type="text" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Açıklama Metni</label>
            <textarea v-model="form.approach_lead" rows="3" />
          </div>
        </div>
        <h2 class="admin-form__section-title" style="margin-top:1.5rem;">Değer Kartları</h2>
        <div
          v-for="(val, i) in form.approach_values"
          :key="i"
          class="admin-form__repeater-row admin-form__grid"
        >
          <div class="form-group">
            <label>Başlık</label>
            <input v-model="val.title" type="text" placeholder="Zamanında Teslim" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Açıklama</label>
            <div class="admin-inline-group">
              <textarea v-model="val.desc" rows="2" style="font-family:inherit;" />
              <button type="button" class="btn-admin-danger-sm" @click="form.approach_values.splice(i,1)">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>
        <button type="button" class="btn-admin-secondary" @click="form.approach_values.push({title:'',desc:''})">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Değer Ekle
        </button>
      </div>

      <!-- CTA -->
      <div class="admin-tab-panel" :class="{ 'admin-tab-panel--active': activeTab === 'cta' }">
        <h2 class="admin-form__section-title">Alt CTA Bölümü</h2>
        <AdminCtaPreview
          :title="form.cta_title || 'Taşınmanızı planlamaya hazır mısınız?'"
          :lead="form.cta_text || 'Taşınma detaylarınızı iletin, size uygun ekip ve planı oluşturalım.'"
          :background-image="form.cta_bg_image"
          :primary-label="form.cta_primary_label || 'Teklif Alın'"
          :secondary-label="form.cta_secondary_label || 'Hizmetleri İnceleyin'"
        />
        <div class="admin-form__grid">
          <div class="form-group">
            <label>Başlık</label>
            <input v-model="form.cta_title" type="text" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>Açıklama</label>
            <textarea v-model="form.cta_text" rows="3" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label>CTA Arka Plan Görseli</label>
            <input v-model="form.cta_bg_image" type="text" placeholder="/uploads/cta-about.jpg" />
            <ImageUpload v-model="form.cta_bg_image" @uploaded="(url: string) => form.cta_bg_image = url" />
          </div>
          <div class="form-group">
            <label>Birincil Buton Metni</label>
            <input v-model="form.cta_primary_label" type="text" placeholder="Teklif Alın" />
          </div>
          <div class="form-group">
            <label>Birincil Buton Linki</label>
            <input v-model="form.cta_primary_url" type="text" placeholder="/iletisim" />
          </div>
          <div class="form-group">
            <label>İkincil Buton Metni</label>
            <input v-model="form.cta_secondary_label" type="text" placeholder="Hizmetleri İnceleyin" />
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
        <a href="/hakkimda" target="_blank" class="btn-admin-secondary">Sayfayı Önizle →</a>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { heroBadgeIconOptions } from "~/utils/hero-badge-icons"

definePageMeta({ layout: 'admin', middleware: 'admin' })

const activeTab = ref('hero')

const tabs = [
  { key: 'hero',        label: 'Hero',        icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
  { key: 'bio',         label: 'Biyografi',   icon: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/>' },
  { key: 'specialties', label: 'Uzmanlıklar', icon: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>' },
  { key: 'timeline',    label: 'Eğitim',      icon: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>' },
  { key: 'approach',    label: 'Yaklaşım',    icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' },
  { key: 'cta',         label: 'CTA',         icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' },
]

interface Specialty    { title: string; desc: string }
interface TimelineItem { years: string; title: string; desc: string }
interface HeroBadge    { icon: string; title: string; description: string }

const form = reactive({
  hero_eyebrow:    '',
  hero_title:      '',
  hero_lead:       '',
  hero_bg_image:   '',
  photo_url:       '',
  bio_title:       '',
  bio_paragraphs:  [] as string[],
  bio_badge_value: '',
  bio_badge_label: '',
  specialties:     [] as Specialty[],
  hero_badges:     [] as HeroBadge[],
  timeline:        [] as TimelineItem[],
  approach_title:  '',
  approach_lead:   '',
  approach_values: [] as Specialty[],
  cta_title:       '',
  cta_text:        '',
  cta_bg_image:    '',
  cta_primary_label: '',
  cta_primary_url: '',
  cta_secondary_label: '',
  cta_secondary_url: '',
})

const parse = (v: any): any => {
  if (Array.isArray(v)) return v
  try { return JSON.parse(v) } catch { return [] }
}

const { data: raw, pending } = await useFetch<Record<string, any>>('/api/admin/about')

watch(raw, (val) => {
  if (!val) return
  form.hero_eyebrow    = val.hero_eyebrow    || ''
  form.hero_title      = val.hero_title      || ''
  form.hero_lead       = val.hero_lead       || ''
  form.hero_bg_image   = val.hero_bg_image   || ''
  form.photo_url       = val.photo_url       || ''
  form.bio_title       = val.bio_title       || ''
  form.bio_paragraphs  = parse(val.bio_paragraphs)
  form.bio_badge_value = val.bio_badge_value || ''
  form.bio_badge_label = val.bio_badge_label || ''
  form.specialties     = parse(val.specialties)
  form.hero_badges     = parse(val.hero_badges)
  form.timeline        = parse(val.timeline)
  form.approach_title  = val.approach_title  || ''
  form.approach_lead   = val.approach_lead   || ''
  form.approach_values = parse(val.approach_values)
  form.cta_title       = val.cta_title       || ''
  form.cta_text        = val.cta_text        || ''
  form.cta_bg_image    = val.cta_bg_image    || ''
  form.cta_primary_label = val.cta_primary_label || ''
  form.cta_primary_url = val.cta_primary_url || ''
  form.cta_secondary_label = val.cta_secondary_label || ''
  form.cta_secondary_url = val.cta_secondary_url || ''
}, { immediate: true })

function addBioPara() { form.bio_paragraphs.push('') }

const saving      = ref(false)
const saveError   = ref('')
const saveSuccess = ref(false)

async function handleSave() {
  await nextTick()
  saving.value = true
  saveError.value = ''
  saveSuccess.value = false
  try {
    await $fetch('/api/admin/about', { method: 'PUT', body: { ...form } })
    saveSuccess.value = true
    setTimeout(() => (saveSuccess.value = false), 3000)
  } catch (err: any) {
    saveError.value = err?.data?.message || 'Bir hata oluştu.'
  } finally {
    saving.value = false
  }
}
</script>
