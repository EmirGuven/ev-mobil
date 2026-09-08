<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1>Form Talepleri</h1>
      <p class="admin-page__subtitle">Siteden gelen talepler. Uygun gördüğünüz kaydı planlanmış işe çevirebilirsiniz.</p>
    </div>

    <!-- Stats -->
    <div class="appt-stats-bar">
      <div class="appt-stat-item appt-stat-item--all">
        <span class="appt-stat-item__number">{{ requests?.length ?? 0 }}</span>
        <span class="appt-stat-item__label">Toplam Talep</span>
      </div>
      <div class="appt-stat-item appt-stat-item--new">
        <span class="appt-stat-item__number">{{ counts.new }}</span>
        <span class="appt-stat-item__label">Yeni</span>
      </div>
      <div class="appt-stat-item appt-stat-item--contacted">
        <span class="appt-stat-item__number">{{ counts.contacted }}</span>
        <span class="appt-stat-item__label">İletişimde</span>
      </div>
      <div class="appt-stat-item appt-stat-item--completed">
        <span class="appt-stat-item__number">{{ counts.converted }}</span>
        <span class="appt-stat-item__label">Planlandı</span>
      </div>
    </div>

    <!-- Arama -->
    <div class="appt-search-bar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input v-model="search" type="text" placeholder="İsim, telefon veya hizmet ara…" class="appt-search-input" />
      <button v-if="search" @click="search = ''" class="appt-search-clear">✕</button>
    </div>

    <div v-if="pending" class="admin-loading">Yükleniyor…</div>
    <div v-else-if="!filtered.length" class="admin-empty">Form talebi bulunamadı.</div>

    <!-- Tablo -->
    <div v-else class="xls-wrap">
      <div class="xls-head">
        <div class="xls-col xls-col--nr">#</div>
        <div class="xls-col xls-col--name">Ad Soyad</div>
        <div class="xls-col xls-col--phone">Telefon</div>
        <div class="xls-col xls-col--service">Hizmet</div>
        <div class="xls-col xls-col--date">Tarih</div>
        <div class="xls-col xls-col--status">Durum</div>
        <div class="xls-col xls-col--actions">İşlem</div>
      </div>

      <template v-for="(req, idx) in filtered" :key="req.id">
        <div
          class="xls-row"
          :class="[`xls-row--${req.status}`, { 'xls-row--open': expandedId === req.id }]"
          @click="toggleExpand(req)"
        >
          <div class="xls-col xls-col--nr">{{ idx + 1 }}</div>
          <div class="xls-col xls-col--name">
            <span class="xls-dot" :class="`xls-dot--${req.status}`"></span>
            {{ req.name }}
          </div>
          <div class="xls-col xls-col--phone">
            <a :href="`tel:${req.phone}`" @click.stop class="xls-link">{{ req.phone || '—' }}</a>
          </div>
          <div class="xls-col xls-col--service">{{ req.service || '—' }}</div>
          <div class="xls-col xls-col--date">{{ formatDate(req.created_at) }}</div>
          <div class="xls-col xls-col--status">
            <span class="xls-pill" :class="`xls-pill--${req.status}`">{{ statusLabel(req.status) }}</span>
          </div>
          <div class="xls-col xls-col--actions" @click.stop>
            <button class="xls-convert-btn" title="Planlı İşe Çevir" @click="openConvert(req)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              Planlı İşe Çevir
            </button>
          </div>
        </div>

        <!-- Satır Detayı -->
        <div v-if="expandedId === req.id" class="xls-detail">
          <div class="xls-detail__grid">
            <div class="xls-detail__col">
              <div class="xls-detail__stitle">Kişi Bilgileri</div>
              <div class="xls-info-row" v-if="req.email">
                <span class="xls-info-lbl">E-posta:</span>
                <a :href="`mailto:${req.email}`" class="xls-link">{{ req.email }}</a>
              </div>
              <div class="xls-info-row">
                <span class="xls-info-lbl">Hizmet:</span>
                <span>{{ req.service || '—' }}</span>
              </div>
              <div class="xls-info-row">
                <span class="xls-info-lbl">Başvuru:</span>
                <span>{{ formatDate(req.created_at) }}</span>
              </div>
              <div v-if="req.message" class="xls-message-box">
                <div class="xls-info-lbl" style="margin-bottom:4px;">Mesaj:</div>
                <div class="xls-message-text">{{ req.message }}</div>
              </div>
            </div>
            <div class="xls-detail__col">
              <div class="xls-detail__stitle">Notlar</div>
              <textarea v-model="rowForms[req.id]!.notes" class="xls-textarea" rows="5" placeholder="Notunuz…"></textarea>
              <div class="xls-detail__stitle" style="margin-top:0.75rem;">Durum</div>
              <AppSelect
                v-model="rowForms[req.id]!.status"
                :options="[
                  { value: 'new', label: 'Yeni' },
                  { value: 'contacted', label: 'İletişime Geçildi' },
                  { value: 'cancelled', label: 'İptal' },
                ]"
              />
            </div>
          </div>
          <div class="xls-detail__actions">
            <button class="btn-admin-primary" :disabled="saving === req.id" @click.stop="saveRow(req)">
              {{ saving === req.id ? 'Kaydediliyor…' : 'Kaydet' }}
            </button>
            <button class="xls-convert-btn xls-convert-btn--lg" @click.stop="openConvert(req)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              Planlı İşe Çevir
            </button>
            <button class="btn-admin-secondary" @click.stop="expandedId = null">Kapat</button>
            <button class="btn-admin-danger-sm" style="margin-left:auto" @click.stop="deleteReq(req.id)">Sil</button>
          </div>
        </div>
      </template>
    </div>

    <!-- Planlı işe çevirme modalı -->
    <div v-if="convertModal" class="modal-overlay" @click.self="convertModal = null">
      <div class="modal-box">
        <div class="modal-box__header">
          <h2>Planlı İşe Çevir</h2>
          <button class="modal-close" @click="convertModal = null">✕</button>
        </div>
        <p class="modal-desc">
          <strong>{{ convertModal.name }}</strong> için tarih ve saat girin.
          Kaydedilince bu talep planlanmış iş olarak işaretlenecek.
        </p>
        <div class="modal-fields">
          <div class="apt-field">
            <label class="apt-label">Tarih *</label>
            <AppDatePicker v-model="convertForm.date" placeholder="Tarih seçin…" />
          </div>
          <div class="apt-field">
            <label class="apt-label">Saat *</label>
            <AppTimePicker v-model="convertForm.time" placeholder="Saat seçin…" />
          </div>
          <div class="apt-field" style="grid-column:1/-1">
            <label class="apt-label">Not (opsiyonel)</label>
            <textarea v-model="convertForm.notes" class="apt-textarea" rows="3" placeholder="Operasyona özel not…"></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-admin-primary" :disabled="!convertForm.date || converting" @click="doConvert">
            {{ converting ? 'Kaydediliyor…' : 'Planlı İşe Çevir' }}
          </button>
          <button class="btn-admin-secondary" @click="convertModal = null">İptal</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

interface Req {
  id: number
  name: string
  phone: string
  email: string
  service: string
  message: string
  status: string
  notes: string
  type: string
  created_at: string
}

const { data: requests, pending, refresh } = await useFetch<Req[]>('/api/admin/appointments?type=request', {
  headers: useRequestHeaders(['cookie'])
})

const { show: showToast } = useToast()
const search = ref('')
const expandedId = ref<number | null>(null)
const saving = ref<number | null>(null)
const convertModal = ref<Req | null>(null)
const converting = ref(false)

const convertForm = ref({ date: '', time: '', notes: '' })

// Her satır için ayrı reaktif form map
const rowForms = ref<Record<number, { status: string; notes: string }>>({})

watch(requests, (list) => {
  for (const r of list ?? []) {
    if (!rowForms.value[r.id]) {
      rowForms.value[r.id] = { status: r.status, notes: r.notes || '' }
    }
  }
}, { immediate: true })

const counts = computed(() => {
  const list = requests.value ?? []
  return {
    new: list.filter(r => r.status === 'new').length,
    contacted: list.filter(r => r.status === 'contacted').length,
    converted: list.filter(r => r.type === 'appointment').length,
  }
})

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return requests.value ?? []
  return (requests.value ?? []).filter(r =>
    r.name.toLowerCase().includes(q) ||
    (r.phone || '').includes(q) ||
    (r.service || '').toLowerCase().includes(q)
  )
})

function toggleExpand(req: Req) {
  expandedId.value = expandedId.value === req.id ? null : req.id
}

async function saveRow(req: Req) {
  saving.value = req.id
  try {
    await $fetch(`/api/admin/appointments?id=${req.id}`, {
      method: 'PUT',
      body: { ...req, ...rowForms.value[req.id] },
    })
    await refresh()
    showToast('Talep güncellendi!', 'success')
  } catch {
    showToast('Hata oluştu, tekrar deneyin.', 'error')
  } finally {
    saving.value = null
  }
}

async function deleteReq(id: number) {
  if (!confirm('Bu talebi silmek istediğinize emin misiniz?')) return
  try {
    await $fetch(`/api/admin/appointments?id=${id}`, { method: 'DELETE' })
    await refresh()
    showToast('Talep silindi.', 'info')
    expandedId.value = null
  } catch {
    showToast('Silme sırasında hata oluştu.', 'error')
  }
}

function openConvert(req: Req) {
  convertModal.value = req
  convertForm.value = { date: '', time: '', notes: req.notes || '' }
}

async function doConvert() {
  if (!convertModal.value || !convertForm.value.date) return
  converting.value = true
  try {
    await $fetch(`/api/admin/appointments?id=${convertModal.value.id}`, {
      method: 'PUT',
      body: {
        ...convertModal.value,
        type: 'appointment',
        status: 'appointment',
        appointment_date: convertForm.value.date,
        appointment_time: convertForm.value.time,
        notes: convertForm.value.notes,
      },
    })
    await refresh()
    showToast('Talep başarıyla planlandı!', 'success')
    convertModal.value = null
  } catch {
    showToast('Dönüştürme sırasında hata oluştu.', 'error')
  } finally {
    converting.value = false
  }
}

function statusLabel(s: string) {
  return { new: 'Yeni', contacted: 'İletişimde', appointment: 'Planlandı', cancelled: 'İptal' }[s] ?? s
}
function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<style scoped>
.admin-page__subtitle {
  font-size: 0.82rem;
  color: var(--admin-text-muted, #6b7280);
  margin-top: 2px;
}

/* Search */
.appt-search-bar {
  display: flex; align-items: center; gap: 6px;
  background: var(--admin-surface,#fff);
  border: 1px solid var(--admin-border,#e5e7eb);
  border-radius: 6px; padding: 5px 10px;
  margin-bottom: 0.75rem; max-width: 380px;
  color: var(--admin-text-muted,#9ca3af);
}
.appt-search-input { flex:1; border:none; outline:none; font-size:0.8rem; background:transparent; color:var(--admin-text,#111827); }
.appt-search-clear { border:none; background:none; cursor:pointer; font-size:0.75rem; color:var(--admin-text-muted,#9ca3af); }

/* Table */
.xls-wrap { background:var(--admin-surface,#fff); border:1px solid var(--admin-border,#e5e7eb); border-radius:8px; overflow:hidden; font-size:0.8rem; }
.xls-head, .xls-row { display:grid; grid-template-columns:36px 1.8fr 1.2fr 1.3fr 1fr 120px 160px; align-items:center; }
.xls-head { background:var(--admin-bg,#f9fafb); border-bottom:2px solid var(--admin-border,#e5e7eb); font-weight:600; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.04em; color:var(--admin-text-muted,#6b7280); }
.xls-head .xls-col { padding:7px 8px; }
.xls-row { border-bottom:1px solid var(--admin-border,#f3f4f6); cursor:pointer; transition:background 0.12s; min-height:38px; }
.xls-row:hover, .xls-row--open { background:#f0f7ff; }
.xls-row .xls-col { padding:6px 8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.xls-col--nr { color:var(--admin-text-muted,#9ca3af); font-size:0.72rem; text-align:center; }
.xls-col--name { font-weight:500; display:flex; align-items:center; gap:6px; }
.xls-col--actions { display:flex; align-items:center; }

/* Dot */
.xls-dot { display:inline-block; width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.xls-dot--new { background:#3b82f6; }
.xls-dot--contacted { background:#f59e0b; }
.xls-dot--appointment { background:#8b5cf6; }
.xls-dot--cancelled { background:#ef4444; }

/* Pills */
.xls-pill { display:inline-block; padding:2px 8px; border-radius:20px; font-size:0.7rem; font-weight:600; white-space:nowrap; }
.xls-pill--new { background:#eff6ff; color:#2563eb; }
.xls-pill--contacted { background:#fffbeb; color:#d97706; }
.xls-pill--appointment { background:#f3e8ff; color:#7c3aed; }
.xls-pill--cancelled { background:#fef2f2; color:#dc2626; }

.xls-link { color:var(--admin-primary,#7c3aed); text-decoration:none; }
.xls-link:hover { text-decoration:underline; }

/* Convert button */
.xls-convert-btn {
  display:inline-flex; align-items:center; gap:4px;
  padding:3px 10px; border-radius:5px;
  background:#f3e8ff; color:#7c3aed;
  border:1px solid #ddd6fe; font-size:0.72rem; font-weight:600;
  cursor:pointer; transition:background 0.15s;
  white-space:nowrap;
}
.xls-convert-btn:hover { background:#ede9fe; }
.xls-convert-btn--lg { padding:5px 12px; font-size:0.78rem; }

/* Detay */
.xls-detail {
  background:#fafbff; border-top:1px solid #e0e7ff; border-bottom:1px solid var(--admin-border,#e5e7eb);
  padding:1rem;
}
.xls-detail__grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:0.75rem; }
.xls-detail__stitle {
  font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em;
  color:var(--admin-text-muted,#9ca3af); margin-bottom:0.5rem; padding-bottom:4px;
  border-bottom:1px solid var(--admin-border,#e5e7eb);
}
.xls-info-row { display:flex; gap:8px; margin-bottom:4px; font-size:0.78rem; align-items:flex-start; }
.xls-info-lbl { color:var(--admin-text-muted,#6b7280); min-width:60px; flex-shrink:0; }
.xls-message-box { margin-top:0.5rem; }
.xls-message-text {
  background:#fff; border:1px solid var(--admin-border,#e5e7eb); border-radius:5px;
  padding:6px 8px; font-size:0.78rem; color:var(--admin-text,#374151);
  line-height:1.5; max-height:80px; overflow-y:auto; white-space:pre-wrap;
}
.xls-input {
  width:100%; padding:5px 8px; border:1px solid var(--admin-border,#d1d5db);
  border-radius:5px; font-size:0.8rem; background:#fff; color:var(--admin-text,#111827);
  outline:none;
}
.xls-input:focus { border-color:var(--admin-primary,#7c3aed); }
.xls-textarea {
  width:100%; padding:6px 8px; border:1px solid var(--admin-border,#d1d5db);
  border-radius:5px; font-size:0.8rem; background:#fff; color:var(--admin-text,#111827);
  outline:none; resize:vertical; font-family:inherit; line-height:1.5; min-height:80px;
}
.xls-textarea:focus { border-color:var(--admin-primary,#7c3aed); }
.xls-detail__actions { display:flex; gap:8px; align-items:center; padding-top:0.5rem; border-top:1px solid var(--admin-border,#e5e7eb); flex-wrap:wrap; }

/* Modal */
.modal-overlay {
  position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:1000;
  display:flex; align-items:center; justify-content:center; padding:1rem;
}
.modal-box {
  background:#fff; border-radius:12px; padding:1.5rem; width:100%; max-width:480px;
  box-shadow:0 20px 60px rgba(0,0,0,0.2);
}
.modal-box__header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; }
.modal-box__header h2 { font-size:1.1rem; font-weight:700; }
.modal-close { background:none; border:none; font-size:1.2rem; cursor:pointer; color:var(--admin-text-muted,#6b7280); }
.modal-desc { font-size:0.85rem; color:var(--admin-text-muted,#6b7280); margin-bottom:1rem; line-height:1.5; }
.modal-fields { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1rem; }
.modal-actions { display:flex; gap:8px; }
.apt-field { display: flex; flex-direction: column; }
.apt-label { display:block; font-size:0.72rem; font-weight:600; color:var(--admin-text-muted,#6b7280); margin-bottom:4px; }
.apt-input {
  width:100%; padding:6px 10px; border:1px solid var(--admin-border,#d1d5db); border-radius:6px;
  font-size:0.82rem; background:var(--admin-bg,#f9fafb); color:var(--admin-text,#111827); outline:none;
}
.apt-input:focus { border-color:var(--admin-primary,#7c3aed); background:#fff; }
.apt-textarea {
  width:100%; padding:6px 8px; border:1px solid var(--admin-border,#d1d5db); border-radius:5px;
  font-size:0.8rem; background:var(--admin-bg,#f9fafb); color:var(--admin-text,#111827); outline:none;
  resize:vertical; font-family:inherit; line-height:1.5;
}
.apt-textarea:focus { border-color:var(--admin-primary,#7c3aed); background:#fff; }
</style>
