<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1>Planlanan İşler</h1>
    </div>

    <!-- Stats Bar -->
    <div class="appt-stats-bar">
      <div class="appt-stat-item appt-stat-item--all">
        <span class="appt-stat-item__number">{{ appointments?.length ?? 0 }}</span>
        <span class="appt-stat-item__label">Toplam</span>
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
        <span class="appt-stat-item__number">{{ counts.completed }}</span>
        <span class="appt-stat-item__label">Tamamlandı</span>
      </div>
      <div class="appt-stat-item appt-stat-item--cancelled">
        <span class="appt-stat-item__number">{{ counts.cancelled }}</span>
        <span class="appt-stat-item__label">İptal</span>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="admin-filter-bar" style="margin-bottom:0.75rem;">
      <button
        v-for="tab in filterTabs"
        :key="tab.value"
        class="admin-filter-btn"
        :class="{ 'admin-filter-btn--active': activeFilter === tab.value }"
        @click="activeFilter = tab.value"
      >
        {{ tab.label }}
        <span v-if="tab.value !== 'all'" class="appt-filter-count">{{ counts[tab.value as keyof typeof counts] }}</span>
      </button>
    </div>

    <!-- Search -->
    <div class="appt-search-bar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input v-model="search" type="text" placeholder="İsim, telefon veya hizmet ara…" class="appt-search-input" />
      <button v-if="search" @click="search = ''" class="appt-search-clear">✕</button>
    </div>

    <div v-if="pending" class="admin-loading">Yükleniyor…</div>
    <div v-else-if="!filteredAppointments.length" class="admin-empty">Kayıt bulunamadı.</div>

    <!-- Excel Tablo -->
    <div v-else class="xls-wrap">
      <!-- Başlık Satırı -->
      <div class="xls-head">
        <div class="xls-col xls-col--nr">#</div>
        <div class="xls-col xls-col--name">Ad Soyad</div>
        <div class="xls-col xls-col--phone">Telefon</div>
        <div class="xls-col xls-col--service">Hizmet</div>
        <div class="xls-col xls-col--date">Başvuru</div>
        <div class="xls-col xls-col--status">Durum</div>
        <div class="xls-col xls-col--expand"></div>
      </div>

      <!-- Satırlar -->
      <template v-for="(apt, idx) in filteredAppointments" :key="apt.id">
        <!-- Kompakt Satır -->
        <div
          class="xls-row"
          :class="[
            `xls-row--${apt.status}`,
            { 'xls-row--open': expandedId === apt.id }
          ]"
          @click="toggleExpand(apt)"
        >
          <div class="xls-col xls-col--nr">{{ idx + 1 }}</div>
          <div class="xls-col xls-col--name">
            <span class="xls-badge xls-badge--status" :class="`xls-badge--${apt.status}`"></span>
            {{ apt.name }}
          </div>
          <div class="xls-col xls-col--phone">
            <a :href="`tel:${apt.phone}`" @click.stop class="xls-link">{{ apt.phone || '—' }}</a>
          </div>
          <div class="xls-col xls-col--service">{{ apt.service || '—' }}</div>
          <div class="xls-col xls-col--date">{{ formatDate(apt.created_at) }}</div>
          <div class="xls-col xls-col--status">
            <span class="xls-status-pill" :class="`xls-status-pill--${apt.status}`">
              {{ statusLabel(apt.status) }}
            </span>
          </div>
          <div class="xls-col xls-col--expand">
            <NuxtLink :to="`/admin/randevular/${apt.id}`" class="xls-detail-btn" @click.stop title="Tam Sayfada Aç">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
            </NuxtLink>
            <svg class="xls-chevron" :class="{ 'xls-chevron--open': expandedId === apt.id }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>

        <!-- Detay Paneli -->
        <div v-if="expandedId === apt.id && editForm" class="xls-detail">
          <div class="xls-detail__grid">

            <!-- Sol: İletişim bilgileri (readonly) -->
            <div class="xls-detail__col xls-detail__col--info">
              <div class="xls-detail__section-title">Başvuru Bilgileri</div>
              <div class="xls-detail__info-row">
                <span class="xls-detail__info-label">Ad Soyad</span>
                <span class="xls-detail__info-val">{{ apt.name }}</span>
              </div>
              <div class="xls-detail__info-row" v-if="apt.phone">
                <span class="xls-detail__info-label">Telefon</span>
                <a :href="`tel:${apt.phone}`" class="xls-link xls-detail__info-val">{{ apt.phone }}</a>
              </div>
              <div class="xls-detail__info-row" v-if="apt.email">
                <span class="xls-detail__info-label">E-posta</span>
                <a :href="`mailto:${apt.email}`" class="xls-link xls-detail__info-val">{{ apt.email }}</a>
              </div>
              <div class="xls-detail__info-row" v-if="apt.service">
                <span class="xls-detail__info-label">Hizmet</span>
                <span class="xls-detail__info-val">{{ apt.service }}</span>
              </div>
              <div class="xls-detail__info-row">
                <span class="xls-detail__info-label">Başvuru</span>
                <span class="xls-detail__info-val">{{ formatDate(apt.created_at) }}</span>
              </div>
              <div v-if="apt.message" class="xls-detail__message">
                <div class="xls-detail__info-label" style="margin-bottom:4px;">Mesaj</div>
                <div class="xls-detail__message-text">{{ apt.message }}</div>
              </div>
            </div>

            <!-- Orta: Takip alanları -->
            <div class="xls-detail__col xls-detail__col--track">
              <div class="xls-detail__section-title">Takip</div>

              <div class="xls-detail__field">
                <label class="xls-detail__label">İlk İletişim Tarihi</label>
                <input v-model="editForm.first_visit_date" type="date" class="xls-input" />
              </div>

              <div class="xls-detail__field">
                <label class="xls-detail__label">Hedef Taşıma Tarihi</label>
                <input v-model="editForm.issue_date" type="date" class="xls-input" />
              </div>

              <div class="xls-detail__field">
                <label class="xls-detail__label">Operasyon Etabı</label>
                <input v-model.number="editForm.session_count" type="number" min="0" class="xls-input xls-input--sm" placeholder="0" />
              </div>

              <div class="xls-detail__field">
                <label class="xls-detail__label">Durum</label>
                <select v-model="editForm.status" class="xls-input">
                  <option value="new">Yeni Talep</option>
                  <option value="contacted">İletişime Geçildi</option>
                  <option value="appointment">Planlandı</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="cancelled">İptal</option>
                </select>
              </div>
            </div>

            <!-- Sağ: Notlar -->
            <div class="xls-detail__col xls-detail__col--notes">
              <div class="xls-detail__section-title">Notlar</div>
              <textarea
                v-model="editForm.notes"
                class="xls-textarea"
                placeholder="Talebe ait operasyon notlarını buraya yazın…"
                rows="7"
              ></textarea>
            </div>
          </div>

          <!-- Aksiyon Butonları -->
          <div class="xls-detail__actions">
            <button class="btn-admin-primary" :disabled="saving" @click.stop="saveEdit(apt.id)">
              {{ saving ? 'Kaydediliyor…' : 'Kaydet' }}
            </button>
            <button class="btn-admin-secondary" @click.stop="expandedId = null">İptal</button>
            <button class="btn-admin-danger-sm xls-detail__del" @click.stop="deleteApt(apt.id)">Sil</button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

interface Appointment {
  id: number
  name: string
  phone: string
  email: string
  service: string
  message: string
  status: string
  notes: string
  first_visit_date: string
  issue_date: string
  session_count: number
  created_at: string
}

const { data: appointments, pending, refresh } = await useFetch<Appointment[]>('/api/admin/appointments?type=appointment', {
  headers: useRequestHeaders(['cookie'])
})

const { show: showToast } = useToast()
const activeFilter = ref('all')
const search = ref('')
const expandedId = ref<number | null>(null)
const saving = ref(false)
const editForm = ref<Partial<Appointment> | null>(null)

const filterTabs = [
  { label: 'Tümü', value: 'all' },
  { label: 'Yeni', value: 'new' },
  { label: 'İletişimde', value: 'contacted' },
  { label: 'Tamamlandı', value: 'completed' },
  { label: 'İptal', value: 'cancelled' },
]

const counts = computed(() => {
  const list = appointments.value ?? []
  return {
    new: list.filter(a => a.status === 'new').length,
    contacted: list.filter(a => a.status === 'contacted').length,
    completed: list.filter(a => a.status === 'completed').length,
    cancelled: list.filter(a => a.status === 'cancelled').length,
  }
})

const filteredAppointments = computed(() => {
  let list = appointments.value ?? []
  if (activeFilter.value !== 'all') list = list.filter(a => a.status === activeFilter.value)
  const q = search.value.toLowerCase().trim()
  if (q) list = list.filter(a =>
    a.name.toLowerCase().includes(q) ||
    (a.phone || '').includes(q) ||
    (a.service || '').toLowerCase().includes(q)
  )
  return list
})

function toggleExpand(apt: Appointment) {
  if (expandedId.value === apt.id) {
    expandedId.value = null
    editForm.value = null
    return
  }
  expandedId.value = apt.id
  editForm.value = {
    status: apt.status,
    notes: apt.notes || '',
    first_visit_date: apt.first_visit_date || '',
    issue_date: apt.issue_date || '',
    session_count: apt.session_count || 0,
  }
}

async function saveEdit(id: number) {
  saving.value = true
  try {
    await $fetch(`/api/admin/appointments?id=${id}`, {
      method: 'PUT',
      body: editForm.value,
    })
    await refresh()
    showToast('İş kaydı güncellendi!', 'success')
    expandedId.value = null
    editForm.value = null
  } catch {
    showToast('Hata oluştu, tekrar deneyin.', 'error')
  } finally {
    saving.value = false
  }
}

async function deleteApt(id: number) {
  if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return
  try {
    await $fetch(`/api/admin/appointments?id=${id}`, { method: 'DELETE' })
    await refresh()
    showToast('Kayıt silindi.', 'info')
  } catch {
    showToast('Silme sırasında hata oluştu.', 'error')
  }
  expandedId.value = null
  editForm.value = null
}

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function statusLabel(s: string) {
  return { new: 'Yeni Talep', contacted: 'İletişimde', appointment: 'Planlandı', completed: 'Tamamlandı', cancelled: 'İptal' }[s] ?? s
}
</script>

<style scoped>
/* Arama Barı */
.appt-search-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--admin-surface, #fff);
  border: 1px solid var(--admin-border, #e5e7eb);
  border-radius: 6px;
  padding: 5px 10px;
  margin-bottom: 0.75rem;
  max-width: 380px;
  color: var(--admin-text-muted, #9ca3af);
}
.appt-search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.8rem;
  background: transparent;
  color: var(--admin-text, #111827);
}
.appt-search-clear {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--admin-text-muted, #9ca3af);
  padding: 0;
  line-height: 1;
}

/* Excel Wrap */
.xls-wrap {
  background: var(--admin-surface, #fff);
  border: 1px solid var(--admin-border, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
  font-size: 0.8rem;
}

/* Grid Layout */
.xls-head, .xls-row {
  display: grid;
  grid-template-columns: 36px 1.8fr 1.2fr 1.3fr 1fr 130px 60px;
  align-items: center;
}

.xls-head {
  background: var(--admin-bg, #f9fafb);
  border-bottom: 2px solid var(--admin-border, #e5e7eb);
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--admin-text-muted, #6b7280);
}
.xls-head .xls-col { padding: 7px 8px; }

.xls-row {
  border-bottom: 1px solid var(--admin-border, #f3f4f6);
  cursor: pointer;
  transition: background 0.12s;
  min-height: 38px;
}
.xls-row:hover, .xls-row--open {
  background: #f0f7ff;
}
.xls-row:last-child { border-bottom: none; }
.xls-row .xls-col { padding: 6px 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.xls-col--nr { color: var(--admin-text-muted, #9ca3af); font-size: 0.72rem; text-align: center; }
.xls-col--name { font-weight: 500; display: flex; align-items: center; gap: 6px; }
.xls-col--phone, .xls-col--service, .xls-col--date { color: var(--admin-text, #374151); }
.xls-col--expand { display: flex; justify-content: center; }

/* Status dot badge */
.xls-badge--status { display: inline-block; width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.xls-badge--new { background: #3b82f6; }
.xls-badge--contacted { background: #f59e0b; }
.xls-badge--completed { background: #10b981; }
.xls-badge--cancelled { background: #ef4444; }

/* Status Pill */
.xls-status-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}
.xls-status-pill--new { background: #eff6ff; color: #2563eb; }
.xls-status-pill--contacted { background: #fffbeb; color: #d97706; }
.xls-status-pill--completed { background: #ecfdf5; color: #059669; }
.xls-status-pill--cancelled { background: #fef2f2; color: #dc2626; }

/* Chevron */
.xls-chevron { transition: transform 0.2s; color: var(--admin-text-muted, #9ca3af); }
.xls-chevron--open { transform: rotate(180deg); color: var(--admin-primary, #7c3aed); }

/* Detay sayfası linki */
.xls-col--expand { display: flex; justify-content: center; align-items: center; gap: 4px; }
.xls-detail-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px; height: 24px;
  border-radius: 4px;
  color: var(--admin-text-muted, #9ca3af);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}
.xls-detail-btn:hover { background: #e0e7ff; color: var(--admin-primary, #7c3aed); }
.xls-link { color: var(--admin-primary, #7c3aed); text-decoration: none; }
.xls-link:hover { text-decoration: underline; }

/* Detay Paneli */
.xls-detail {
  background: #fafbff;
  border-bottom: 1px solid var(--admin-border, #e5e7eb);
  border-top: 1px solid #e0e7ff;
  padding: 1rem 1rem 0.75rem;
}
.xls-detail__grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1.4fr;
  gap: 1rem;
  margin-bottom: 0.75rem;
}
.xls-detail__section-title {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--admin-text-muted, #9ca3af);
  margin-bottom: 0.6rem;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--admin-border, #e5e7eb);
}
.xls-detail__info-row {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 0.78rem;
}
.xls-detail__info-label {
  color: var(--admin-text-muted, #6b7280);
  min-width: 80px;
  flex-shrink: 0;
}
.xls-detail__info-val {
  color: var(--admin-text, #111827);
  font-weight: 500;
}
.xls-detail__message {
  margin-top: 0.5rem;
  font-size: 0.78rem;
}
.xls-detail__message-text {
  background: #fff;
  border: 1px solid var(--admin-border, #e5e7eb);
  border-radius: 5px;
  padding: 6px 8px;
  color: var(--admin-text, #374151);
  line-height: 1.5;
  max-height: 80px;
  overflow-y: auto;
  white-space: pre-wrap;
}

.xls-detail__field {
  margin-bottom: 0.6rem;
}
.xls-detail__label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--admin-text-muted, #6b7280);
  margin-bottom: 3px;
}
.xls-input {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid var(--admin-border, #d1d5db);
  border-radius: 5px;
  font-size: 0.8rem;
  background: #fff;
  color: var(--admin-text, #111827);
  outline: none;
  transition: border-color 0.15s;
}
.xls-input:focus { border-color: var(--admin-primary, #7c3aed); }
.xls-input--sm { max-width: 100px; }

.xls-textarea {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--admin-border, #d1d5db);
  border-radius: 5px;
  font-size: 0.8rem;
  background: #fff;
  color: var(--admin-text, #111827);
  outline: none;
  resize: vertical;
  line-height: 1.5;
  font-family: inherit;
  transition: border-color 0.15s;
  min-height: 120px;
}
.xls-textarea:focus { border-color: var(--admin-primary, #7c3aed); }

.xls-detail__actions {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-top: 0.5rem;
  border-top: 1px solid var(--admin-border, #e5e7eb);
}
.xls-detail__del { margin-left: auto; }
</style>
