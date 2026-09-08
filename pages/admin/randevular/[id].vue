<template>
  <div class="admin-page">

    <!-- Geri + Başlık -->
    <div class="admin-page__header">
      <NuxtLink to="/admin/randevular" class="apt-back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Planlanan İşlere Dön
      </NuxtLink>
      <h1>İş Detayı</h1>
    </div>

    <div v-if="pending" class="admin-loading">Yükleniyor…</div>
    <div v-else-if="!apt" class="admin-empty">Kayıt bulunamadı.</div>

    <div v-else class="apt-detail-layout">

      <!-- Sol Kart: Kişi Bilgileri -->
      <div class="apt-card">
        <div class="apt-card__head">
          <div class="apt-avatar">{{ apt.name.charAt(0).toUpperCase() }}</div>
          <div>
            <div class="apt-card__name">{{ apt.name }}</div>
            <span class="xls-status-pill" :class="`xls-status-pill--${apt.status}`">
              {{ statusLabel(apt.status) }}
            </span>
          </div>
        </div>

        <div class="apt-card__section">Kişi Bilgileri</div>
        <div class="apt-info-row" v-if="apt.phone">
          <span class="apt-info-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 9.5 19.79 19.79 0 0 1 1.65 4.77 2 2 0 0 1 3.62 2.5H6.6a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17z"/></svg>
            Telefon
          </span>
          <a :href="`tel:${apt.phone}`" class="apt-info-val apt-link">{{ apt.phone }}</a>
        </div>
        <div class="apt-info-row" v-if="apt.email">
          <span class="apt-info-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            E-posta
          </span>
          <a :href="`mailto:${apt.email}`" class="apt-info-val apt-link">{{ apt.email }}</a>
        </div>
        <div class="apt-info-row" v-if="apt.service">
          <span class="apt-info-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
            Hizmet
          </span>
          <span class="apt-info-val">{{ apt.service }}</span>
        </div>
        <div class="apt-info-row">
          <span class="apt-info-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            Başvuru
          </span>
          <span class="apt-info-val">{{ formatDate(apt.created_at) }}</span>
        </div>

        <div v-if="apt.message" class="apt-message-box">
          <div class="apt-card__section">Başvuru Mesajı</div>
          <p class="apt-message-text">{{ apt.message }}</p>
        </div>
      </div>

      <!-- Sağ: Düzenleme Formu -->
      <div class="apt-edit-panel">

        <!-- Durum & Planlama -->
        <div class="apt-edit-section">
          <div class="apt-edit-section__title">Durum & Planlama</div>
          <div class="apt-edit-grid apt-edit-grid--3">
            <div class="apt-field">
              <label class="apt-label">Durum</label>
              <AppSelect
                v-model="form.status"
                :options="[
                  { value: 'new', label: 'Yeni Talep' },
                  { value: 'contacted', label: 'İletişime Geçildi' },
                  { value: 'appointment', label: 'Planlandı' },
                  { value: 'completed', label: 'Tamamlandı' },
                  { value: 'cancelled', label: 'İptal' },
                ]"
              />
            </div>
            <div class="apt-field">
              <label class="apt-label">Planlanan Tarih</label>
              <AppDatePicker v-model="form.appointment_date" placeholder="Tarih seçin…" />
            </div>
            <div class="apt-field">
              <label class="apt-label">Planlanan Saat</label>
              <AppTimePicker v-model="form.appointment_time" placeholder="Saat seçin…" />
            </div>
          </div>
        </div>

        <!-- Takip Bilgileri -->
        <div class="apt-edit-section">
          <div class="apt-edit-section__title">Operasyon Takibi</div>
          <div class="apt-edit-grid apt-edit-grid--3">
            <div class="apt-field">
              <label class="apt-label">İlk İletişim Tarihi</label>
              <AppDatePicker v-model="form.first_visit_date" placeholder="Tarih seçin…" />
            </div>
            <div class="apt-field">
              <label class="apt-label">Hedef Taşıma Tarihi</label>
              <AppDatePicker v-model="form.issue_date" placeholder="Tarih seçin…" />
            </div>
            <div class="apt-field">
              <label class="apt-label">Operasyon Etabı</label>
              <input v-model.number="form.session_count" type="number" min="0" class="apt-input" placeholder="0" />
            </div>
          </div>
        </div>

        <!-- Notlar -->
        <div class="apt-edit-section">
          <div class="apt-edit-section__title">Operasyon Notları</div>
          <textarea
            v-model="form.notes"
            class="apt-textarea"
            rows="8"
            placeholder="Talebe özel notlarınızı buraya yazın…"
          ></textarea>
        </div>

        <!-- Kaydet -->
        <div class="apt-edit-actions">
          <button class="btn-admin-primary" :disabled="saving" @click="save">
            {{ saving ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet' }}
          </button>
          <button class="btn-admin-danger-sm apt-edit-actions__del" @click="deleteApt">Kaydı Sil</button>
        </div>
      </div>

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
  type: string
  appointment_date: string
  appointment_time: string
  first_visit_date: string
  issue_date: string
  session_count: number
  created_at: string
}

const route = useRoute()
const router = useRouter()
const id = route.params.id

const { data: allApts, pending } = await useFetch<Appointment[]>('/api/admin/appointments', {
  headers: useRequestHeaders(['cookie'])
})

const apt = computed(() => allApts.value?.find(a => String(a.id) === String(id)) ?? null)

const form = ref({
  status: '',
  notes: '',
  appointment_date: '',
  appointment_time: '',
  first_visit_date: '',
  issue_date: '',
  session_count: 0,
  type: 'appointment',
})

watch(apt, (val) => {
  if (!val) return
  form.value = {
    status: val.status,
    notes: val.notes || '',
    appointment_date: val.appointment_date || '',
    appointment_time: val.appointment_time || '',
    first_visit_date: val.first_visit_date || '',
    issue_date: val.issue_date || '',
    session_count: val.session_count || 0,
    type: val.type || 'appointment',
  }
}, { immediate: true })

const saving = ref(false)
const { show: showToast } = useToast()

async function save() {
  saving.value = true
  try {
    await $fetch(`/api/admin/appointments?id=${id}`, {
      method: 'PUT',
      body: form.value,
    })
    showToast('İş kaydı başarıyla güncellendi!', 'success')
  } catch {
    showToast('Kaydetme sırasında hata oluştu.', 'error')
  } finally {
    saving.value = false
  }
}

async function deleteApt() {
  if (!confirm('Bu kaydı kalıcı olarak silmek istediğinize emin misiniz?')) return
  try {
    await $fetch(`/api/admin/appointments?id=${id}`, { method: 'DELETE' })
    showToast('Kayıt silindi.', 'info')
    router.push('/admin/randevular')
  } catch {
    showToast('Silme sırasında hata oluştu.', 'error')
  }
}

function statusLabel(s: string) {
  return {
    new: 'Yeni Talep', contacted: 'İletişimde', appointment: 'Planlandı',
    completed: 'Tamamlandı', cancelled: 'İptal'
  }[s] ?? s
}

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<style scoped>
.apt-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  color: var(--admin-text-muted, #6b7280);
  text-decoration: none;
  margin-bottom: 0.5rem;
  padding: 4px 8px;
  border-radius: 5px;
  transition: background 0.15s;
}
.apt-back-btn:hover { background: var(--admin-bg, #f3f4f6); }

.admin-page__header h1 { margin-top: 4px; }

.apt-detail-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.25rem;
  align-items: start;
}
@media (max-width: 900px) {
  .apt-detail-layout { grid-template-columns: 1fr; }
}

/* Sol kart */
.apt-card {
  background: var(--admin-surface, #fff);
  border: 1px solid var(--admin-border, #e5e7eb);
  border-radius: 10px;
  padding: 1.25rem;
}
.apt-card__head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--admin-border, #e5e7eb);
}
.apt-avatar {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: var(--admin-primary, #7c3aed);
  color: #fff;
  font-weight: 700;
  font-size: 1.2rem;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.apt-card__name { font-weight: 700; font-size: 1rem; margin-bottom: 4px; }
.apt-card__section {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--admin-text-muted, #9ca3af);
  margin: 1rem 0 0.5rem;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--admin-border, #e5e7eb);
}
.apt-info-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 0.8rem;
}
.apt-info-label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--admin-text-muted, #6b7280);
  min-width: 72px;
  flex-shrink: 0;
  padding-top: 1px;
}
.apt-info-val { color: var(--admin-text, #111827); font-weight: 500; }
.apt-link { color: var(--admin-primary, #7c3aed); text-decoration: none; }
.apt-link:hover { text-decoration: underline; }

.apt-message-box { margin-top: 0.75rem; }
.apt-message-text {
  font-size: 0.8rem;
  color: var(--admin-text, #374151);
  line-height: 1.6;
  background: var(--admin-bg, #f9fafb);
  border-radius: 6px;
  padding: 8px 10px;
  white-space: pre-wrap;
}

/* Status Pill */
.xls-status-pill {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
}
.xls-status-pill--new { background: #eff6ff; color: #2563eb; }
.xls-status-pill--contacted { background: #fffbeb; color: #d97706; }
.xls-status-pill--appointment { background: #f3e8ff; color: #7c3aed; }
.xls-status-pill--completed { background: #ecfdf5; color: #059669; }
.xls-status-pill--cancelled { background: #fef2f2; color: #dc2626; }

/* Sağ panel */
.apt-edit-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.apt-edit-section {
  background: var(--admin-surface, #fff);
  border: 1px solid var(--admin-border, #e5e7eb);
  border-radius: 10px;
  padding: 1rem 1.25rem;
}
.apt-edit-section__title {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--admin-text-muted, #9ca3af);
  margin-bottom: 0.75rem;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--admin-border, #e5e7eb);
}
.apt-edit-grid {
  display: grid;
  gap: 0.75rem;
}
.apt-edit-grid--3 { grid-template-columns: repeat(3, 1fr); }
@media (max-width: 700px) {
  .apt-edit-grid--3 { grid-template-columns: 1fr 1fr; }
}
.apt-field { display: flex; flex-direction: column; }
.apt-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--admin-text-muted, #6b7280);
  margin-bottom: 4px;
}
.apt-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--admin-border, #d1d5db);
  border-radius: 6px;
  font-size: 0.82rem;
  background: var(--admin-bg, #f9fafb);
  color: var(--admin-text, #111827);
  outline: none;
  transition: border-color 0.15s, background 0.15s;
}
.apt-input:focus {
  border-color: var(--admin-primary, #7c3aed);
  background: #fff;
}
.apt-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--admin-border, #d1d5db);
  border-radius: 6px;
  font-size: 0.82rem;
  background: var(--admin-bg, #f9fafb);
  color: var(--admin-text, #111827);
  outline: none;
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
  min-height: 140px;
  transition: border-color 0.15s, background 0.15s;
}
.apt-textarea:focus {
  border-color: var(--admin-primary, #7c3aed);
  background: #fff;
}
.apt-edit-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.75rem 0 0.25rem;
}
.apt-edit-actions__del { margin-left: auto; }
.apt-saved-msg {
  font-size: 0.8rem;
  color: #059669;
  font-weight: 600;
}
</style>
