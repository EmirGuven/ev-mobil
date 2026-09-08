<template>
  <div class="admin-page">

    <!-- HEADER -->
    <div class="db-header">
      <div>
        <h1 class="db-title">Genel Bakış</h1>
        <p class="db-date">{{ todayLabel }}</p>
      </div>
    </div>

    <!-- KPI -->
    <div class="db-kpi-row">
      <div class="db-kpi">
        <div class="db-kpi__icon db-kpi__icon--purple">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
        </div>
        <div><div class="db-kpi__num">{{ stats.totalApts }}</div><div class="db-kpi__lbl">Planlanan İş</div></div>
      </div>
      <div class="db-kpi">
        <div class="db-kpi__icon db-kpi__icon--blue">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div><div class="db-kpi__num">{{ stats.newRequests }}</div><div class="db-kpi__lbl">Yeni Talep</div></div>
      </div>
      <div class="db-kpi">
        <div class="db-kpi__icon db-kpi__icon--green">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div><div class="db-kpi__num">{{ stats.todayApts }}</div><div class="db-kpi__lbl">Bugünkü İş</div></div>
      </div>
      <div class="db-kpi" :class="{ 'db-kpi--alert': stats.urgentNotes > 0 }">
        <div class="db-kpi__icon" :class="stats.urgentNotes > 0 ? 'db-kpi__icon--red' : 'db-kpi__icon--gray'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
        </div>
        <div><div class="db-kpi__num">{{ stats.urgentNotes }}</div><div class="db-kpi__lbl">Acil Not</div></div>
      </div>
      <div class="db-kpi">
        <div class="db-kpi__icon db-kpi__icon--amber">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div><div class="db-kpi__num">{{ stats.posts }}</div><div class="db-kpi__lbl">Blog Yazısı</div></div>
      </div>
    </div>

    <!-- GRID -->
    <div class="db-grid">

      <!-- Form Talepleri -->
      <div class="db-card">
        <div class="db-card__head">
          <span class="db-card__dot" style="background:#3b82f6"></span>
          <span class="db-card__ttl">Form Talepleri</span>
          <NuxtLink to="/admin/talepler" class="db-link">Tümü →</NuxtLink>
        </div>
        <div v-if="pendingApts" class="db-empty">Yükleniyor…</div>
        <div v-else-if="!recentRequests.length" class="db-empty">Yeni talep yok.</div>
        <div v-else class="db-list">
          <NuxtLink v-for="req in recentRequests" :key="req.id" :to="`/admin/randevular/${req.id}`" class="db-row">
            <div class="db-row__av db-row__av--blue">{{ req.name.charAt(0).toUpperCase() }}</div>
            <div class="db-row__info">
              <div class="db-row__name">{{ req.name }}</div>
              <div class="db-row__meta">{{ req.service || req.phone || '—' }}</div>
            </div>
            <div class="db-row__end">
              <span class="db-tag" :class="`db-tag--${req.status}`">{{ statusLabel(req.status) }}</span>
              <span class="db-row__date">{{ formatDate(req.created_at) }}</span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Planlanan İşler -->
      <div class="db-card">
        <div class="db-card__head">
          <span class="db-card__dot" style="background:#8b5cf6"></span>
          <span class="db-card__ttl">Planlanan Taşımalar</span>
          <NuxtLink to="/admin/randevular" class="db-link">Tümü →</NuxtLink>
        </div>
        <div v-if="pendingApts" class="db-empty">Yükleniyor…</div>
        <div v-else-if="!upcomingApts.length" class="db-empty">Planlanmış iş yok.</div>
        <div v-else class="db-list">
          <NuxtLink v-for="apt in upcomingApts" :key="apt.id" :to="`/admin/randevular/${apt.id}`"
            class="db-row" :class="{ 'db-row--today': apt.appointment_date === todayStr }">
            <div class="db-row__av db-row__av--purple">{{ apt.name.charAt(0).toUpperCase() }}</div>
            <div class="db-row__info">
              <div class="db-row__name">{{ apt.name }}</div>
              <div class="db-row__meta">{{ apt.service || '—' }}</div>
            </div>
            <div class="db-row__end">
              <span class="db-row__aptdate" :class="{ 'db-row__aptdate--today': apt.appointment_date === todayStr }">
                {{ formatDate(apt.appointment_date) }}
              </span>
              <span v-if="apt.appointment_time" class="db-row__date">{{ apt.appointment_time }}</span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Son 7 Günlük Notlar -->
      <div class="db-card">
        <div class="db-card__head">
          <span class="db-card__dot" style="background:#f59e0b"></span>
          <span class="db-card__ttl">Son 7 Günün Notları</span>
          <NuxtLink to="/admin/notlar" class="db-link">Tümü →</NuxtLink>
        </div>
        <div v-if="pendingNotes" class="db-empty">Yükleniyor…</div>
        <div v-else-if="!dashNotes.length" class="db-empty">Son 7 günde not yok.</div>
        <div v-else class="db-list">
          <div v-for="note in dashNotes" :key="note.id"
            class="db-note" :class="[`db-note--${note.color}`, { 'db-note--overdue': isNoteOverdue(note) }]">
            <div class="db-note__meta">
              <span v-if="note.remind_at" class="db-note__remind">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {{ formatRemind(note.remind_at) }}
              </span>
              <span v-if="note.pinned" class="db-note__pin">📌</span>
              <span v-if="note.done" class="db-note__done">✓</span>
            </div>
            <div v-if="note.title" class="db-note__title">{{ note.title }}</div>
            <div class="db-note__body">{{ note.content }}</div>
            <div class="db-note__age">{{ formatRelative(note.created_at) }}</div>
          </div>
        </div>
        <NuxtLink to="/admin/notlar" class="db-addnote">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          Yeni Not Ekle
        </NuxtLink>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: appointments, pending: pendingApts } = await useFetch<any[]>('/api/admin/appointments')
const { data: blogData } = await useFetch<any[]>('/api/admin/blog')
const { data: notesData, pending: pendingNotes } = await useFetch<any[]>('/api/admin/notes')

const todayStr = new Date().toISOString().slice(0, 10)
const nowIso   = new Date().toISOString()
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

const todayLabel = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const recentRequests = computed(() =>
  (appointments.value ?? [])
    .filter((a: any) => a.type === 'request' || (!a.type && a.status !== 'appointment'))
    .slice(0, 6)
)

const upcomingApts = computed(() =>
  (appointments.value ?? [])
    .filter((a: any) => a.type === 'appointment' && a.appointment_date >= todayStr)
    .sort((a: any, b: any) => {
      const da = a.appointment_date + (a.appointment_time || '')
      const db = b.appointment_date + (b.appointment_time || '')
      return da.localeCompare(db)
    })
    .slice(0, 6)
)

const stats = computed(() => ({
  totalApts:    (appointments.value ?? []).filter((a: any) => a.type === 'appointment').length,
  newRequests:  (appointments.value ?? []).filter((a: any) => a.status === 'new').length,
  todayApts:    (appointments.value ?? []).filter((a: any) => a.appointment_date === todayStr).length,
  urgentNotes:  (notesData.value ?? []).filter((n: any) => !n.done && n.remind_at && n.remind_at <= nowIso).length,
  posts:        blogData.value?.length ?? 0,
}))

// Son 7 günde oluşturulmuş tüm notlar (tamamlanmış dahil)
const dashNotes = computed(() =>
  (notesData.value ?? [])
    .filter((n: any) => n.created_at >= sevenDaysAgo)
    .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10)
)

function isNoteOverdue(n: any) {
  return !n.done && n.remind_at && n.remind_at < nowIso && !n.remind_at.startsWith(todayStr)
}

function statusLabel(s: string) {
  const map: Record<string, string> = { new: 'Yeni', contacted: 'İletişimde', completed: 'Tamamlandı', cancelled: 'İptal', appointment: 'Planlandı' }
  return map[s] ?? s
}
function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function formatRemind(d: string) {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) + ' ' +
    dt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}
function formatRelative(d: string) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2)   return 'Az önce'
  if (mins < 60)  return `${mins} dk önce`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs} sa önce`
  const days = Math.floor(hrs / 24)
  return `${days} gün önce`
}
</script>

<style scoped>
/* ── HEADER ── */
.db-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
.db-title  { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0 0 2px; }
.db-date   { font-size: 0.8rem; color: #9ca3af; margin: 0; }

/* ── KPI ── */
.db-kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
@media (max-width: 900px) { .db-kpi-row { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 500px) { .db-kpi-row { grid-template-columns: repeat(2, 1fr); } }

.db-kpi {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.db-kpi--alert { border-color: #fca5a5; background: #fef2f2; }

.db-kpi__icon {
  width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.db-kpi__icon--purple { background: #ede9fe; color: #7c3aed; }
.db-kpi__icon--blue   { background: #dbeafe; color: #2563eb; }
.db-kpi__icon--green  { background: #dcfce7; color: #16a34a; }
.db-kpi__icon--amber  { background: #fef3c7; color: #d97706; }
.db-kpi__icon--red    { background: #fecaca; color: #dc2626; }
.db-kpi__icon--gray   { background: #f3f4f6; color: #9ca3af; }

.db-kpi__num { font-size: 1.3rem; font-weight: 800; line-height: 1; color: #111827; }
.db-kpi__lbl { font-size: 0.68rem; color: #9ca3af; margin-top: 2px; }

/* ── GRID ── */
.db-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  align-items: start;
}
@media (max-width: 1100px) { .db-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 700px)  { .db-grid { grid-template-columns: 1fr; } }

/* ── CARD ── */
.db-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}
.db-card__head {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid #f3f4f6;
}
.db-card__dot  { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.db-card__ttl  { flex: 1; font-size: 0.8rem; font-weight: 700; color: #111827; }
.db-link       { font-size: 0.72rem; color: #6b7280; text-decoration: none; }

.db-empty { padding: 1.25rem 14px; font-size: 0.8rem; color: #9ca3af; }

/* ── LIST ROW ── */
.db-list { display: flex; flex-direction: column; }
.db-row {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 14px;
  border-bottom: 1px solid #f3f4f6;
  text-decoration: none; color: inherit;
}
.db-row:last-child { border-bottom: none; }
.db-row--today { background: #f0fdf4; }

.db-row__av {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  font-size: 0.78rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.db-row__av--blue   { background: #dbeafe; color: #1d4ed8; }
.db-row__av--purple { background: #ede9fe; color: #7c3aed; }

.db-row__info   { flex: 1; min-width: 0; }
.db-row__name   { font-size: 0.78rem; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.db-row__meta   { font-size: 0.68rem; color: #9ca3af; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.db-row__end    { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
.db-row__date   { font-size: 0.65rem; color: #9ca3af; }
.db-row__aptdate { font-size: 0.72rem; font-weight: 600; color: #374151; }
.db-row__aptdate--today { color: #059669; }

/* ── STATUS TAG ── */
.db-tag { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: 600; }
.db-tag--new       { background: #dbeafe; color: #1d4ed8; }
.db-tag--contacted { background: #fef3c7; color: #92400e; }
.db-tag--completed { background: #dcfce7; color: #166534; }
.db-tag--cancelled { background: #fee2e2; color: #991b1b; }
.db-tag--appointment { background: #ede9fe; color: #6d28d9; }

/* ── NOTES ── */
.db-note {
  padding: 8px 14px;
  border-bottom: 1px solid #f3f4f6;
  border-left: 3px solid transparent;
}
.db-note:last-child { border-bottom: none; }
.db-note--yellow { border-left-color: #f59e0b; }
.db-note--blue   { border-left-color: #3b82f6; }
.db-note--green  { border-left-color: #22c55e; }
.db-note--red    { border-left-color: #ef4444; }
.db-note--purple { border-left-color: #8b5cf6; }
.db-note--gray   { border-left-color: #d1d5db; }
.db-note--overdue { background: #fef2f2; border-left-color: #dc2626 !important; }

.db-note__meta   { display: flex; align-items: center; gap: 5px; margin-bottom: 2px; }
.db-note__remind { display: flex; align-items: center; gap: 3px; font-size: 0.65rem; color: #dc2626; font-weight: 700; }
.db-note__pin    { font-size: 0.68rem; }
.db-note__done   { font-size: 0.68rem; color: #16a34a; }
.db-note__title  { font-size: 0.78rem; font-weight: 700; color: #111827; margin-bottom: 1px; }
.db-note__body   { font-size: 0.75rem; color: #374151; line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; }
.db-note__age    { font-size: 0.63rem; color: #9ca3af; margin-top: 3px; }

.db-addnote {
  display: flex; align-items: center; gap: 5px;
  margin: 8px 14px 10px; padding: 5px 10px; border-radius: 6px;
  font-size: 0.72rem; color: #6b7280; text-decoration: none;
  border: 1px dashed #e5e7eb; width: fit-content;
}
</style>
