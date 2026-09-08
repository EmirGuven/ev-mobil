<template>
  <div class="admin-page">

    <!-- HEADER -->
    <div class="admin-page__header">
      <div class="hizmet-page-title">
        <NuxtLink to="/admin/hizmet" class="hizmet-back-link">← Hizmet listesine dön</NuxtLink>
        <h1>{{ pageTitle }}</h1>
        <p class="hizmet-page-slug">/{{ slug }}</p>
        <a :href="`/${slug}`" target="_blank" class="hizmet-live-link">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
          Canlıda Gör
        </a>
      </div>
      <button class="btn-admin-primary" :disabled="saving" @click="save">
        <svg v-if="saving" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
        <svg v-else width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        {{ saving ? 'Kaydediliyor…' : 'Kaydet' }}
      </button>
    </div>

    <!-- TOAST -->
    <transition name="fade">
      <div v-if="saveSuccess" class="hizmet-toast hizmet-toast--ok">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        Değişiklikler kaydedildi
      </div>
      <div v-else-if="saveError" class="hizmet-toast hizmet-toast--err">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ saveError }}
      </div>
    </transition>

    <div v-if="pending" class="admin-loading">Yükleniyor…</div>
    <div v-else>
      <div class="admin-tabs hizmet-tabs">
        <button
          v-for="s in sections"
          :key="s.id"
          type="button"
          class="admin-tab hizmet-tab"
          :class="{ 'admin-tab--active': tab === s.id }"
          @click="tab = s.id"
        >
          <span class="hizmet-tab__icon" v-html="s.icon" />
          <span>{{ s.label }}</span>
        </button>
      </div>

      <div class="hizmet-content">

        <!-- ── HERO ── -->
        <section v-if="tab === 'hero'" class="hizmet-section">
          <div class="hizmet-section__head">
            <h2>Hero Alanı</h2>
            <p>Sayfanın en üstündeki büyük görsel bölümü</p>
          </div>

          <!-- Görsel önizleme + yükleme -->
          <div class="hizmet-img-box">
            <div class="hizmet-img-box__preview" :style="form.heroBgImage ? `background-image:url(${form.heroBgImage})` : ''">
              <div v-if="!form.heroBgImage" class="hizmet-img-box__empty">
                <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span>Henüz görsel yüklenmedi</span>
              </div>
              <div v-else class="hizmet-img-box__overlay">
                <span>Arka plan görseli</span>
              </div>
            </div>
            <div class="hizmet-img-box__upload">
              <label class="hizmet-field-label">Görsel URL</label>
              <input v-model="form.heroBgImage" type="text" class="hizmet-input" placeholder="/uploads/…" />
              <div style="margin-top:0.75rem;">
                <ImageUpload v-model="form.heroBgImage" @uploaded="(url: string) => form.heroBgImage = url" />
              </div>
            </div>
          </div>

          <div class="hizmet-grid-2">
            <div class="hizmet-field">
              <label class="hizmet-field-label">Eyebrow <span class="hizmet-field-hint">Küçük üst yazı</span></label>
              <input v-model="form.heroEyebrow" type="text" class="hizmet-input" placeholder="Profesyonel Taşımacılık" />
            </div>
            <div class="hizmet-field">
              <label class="hizmet-field-label">Başlık</label>
              <input v-model="form.heroTitle" type="text" class="hizmet-input" placeholder="Frigolu Taşıma" />
            </div>
          </div>
          <div class="hizmet-field">
            <label class="hizmet-field-label">Alt Yazı <span class="hizmet-field-hint">Hero açıklama metni</span></label>
            <textarea v-model="form.heroLead" rows="3" class="hizmet-textarea" placeholder="Bu hizmetin kapsamını ve size nasıl yardımcı olacağını özetleyin…" />
          </div>
        </section>

        <!-- ── İÇERİK ── -->
        <section v-if="tab === 'icerik'" class="hizmet-section">
          <div class="hizmet-section__head">
            <h2>İçerik Bölümü</h2>
            <p>"Nedir?" açıklaması ve fayda kartları</p>
          </div>
          <div class="hizmet-grid-2">
            <div class="hizmet-field">
              <label class="hizmet-field-label">Bölüm Başlığı</label>
              <input v-model="form.whatTitle" type="text" class="hizmet-input" placeholder="Frigolu Taşıma Nedir?" />
            </div>
            <div class="hizmet-field">
              <label class="hizmet-field-label">Bölüm Alt Yazısı</label>
              <textarea v-model="form.whatLead" rows="2" class="hizmet-textarea" />
            </div>
          </div>

          <div class="hizmet-list-head">
            <h3>Fayda Kartları</h3>
            <button class="hizmet-add-btn" @click="form.benefits.push({ title: '', text: '' })">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Fayda Ekle
            </button>
          </div>
          <div class="hizmet-cards">
            <div v-for="(b, i) in form.benefits" :key="i" class="hizmet-card">
              <div class="hizmet-card__num">{{ i + 1 }}</div>
              <div class="hizmet-card__fields">
                <input v-model="b.title" type="text" class="hizmet-input hizmet-input--bold" placeholder="Kart başlığı" />
                <textarea v-model="b.text" rows="2" class="hizmet-textarea hizmet-textarea--sm" placeholder="Açıklama metni" />
              </div>
              <button class="hizmet-del-btn" @click="form.benefits.splice(i,1)" title="Sil">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </section>

        <!-- ── KONULAR ── -->
        <section v-if="tab === 'konular'" class="hizmet-section">
          <div class="hizmet-section__head">
            <h2>Kullanım Alanları</h2>
            <p>Bu hizmet hangi ihtiyaçlar için uygundur?</p>
          </div>
          <div class="hizmet-grid-2">
            <div class="hizmet-field">
              <label class="hizmet-field-label">Bölüm Başlığı</label>
              <input v-model="form.issuesTitle" type="text" class="hizmet-input" />
            </div>
            <div class="hizmet-field">
              <label class="hizmet-field-label">Bölüm Alt Yazısı</label>
              <input v-model="form.issuesLead" type="text" class="hizmet-input" />
            </div>
          </div>
          <div class="hizmet-list-head">
            <h3>Konu Listesi <span class="hizmet-field-hint">{{ form.issues.length }} konu</span></h3>
            <button class="hizmet-add-btn" @click="form.issues.push('')">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Konu Ekle
            </button>
          </div>
          <div class="hizmet-issues">
            <div v-for="(issue, i) in form.issues" :key="i" class="hizmet-issue-row">
              <span class="hizmet-card__num">{{ i + 1 }}</span>
              <input v-model="form.issues[i]" type="text" class="hizmet-input" placeholder="Konu adı" />
              <button class="hizmet-del-btn" @click="form.issues.splice(i,1)">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </section>

        <!-- ── SÜREÇ ── -->
        <section v-if="tab === 'surec'" class="hizmet-section">
          <div class="hizmet-section__head">
            <h2>Süreç Adımları</h2>
            <p>Taşıma süreci nasıl ilerliyor?</p>
          </div>
          <div class="hizmet-grid-2">
            <div class="hizmet-field">
              <label class="hizmet-field-label">Bölüm Başlığı</label>
              <input v-model="form.processTitle" type="text" class="hizmet-input" />
            </div>
            <div class="hizmet-field">
              <label class="hizmet-field-label">Bölüm Alt Yazısı</label>
              <input v-model="form.processLead" type="text" class="hizmet-input" />
            </div>
          </div>
          <div class="hizmet-list-head">
            <h3>Adımlar</h3>
            <button class="hizmet-add-btn" @click="form.processSteps.push({ title: '', text: '' })">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Adım Ekle
            </button>
          </div>
          <div class="hizmet-cards">
            <div v-for="(step, i) in form.processSteps" :key="i" class="hizmet-card hizmet-card--step">
              <div class="hizmet-card__num hizmet-card__num--circle">{{ i + 1 }}</div>
              <div class="hizmet-card__fields">
                <input v-model="step.title" type="text" class="hizmet-input hizmet-input--bold" placeholder="Adım başlığı" />
                <textarea v-model="step.text" rows="2" class="hizmet-textarea hizmet-textarea--sm" placeholder="Açıklama" />
              </div>
              <button class="hizmet-del-btn" @click="form.processSteps.splice(i,1)">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </section>

        <!-- ── CTA ── -->
        <section v-if="tab === 'cta'" class="hizmet-section">
          <div class="hizmet-section__head">
            <h2>Çağrı Butonu (CTA)</h2>
            <p>Sayfanın alt kısmındaki teklif daveti</p>
          </div>
          <AdminCtaPreview
            :title="form.ctaTitle || 'CTA Başlığı'"
            :lead="form.ctaLead || 'CTA alt yazısı burada görünür'"
            :background-image="form.ctaBgImage"
            :primary-label="form.ctaPrimaryLabel || 'Teklif Alın'"
            :secondary-label="form.ctaSecondaryLabel || 'Kurumsal'"
          />
          <div class="hizmet-grid-2" style="margin-top:1.5rem;">
            <div class="hizmet-field">
              <label class="hizmet-field-label">CTA Başlık</label>
              <input v-model="form.ctaTitle" type="text" class="hizmet-input" placeholder="Değişim için ilk adımı bugün atın" />
            </div>
            <div class="hizmet-field">
              <label class="hizmet-field-label">CTA Alt Yazı</label>
              <input v-model="form.ctaLead" type="text" class="hizmet-input" placeholder="Kendiniz için yapacağınız en değerli yatırım…" />
            </div>
          </div>
          <div class="hizmet-field">
            <label class="hizmet-field-label">CTA Arka Plan Görseli</label>
            <input v-model="form.ctaBgImage" type="text" class="hizmet-input" placeholder="/uploads/cta-bg.jpg" />
            <div style="margin-top:0.75rem;">
              <ImageUpload v-model="form.ctaBgImage" @uploaded="(url: string) => form.ctaBgImage = url" />
            </div>
          </div>
          <div class="hizmet-grid-2">
            <div class="hizmet-field">
              <label class="hizmet-field-label">Birincil Buton Metni</label>
              <input v-model="form.ctaPrimaryLabel" type="text" class="hizmet-input" placeholder="Teklif Alın" />
            </div>
            <div class="hizmet-field">
              <label class="hizmet-field-label">Birincil Buton Linki</label>
              <input v-model="form.ctaPrimaryUrl" type="text" class="hizmet-input" placeholder="/iletisim" />
            </div>
            <div class="hizmet-field">
              <label class="hizmet-field-label">İkincil Buton Metni</label>
              <input v-model="form.ctaSecondaryLabel" type="text" class="hizmet-input" placeholder="Kurumsal" />
            </div>
            <div class="hizmet-field">
              <label class="hizmet-field-label">İkincil Buton Linki</label>
              <input v-model="form.ctaSecondaryUrl" type="text" class="hizmet-input" placeholder="/hakkimda" />
            </div>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const slug  = computed(() => route.params.slug as string)

const sections = [
  { id: 'hero',    label: 'Hero',            icon: '<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' },
  { id: 'icerik',  label: 'İçerik',          icon: '<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="13" x2="8" y1="17" y2="17"/></svg>' },
  { id: 'konular', label: 'Çalışma Konuları', icon: '<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' },
  { id: 'surec',   label: 'Süreç Adımları',  icon: '<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
  { id: 'cta',     label: 'CTA',             icon: '<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' },
]

const tab = ref<string>('hero')

interface ServiceForm {
  heroEyebrow: string; heroTitle: string; heroLead: string; heroBgImage: string
  whatTitle: string; whatLead: string; benefits: { title: string; text: string }[]
  issuesTitle: string; issuesLead: string; issues: string[]
  processTitle: string; processLead: string; processSteps: { title: string; text: string }[]
  ctaTitle: string; ctaLead: string; ctaBgImage: string
  ctaPrimaryLabel: string; ctaPrimaryUrl: string
  ctaSecondaryLabel: string; ctaSecondaryUrl: string
}

const { data: raw, pending } = await useFetch<ServiceForm>(() => `/api/admin/service/${slug.value}`)
const pageTitle = computed(() => raw.value?.heroTitle || slug.value)

const form = reactive<ServiceForm>({
  heroEyebrow: '', heroTitle: '', heroLead: '', heroBgImage: '',
  whatTitle: '', whatLead: '', benefits: [],
  issuesTitle: '', issuesLead: '', issues: [],
  processTitle: '', processLead: '', processSteps: [],
  ctaTitle: '', ctaLead: '', ctaBgImage: '',
  ctaPrimaryLabel: '', ctaPrimaryUrl: '',
  ctaSecondaryLabel: '', ctaSecondaryUrl: '',
})

watch(raw, (val) => {
  if (!val) return
  Object.assign(form, {
    ...val,
    benefits:     Array.isArray(val.benefits)     ? val.benefits     : [],
    issues:       Array.isArray(val.issues)       ? val.issues       : [],
    processSteps: Array.isArray(val.processSteps) ? val.processSteps : [],
  })
}, { immediate: true })

const saving      = ref(false)
const saveError   = ref('')
const saveSuccess = ref(false)

async function save() {
  saving.value      = true
  saveError.value   = ''
  saveSuccess.value = false
  try {
    await $fetch(`/api/admin/service/${slug.value}`, { method: 'PUT', body: { ...form } })
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
/* ── Layout ────────────────────────────────────────────────── */
.hizmet-page-title { display: flex; flex-direction: column; gap: 0.25rem; }
.hizmet-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: #1b4f72;
  text-decoration: none;
  font-weight: 600;
}
.hizmet-page-slug {
  margin: 0;
  font-size: 0.8rem;
  color: #9ca3af;
}
.hizmet-live-link {
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.78rem; color: #6b7280; text-decoration: none;
  transition: color 0.15s;
}
.hizmet-live-link:hover { color: #1b4f72; }

.hizmet-toast {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem 1.1rem; border-radius: 10px;
  font-size: 0.88rem; font-weight: 600;
  margin-bottom: 1.25rem;
}
.hizmet-toast--ok  { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.hizmet-toast--err { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

.hizmet-tabs { margin-bottom: 1.5rem; }
.hizmet-tab { flex-shrink: 0; }
.hizmet-tab__icon { display: flex; align-items: center; flex-shrink: 0; }
.hizmet-tab__icon :deep(svg) {
  display: block;
  opacity: 0.6;
  transition: opacity 0.15s;
}
.hizmet-tab:hover .hizmet-tab__icon :deep(svg),
.hizmet-tab.admin-tab--active .hizmet-tab__icon :deep(svg) { opacity: 1; }

/* ── İçerik ────────────────────────────────────────────────── */
.hizmet-content { min-width: 0; }
.hizmet-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 1.75rem;
}
.hizmet-section__head { margin-bottom: 1.75rem; padding-bottom: 1.25rem; border-bottom: 1px solid #f0f2f5; }
.hizmet-section__head h2 { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 0.25rem; }
.hizmet-section__head p  { font-size: 0.83rem; color: #9ca3af; margin: 0; }

/* ── Görsel kutusu ─────────────────────────────────────────── */
.hizmet-img-box { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem; }
.hizmet-img-box__preview {
  height: 160px; border-radius: 12px;
  background: #f3f4f6 center/cover no-repeat;
  position: relative; overflow: hidden;
  border: 1.5px dashed #d1d5db;
}
.hizmet-img-box__empty {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.5rem; color: #9ca3af; font-size: 0.8rem;
}
.hizmet-img-box__overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.35);
  display: flex; align-items: flex-end; padding: 0.75rem;
  color: #fff; font-size: 0.78rem; font-weight: 600;
}

/* ── Form alanları ─────────────────────────────────────────── */
.hizmet-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
.hizmet-field { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
.hizmet-field-label { font-size: 0.8rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.04em; }
.hizmet-field-hint  { font-weight: 400; color: #9ca3af; text-transform: none; letter-spacing: 0; margin-left: 0.35rem; }
.hizmet-input {
  width: 100%; padding: 0.6rem 0.85rem;
  border: 1.5px solid #e5e7eb; border-radius: 9px;
  font-size: 0.92rem; font-family: inherit; color: #111827;
  background: #fafafa; transition: border-color 0.15s, background 0.15s;
  box-sizing: border-box;
}
.hizmet-input:focus { outline: none; border-color: #1b4f72; background: #fff; }
.hizmet-input--bold { font-weight: 600; }
.hizmet-textarea {
  width: 100%; padding: 0.6rem 0.85rem;
  border: 1.5px solid #e5e7eb; border-radius: 9px;
  font-size: 0.92rem; font-family: inherit; color: #111827;
  background: #fafafa; resize: vertical; line-height: 1.6;
  transition: border-color 0.15s; box-sizing: border-box;
}
.hizmet-textarea:focus { outline: none; border-color: #1b4f72; background: #fff; }
.hizmet-textarea--sm { font-size: 0.86rem; }

/* ── Kart listesi ──────────────────────────────────────────── */
.hizmet-list-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem; }
.hizmet-list-head h3 { font-size: 0.9rem; font-weight: 700; color: #374151; margin: 0; }
.hizmet-add-btn {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.4rem 0.9rem; border-radius: 8px;
  background: #f0f6ff; border: 1px solid #c7dff7;
  color: #1b4f72; font-size: 0.8rem; font-weight: 600;
  cursor: pointer; font-family: inherit; transition: all 0.15s;
}
.hizmet-add-btn:hover { background: #1b4f72; color: #fff; border-color: #1b4f72; }

.hizmet-cards { display: flex; flex-direction: column; gap: 0.65rem; }
.hizmet-card {
  display: flex; align-items: flex-start; gap: 0.75rem;
  background: #f9fafb; border: 1.5px solid #e5e7eb;
  border-radius: 12px; padding: 1rem;
  transition: border-color 0.15s;
}
.hizmet-card:focus-within { border-color: #1b4f72; background: #fff; }
.hizmet-card__num {
  min-width: 28px; height: 28px;
  background: #e0eaf5; color: #1b4f72;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 800; flex-shrink: 0; margin-top: 0.2rem;
}
.hizmet-card__num--circle { background: #1b4f72; color: #fff; }
.hizmet-card__fields { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
.hizmet-del-btn {
  background: none; border: none; cursor: pointer;
  color: #d1d5db; padding: 0.2rem; border-radius: 5px;
  transition: color 0.15s, background 0.15s; flex-shrink: 0;
}
.hizmet-del-btn:hover { color: #ef4444; background: #fef2f2; }

/* ── Konular listesi ───────────────────────────────────────── */
.hizmet-issues { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.hizmet-issue-row { display: flex; align-items: center; gap: 0.5rem; }

/* ── Animasyon ─────────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
