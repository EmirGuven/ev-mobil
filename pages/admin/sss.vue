<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1>Sık Sorulan Sorular</h1>
      <button v-if="mainTab === 'sorular'" class="btn-admin-primary" @click="addGroup">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle;margin-right:4px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Yeni Kategori
      </button>
    </div>

    <!-- ANA SEKMELER -->
    <div class="admin-tabs" style="margin-bottom:1.5rem;">
      <button class="admin-tab" :class="{ 'admin-tab--active': mainTab === 'sayfa' }" @click="mainTab = 'sayfa'">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M4 9h16"/></svg>
        Sayfa Başlığı
      </button>
      <button class="admin-tab" :class="{ 'admin-tab--active': mainTab === 'sorular' }" @click="mainTab = 'sorular'">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
        Sorular
        <span style="margin-left:4px;background:#e0eaf5;color:#1b4f72;padding:1px 7px;border-radius:99px;font-size:0.75rem;font-weight:700;">{{ totalItemCount }}</span>
      </button>
    </div>

    <div v-if="pending || pagePending" class="admin-loading">Yükleniyor…</div>
    <div v-else>

      <!-- ───── SAYFA BAŞLIĞI SEKMESİ ───── -->
      <div v-if="mainTab === 'sayfa'">
        <div v-if="pageError" class="admin-login-error">{{ pageError }}</div>
        <div v-if="pageSuccess" class="admin-success">Sayfa ayarları kaydedildi.</div>
        <div class="admin-form">
          <div class="admin-form__grid">
            <div class="form-group">
              <label>Hero Eyebrow</label>
              <input v-model="pageForm.heroEyebrow" type="text" placeholder="Merak Edilenler" />
            </div>
            <div class="form-group">
              <label>Hero Başlık</label>
              <input v-model="pageForm.heroTitle" type="text" placeholder="Sık Sorulan Sorular" />
            </div>
          </div>
          <div class="form-group">
            <label>Hero Alt Yazı</label>
            <textarea v-model="pageForm.heroLead" rows="2" placeholder="Taşınma süreci ve hizmetler hakkında..." />
          </div>
          <div class="form-group">
            <label>Hero Arka Plan Görseli (URL)</label>
            <input v-model="pageForm.heroBgImage" type="text" placeholder="/uploads/..." />
            <ImageUpload v-model="pageForm.heroBgImage" @uploaded="(url: string) => pageForm.heroBgImage = url" />
          </div>
          <div class="admin-form__grid">
            <div class="form-group">
              <label>CTA Başlık</label>
              <input v-model="pageForm.ctaTitle" type="text" placeholder="Başka sorunuz var mı?" />
            </div>
            <div class="form-group">
              <label>CTA Alt Yazı</label>
              <input v-model="pageForm.ctaLead" type="text" placeholder="Teklif talebi oluşturabilirsiniz..." />
            </div>
          </div>
          <AdminCtaPreview
            :title="pageForm.ctaTitle || 'Cevabını bulamadığınız bir sorunuz mu var?'"
            :lead="pageForm.ctaLead || 'Aklınızdaki soru burada yer almıyorsa doğrudan iletişime geçebilirsiniz.'"
            :background-image="pageForm.ctaBgImage"
            :primary-label="pageForm.ctaPrimaryLabel || 'İletişime Geçin'"
            :secondary-label="pageForm.ctaSecondaryLabel || 'Teklif Alın'"
          />
          <div class="form-group" style="margin-top:1rem;">
            <label>CTA Arka Plan Görseli</label>
            <input v-model="pageForm.ctaBgImage" type="text" placeholder="/uploads/cta-faq.jpg" />
            <ImageUpload v-model="pageForm.ctaBgImage" @uploaded="(url: string) => pageForm.ctaBgImage = url" />
          </div>
          <div class="admin-form__grid">
            <div class="form-group">
              <label>Birincil Buton Metni</label>
              <input v-model="pageForm.ctaPrimaryLabel" type="text" placeholder="İletişime Geçin" />
            </div>
            <div class="form-group">
              <label>Birincil Buton Linki</label>
              <input v-model="pageForm.ctaPrimaryUrl" type="text" placeholder="/iletisim" />
            </div>
            <div class="form-group">
              <label>İkincil Buton Metni</label>
              <input v-model="pageForm.ctaSecondaryLabel" type="text" placeholder="Teklif Alın" />
            </div>
            <div class="form-group">
              <label>İkincil Buton Linki</label>
              <input v-model="pageForm.ctaSecondaryUrl" type="text" placeholder="/iletisim" />
            </div>
          </div>
          <div class="admin-form__actions">
            <button class="btn-admin-primary" :disabled="pageSaving" @click="savePage">
              {{ pageSaving ? 'Kaydediliyor…' : 'Sayfa Ayarlarını Kaydet' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ───── SORULAR SEKMESİ ───── -->
      <div v-if="mainTab === 'sorular'">
        <div v-if="saveError" class="admin-login-error">{{ saveError }}</div>
        <div v-if="saveSuccess" class="admin-success">Değişiklikler kaydedildi.</div>

      <!-- TABS — her kategori bir tab -->
      <div v-if="groups.length" class="admin-tabs">
        <button
          v-for="(group, gi) in groups"
          :key="gi"
          type="button"
          class="admin-tab"
          :class="{ 'admin-tab--active': activeGroup === gi }"
          @click="activeGroup = gi"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
          {{ group.category || 'Yeni Kategori' }}
        </button>
      </div>
      <div v-else class="admin-empty">Henüz kategori yok. "Yeni Kategori" ile başlayın.</div>

      <!-- AKTİF KATEGORİ PANELİ -->
      <div v-if="currentGroup" class="admin-form">
        <div class="sss-category-header">
          <div class="form-group" style="flex:1;margin:0">
            <label>Kategori Adı</label>
            <input
              v-model="currentGroup.category"
              type="text"
              placeholder="Kategori adı (örn: Taşınma Süreci)"
            />
          </div>
          <div class="sss-category-actions">
            <button
              type="button"
              class="btn-admin-secondary"
              :disabled="activeGroup === 0"
              @click="moveGroup(activeGroup, -1); activeGroup = activeGroup - 1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              Öne
            </button>
            <button
              type="button"
              class="btn-admin-secondary"
              :disabled="activeGroup === groups.length - 1"
              @click="moveGroup(activeGroup, 1); activeGroup = activeGroup + 1"
            >
              Sona
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button
              type="button"
              class="btn-admin-danger-sm"
              style="padding:0.5rem 0.85rem;font-size:0.82rem;border-radius:7px;"
              @click="removeGroup(activeGroup)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              Kategoriyi Sil
            </button>
          </div>
        </div>

        <!-- SORU LİSTESİ -->
        <h2 class="admin-form__section-title" style="margin-top:1.75rem;">Sorular</h2>

        <div v-if="!currentGroup.items.length" class="admin-empty" style="margin:1rem 0;">
          Henüz soru yok. Aşağıdan ekleyin.
        </div>

        <div
          v-for="(item, ii) in currentGroup.items"
          :key="ii"
          class="sss-item-row"
        >
          <div class="sss-item-row__number">{{ ii + 1 }}</div>
          <div class="sss-item-row__fields">
            <input
              v-model="item.question"
              type="text"
              placeholder="Soru metni"
              class="sss-item-row__q"
            />
            <textarea
              v-model="item.answer"
              rows="2"
              placeholder="Cevap metni"
              class="sss-item-row__a"
            />
          </div>
          <div class="sss-item-row__controls">
            <button
              type="button"
              class="btn-admin-secondary"
              style="padding:0.3rem 0.5rem;"
              :disabled="ii === 0"
              @click="moveItem(activeGroup, ii, -1)"
              title="Yukarı taşı"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button
              type="button"
              class="btn-admin-secondary"
              style="padding:0.3rem 0.5rem;"
              :disabled="ii === currentGroup.items.length - 1"
              @click="moveItem(activeGroup, ii, 1)"
              title="Aşağı taşı"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button
              type="button"
              class="btn-admin-danger-sm"
              style="padding:0.3rem 0.5rem;"
              @click="removeItem(activeGroup, ii)"
              title="Soruyu sil"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <button type="button" class="btn-admin-secondary" style="margin-top:0.75rem;" @click="addItem(activeGroup)">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Soru Ekle
        </button>

        <div class="admin-form__actions" style="margin-top:2rem;">
          <button class="btn-admin-primary" :disabled="saving" @click="handleSave">
            {{ saving ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet' }}
          </button>
        </div>
      </div>
      </div><!-- /sorular sekmesi -->
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

interface FaqItem  { id?: number; question: string; answer: string; sort_order?: number }
interface FaqGroup { id?: number; category: string; sort_order?: number; items: FaqItem[] }
interface SssPageData {
  heroEyebrow: string; heroTitle: string; heroLead: string; heroBgImage: string
  ctaTitle: string; ctaLead: string; ctaBgImage: string
  ctaPrimaryLabel: string; ctaPrimaryUrl: string
  ctaSecondaryLabel: string; ctaSecondaryUrl: string
}

// ── ANA SEKME ──────────────────────────────────────────────────────────────
const mainTab = ref<'sayfa' | 'sorular'>('sayfa')

// ── SAYFA AYARLARI ─────────────────────────────────────────────────────────
const { data: rawPage, pending: pagePending } = await useFetch<SssPageData>('/api/admin/sss-page')
const pageForm = reactive<SssPageData>({
  heroEyebrow: '',
  heroTitle: '',
  heroLead: '',
  heroBgImage: '',
  ctaTitle: '',
  ctaLead: '',
  ctaBgImage: '',
  ctaPrimaryLabel: '',
  ctaPrimaryUrl: '',
  ctaSecondaryLabel: '',
  ctaSecondaryUrl: '',
})
watch(rawPage, (val) => {
  if (!val) return
  Object.assign(pageForm, val)
}, { immediate: true })

const pageSaving = ref(false)
const pageError  = ref('')
const pageSuccess = ref(false)

async function savePage() {
  pageSaving.value = true
  pageError.value  = ''
  pageSuccess.value = false
  try {
    await $fetch('/api/admin/sss-page', { method: 'PUT', body: pageForm })
    pageSuccess.value = true
    setTimeout(() => (pageSuccess.value = false), 3000)
  } catch (err: any) {
    pageError.value = err?.data?.message || 'Bir hata oluştu.'
  } finally {
    pageSaving.value = false
  }
}

// ── SORULAR ────────────────────────────────────────────────────────────────
const { data: raw, pending } = await useFetch<FaqGroup[]>('/api/admin/faq')

const groups      = ref<FaqGroup[]>([])
const activeGroup = ref(0)

const currentGroup = computed(() => groups.value[activeGroup.value])

const totalItemCount = computed(() => groups.value.reduce((s, g) => s + g.items.length, 0))

watch(raw, (val) => {
  if (!val) return
  groups.value = val.map(g => ({
    id:         g.id,
    category:   g.category,
    sort_order: g.sort_order,
    items:      (g.items || []).map(i => ({ id: i.id, question: i.question, answer: i.answer })),
  }))
}, { immediate: true })

function addGroup() {
  groups.value.push({ category: 'Yeni Kategori', items: [] })
  activeGroup.value = groups.value.length - 1
}
function removeGroup(gi: number) {
  if (!confirm('Bu kategoriyi ve tüm sorularını silmek istiyor musunuz?')) return
  groups.value.splice(gi, 1)
  if (activeGroup.value >= groups.value.length) activeGroup.value = Math.max(0, groups.value.length - 1)
}
function moveGroup(gi: number, dir: -1 | 1) {
  const arr = groups.value
  const ni = gi + dir
  if (ni < 0 || ni >= arr.length) return
  ;[arr[gi], arr[ni]] = [arr[ni]!, arr[gi]!]
}
function addItem(gi: number) {
  groups.value[gi]?.items.push({ question: '', answer: '' })
}
function removeItem(gi: number, ii: number) {
  groups.value[gi]?.items.splice(ii, 1)
}
function moveItem(gi: number, ii: number, dir: -1 | 1) {
  const arr = groups.value[gi]?.items
  if (!arr) return
  const ni = ii + dir
  if (ni < 0 || ni >= arr.length) return
  ;[arr[ii], arr[ni]] = [arr[ni]!, arr[ii]!]
}

const saving      = ref(false)
const saveError   = ref('')
const saveSuccess = ref(false)

async function handleSave() {
  saving.value = true
  saveError.value = ''
  saveSuccess.value = false
  try {
    const payload = groups.value.map((g, gi) => ({
      id:         g.id,
      category:   g.category,
      sort_order: gi,
      items:      g.items.map((item, ii) => ({
        id:         item.id,
        question:   item.question,
        answer:     item.answer,
        sort_order: ii,
      })),
    }))
    await $fetch('/api/admin/faq', { method: 'PUT', body: payload })
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
.sss-category-header {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}
.sss-category-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
}
.sss-item-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.85rem 1rem;
  margin-bottom: 0.6rem;
}
.sss-item-row__number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #e0eaf5;
  color: #1b4f72;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 0.35rem;
}
.sss-item-row__fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.sss-item-row__q {
  width: 100%;
  padding: 0.45rem 0.7rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.92rem;
  font-weight: 500;
  color: #111827;
}
.sss-item-row__a {
  width: 100%;
  padding: 0.45rem 0.7rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.88rem;
  font-family: inherit;
  resize: vertical;
  color: #374151;
  line-height: 1.55;
}
.sss-item-row__q:focus,
.sss-item-row__a:focus { outline: none; border-color: #1b4f72; }
.sss-item-row__controls {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-shrink: 0;
}
</style>
