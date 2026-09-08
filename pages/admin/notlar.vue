<template>
  <div class="admin-page npage">

    <!-- ── HEADER ── -->
    <div class="npage-header">
      <div>
        <h1 class="npage-title">Notlar</h1>
        <p class="npage-sub">Hatırlatıcılar, yapılacaklar ve operasyon notları</p>
      </div>
      <button class="nbtn-primary" @click="openNew">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Yeni Not
      </button>
    </div>

    <!-- ── KPI TABS ── -->
    <div class="nkpi-row">
      <button
        v-for="tab in kpiTabs" :key="tab.key"
        class="nkpi"
        :class="{ 'nkpi--active': activeTab === tab.key, [`nkpi--${tab.key}`]: true }"
        @click="activeTab = tab.key as 'all' | 'overdue' | 'today' | 'pinned' | 'done'"
      >
        <div class="nkpi__icon" v-html="tab.icon"></div>
        <div class="nkpi__info">
          <div class="nkpi__num">{{ tab.count }}</div>
          <div class="nkpi__lbl">{{ tab.label }}</div>
        </div>
        <div v-if="tab.count > 0 && tab.key === 'overdue'" class="nkpi__badge">!</div>
      </button>
    </div>

    <!-- ── LOADING / EMPTY ── -->
    <div v-if="pending" class="admin-loading">Yükleniyor…</div>

    <div v-else-if="!displayNotes.length" class="nempty">
      <div class="nempty__ico">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      </div>
      <p>Bu kategoride not bulunmuyor.</p>
      <button class="nbtn-ghost" @click="openNew">+ Yeni not ekle</button>
    </div>

    <!-- ── GRID ── -->
    <div v-else class="ngrid">
      <div
        v-for="note in displayNotes" :key="note.id"
        class="ncard"
        :class="[`ncard--${note.color}`,{ 'ncard--pinned': note.pinned, 'ncard--done': note.done, 'ncard--overdue': isOverdue(note), 'ncard--today': isToday(note) }]"
      >
        <!-- top stripe -->
        <div class="ncard__stripe"></div>

        <!-- toolbar -->
        <div class="ncard__toolbar">
          <!-- remind chip -->
          <div v-if="note.remind_at" class="ncard__chip" :class="{ 'ncard__chip--over': isOverdue(note), 'ncard__chip--today': isToday(note) }">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {{ formatRemind(note.remind_at) }}
          </div>
          <div style="flex:1"></div>
          <button class="ncard__tbtn" :class="{'ncard__tbtn--pin': note.pinned}" @click.stop="togglePin(note)" :title="note.pinned?'Sabiti kaldır':'Sabitle'">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
          </button>
          <button class="ncard__tbtn" :class="{'ncard__tbtn--done': note.done}" @click.stop="toggleDone(note)" :title="note.done?'Aktife al':'Tamamla'">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
          <button class="ncard__tbtn ncard__tbtn--edit" @click.stop="openEdit(note)" title="Düzenle">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
          </button>
        </div>

        <!-- body -->
        <div class="ncard__body" @click="openEdit(note)">
          <div v-if="note.title" class="ncard__title">{{ note.title }}</div>
          <div class="ncard__text">{{ note.content }}</div>
        </div>

        <!-- footer -->
        <div class="ncard__foot">
          <span class="ncard__date">{{ formatDate(note.created_at) }}</span>
          <button class="ncard__del" @click.stop="deleteNote(note.id)">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ── MODAL ── -->
    <Transition name="nmodal">
      <div v-if="modal" class="noverlay" @click.self="modal = null">
        <div class="nmodal" :class="`nmodal--${modal.color}`">

          <!-- header -->
          <div class="nmodal__head">
            <div class="nmodal__head-left">
              <div class="nmodal__color-stripe" :class="`nmodal__stripe--${modal.color}`"></div>
              <span class="nmodal__headtitle">{{ editingId ? 'Notu Düzenle' : 'Yeni Not' }}</span>
            </div>
            <button class="nmodal__close" @click="modal = null">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- renk seçici -->
          <div class="nmodal__colors">
            <button
              v-for="c in colors" :key="c.val"
              class="ncolor-dot"
              :class="[`ncolor-dot--${c.val}`, { 'ncolor-dot--active': modal.color === c.val }]"
              @click="modal.color = c.val"
              :title="c.label"
            ></button>
          </div>

          <!-- form -->
          <div class="nmodal__body">
            <div class="nfield">
              <input
                v-model="modal.title"
                type="text"
                class="nfield__title"
                placeholder="Başlık (opsiyonel)"
              />
            </div>
            <div class="nfield">
              <textarea
                v-model="modal.content"
                class="nfield__textarea"
                rows="6"
                placeholder="Notunuzu buraya yazın…"
                ref="contentRef"
              ></textarea>
            </div>

            <!-- Hatırlatma satırı -->
            <div class="nremind-row">
              <div class="nremind-row__label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Hatırlatma
              </div>
              <div class="nremind-row__fields">
                <div class="nremind-row__picker">
                  <AppDatePicker v-model="remindDate" placeholder="Tarih seçin…" />
                </div>
                <div class="nremind-row__picker nremind-row__picker--time">
                  <AppTimePicker v-model="remindTime" placeholder="Saat…" />
                </div>
                <button v-if="remindDate" class="nremind-clear" @click="remindDate=''; remindTime=''">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            <!-- Sabitle toggle -->
            <label class="npin-toggle">
              <div class="ntoggle" :class="{ 'ntoggle--on': modal.pinned }" @click="modal.pinned = !modal.pinned">
                <div class="ntoggle__knob"></div>
              </div>
              <span>Üstte sabit tut</span>
            </label>
          </div>

          <!-- footer -->
          <div class="nmodal__foot">
            <button
              class="nbtn-primary"
              :disabled="(!modal.content && !modal.title) || savingNote"
              @click="saveNote"
            >
              <svg v-if="savingNote" class="spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              {{ savingNote ? 'Kaydediliyor…' : (editingId ? 'Güncelle' : 'Kaydet') }}
            </button>
            <button class="nbtn-ghost" @click="modal = null">İptal</button>
            <button v-if="editingId" class="nbtn-danger" @click="deleteNote(editingId)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              Sil
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })
const { show: showToast } = useToast()

interface AdminNote {
  id: number
  title: string
  content: string
  remind_at: string
  color: string
  pinned: number
  done: number
  created_at: string
}

const { data: notes, pending, refresh } = await useFetch<AdminNote[]>('/api/admin/notes', {
  headers: useRequestHeaders(['cookie'])
})

const activeTab = ref<'all' | 'overdue' | 'today' | 'pinned' | 'done'>('all')
const savingNote = ref(false)
const editingId = ref<number | null>(null)
const contentRef = ref<HTMLTextAreaElement | null>(null)
const remindDate = ref('')
const remindTime = ref('')

const modal = ref<{
  title: string; content: string; remind_at: string; color: string; pinned: boolean
} | null>(null)

const colors = [
  { val: 'yellow', label: 'Sarı' },
  { val: 'blue',   label: 'Mavi' },
  { val: 'green',  label: 'Yeşil' },
  { val: 'red',    label: 'Kırmızı' },
  { val: 'purple', label: 'Mor' },
  { val: 'gray',   label: 'Gri' },
]

const now = new Date()
const todayStr = now.toISOString().slice(0, 10)
const nowIso   = now.toISOString()

const activeNotes  = computed(() => (notes.value ?? []).filter(n => !n.done))
const doneNotes    = computed(() => (notes.value ?? []).filter(n => !!n.done))
const overdueNotes = computed(() => activeNotes.value.filter(n => n.remind_at && n.remind_at < nowIso && !n.remind_at.startsWith(todayStr)))
const todayNotes   = computed(() => activeNotes.value.filter(n => !!n.remind_at?.startsWith(todayStr)))
const pinnedNotes  = computed(() => activeNotes.value.filter(n => !!n.pinned))

const displayNotes = computed(() => {
  if (activeTab.value === 'done')    return doneNotes.value
  if (activeTab.value === 'overdue') return overdueNotes.value
  if (activeTab.value === 'today')   return todayNotes.value
  if (activeTab.value === 'pinned')  return pinnedNotes.value
  return activeNotes.value
})

const kpiTabs = computed(() => [
  { key: 'all',     label: 'Aktif',          count: activeNotes.value.length,  icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' },
  { key: 'overdue', label: 'Vadesi Geçmiş',  count: overdueNotes.value.length, icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
  { key: 'today',   label: 'Bugün',           count: todayNotes.value.length,   icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
  { key: 'pinned',  label: 'Sabitlenmiş',    count: pinnedNotes.value.length,  icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>' },
  { key: 'done',    label: 'Tamamlandı',      count: doneNotes.value.length,    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' },
])

function isOverdue(n: AdminNote) {
  return !n.done && !!n.remind_at && n.remind_at < nowIso && !n.remind_at.startsWith(todayStr)
}
function isToday(n: AdminNote) {
  return !n.done && !!n.remind_at?.startsWith(todayStr)
}

function openNew() {
  editingId.value = null
  remindDate.value = ''
  remindTime.value = ''
  modal.value = { title: '', content: '', remind_at: '', color: 'yellow', pinned: false }
  nextTick(() => contentRef.value?.focus())
}

function openEdit(note: AdminNote) {
  editingId.value = note.id
  const dt = note.remind_at || ''
  remindDate.value = dt.slice(0, 10)
  remindTime.value = dt.slice(11, 16)
  modal.value = { title: note.title, content: note.content, remind_at: note.remind_at, color: note.color, pinned: !!note.pinned }
}

async function saveNote() {
  if (!modal.value) return
  savingNote.value = true
  const remind = remindDate.value ? `${remindDate.value}T${remindTime.value || '00:00'}:00` : ''
  const payload = { ...modal.value, remind_at: remind }
  try {
    if (editingId.value) {
      await $fetch(`/api/admin/notes?id=${editingId.value}`, { method: 'PUT', body: { ...payload, done: 0 } })
      showToast('Not güncellendi', 'success')
    } else {
      await $fetch('/api/admin/notes', { method: 'POST', body: payload })
      showToast('Not eklendi', 'success')
    }
    await refresh()
    modal.value = null
    editingId.value = null
  } catch {
    showToast('Bir hata oluştu', 'error')
  } finally {
    savingNote.value = false
  }
}

async function deleteNote(id: number) {
  if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return
  try {
    await $fetch(`/api/admin/notes?id=${id}`, { method: 'DELETE' })
    await refresh()
    if (editingId.value === id) { modal.value = null; editingId.value = null }
    showToast('Not silindi', 'info')
  } catch {
    showToast('Silinemedi', 'error')
  }
}

async function toggleDone(note: AdminNote) {
  await $fetch(`/api/admin/notes?id=${note.id}`, { method: 'PUT', body: { ...note, done: note.done ? 0 : 1 } })
  await refresh()
  showToast(note.done ? 'Aktife alındı' : 'Tamamlandı işaretlendi', 'success')
}

async function togglePin(note: AdminNote) {
  await $fetch(`/api/admin/notes?id=${note.id}`, { method: 'PUT', body: { ...note, pinned: note.pinned ? 0 : 1 } })
  await refresh()
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function formatRemind(d: string) {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) + ' ' +
    dt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
/* ═══════════════════════════════ LAYOUT ═══════════════════════════════ */
.npage { width: 100%; max-width: 100%; }

.npage-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.75rem;
  gap: 1rem;
}
.npage-title { font-size: 1.65rem; font-weight: 800; margin: 0 0 3px; color: #111827; }
.npage-sub   { font-size: 0.82rem; color: #6b7280; margin: 0; }

/* ═══════════════════════════════ BUTTONS ═══════════════════════════════ */
.nbtn-primary {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 20px; border-radius: 10px;
  background: #7c3aed; color: #fff; border: none;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  box-shadow: 0 2px 10px rgba(124,58,237,0.35);
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
  white-space: nowrap;
}
.nbtn-primary:hover:not(:disabled) { background: #6d28d9; }
.nbtn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.nbtn-ghost {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 9px 16px; border-radius: 10px;
  background: #f3f4f6; color: #374151; border: none;
  font-size: 0.875rem; cursor: pointer;
  transition: background 0.15s;
}
.nbtn-ghost:hover { background: #e5e7eb; }

.nbtn-danger {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 8px 14px; border-radius: 10px;
  background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;
  font-size: 0.82rem; cursor: pointer; margin-left: auto;
  transition: background 0.15s;
}
.nbtn-danger:hover { background: #fee2e2; }

/* ═══════════════════════════════ KPI TABS ═══════════════════════════════ */
.nkpi-row {
  display: flex; gap: 0.75rem; margin-bottom: 1.75rem; flex-wrap: wrap;
}
.nkpi {
  display: flex; align-items: center; gap: 10px;
  background: #fff; border: 1.5px solid #e5e7eb;
  border-radius: 12px; padding: 12px 16px;
  cursor: pointer; flex: 1; min-width: 110px;
  position: relative; text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.nkpi:hover { border-color: #7c3aed; }
.nkpi--active { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }

.nkpi__icon {
  width: 36px; height: 36px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.nkpi--all     .nkpi__icon { background: #f3e8ff; color: #7c3aed; }
.nkpi--overdue .nkpi__icon { background: #fef2f2; color: #dc2626; }
.nkpi--today   .nkpi__icon { background: #ecfdf5; color: #059669; }
.nkpi--pinned  .nkpi__icon { background: #fffbeb; color: #d97706; }
.nkpi--done    .nkpi__icon { background: #f0fdf4; color: #16a34a; }

.nkpi--active.nkpi--all     .nkpi__icon { background: #7c3aed; color: #fff; }
.nkpi--active.nkpi--overdue .nkpi__icon { background: #dc2626; color: #fff; }
.nkpi--active.nkpi--today   .nkpi__icon { background: #059669; color: #fff; }
.nkpi--active.nkpi--pinned  .nkpi__icon { background: #d97706; color: #fff; }
.nkpi--active.nkpi--done    .nkpi__icon { background: #16a34a; color: #fff; }

.nkpi__num { font-size: 1.4rem; font-weight: 900; line-height: 1; color: #111827; }
.nkpi__lbl { font-size: 0.7rem; color: #9ca3af; margin-top: 2px; font-weight: 500; }
.nkpi__badge {
  position: absolute; top: -5px; right: -5px;
  width: 18px; height: 18px; border-radius: 50%;
  background: #ef4444; color: #fff; font-size: 0.7rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 6px rgba(239,68,68,0.5);
  animation: pulse 1.5s ease infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

/* ═══════════════════════════════ EMPTY ═══════════════════════════════ */
.nempty {
  display: flex; flex-direction: column; align-items: center;
  padding: 5rem 2rem; gap: 0.75rem; color: #9ca3af; text-align: center;
}
.nempty__ico {
  width: 76px; height: 76px; border-radius: 50%;
  background: #f3f4f6; display: flex; align-items: center; justify-content: center;
  margin-bottom: 0.5rem; color: #d1d5db;
}
.nempty p { font-size: 0.9rem; margin: 0; }

/* ═══════════════════════════════ GRID ═══════════════════════════════ */
.ngrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  align-items: start;
}

/* ═══════════════════════════════ KART ═══════════════════════════════ */
.ncard {
  border-radius: 13px; border: 1.5px solid transparent;
  overflow: hidden; display: flex; flex-direction: column;
  transition: box-shadow 0.15s;
  cursor: default;
}
.ncard:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.07); }

/* Renk temaları */
.ncard--yellow { background: #fefce8; border-color: #fde68a; }
.ncard--blue   { background: #eff6ff; border-color: #bfdbfe; }
.ncard--green  { background: #f0fdf4; border-color: #bbf7d0; }
.ncard--red    { background: #fef2f2; border-color: #fecaca; }
.ncard--purple { background: #f5f3ff; border-color: #ddd6fe; }
.ncard--gray   { background: #f9fafb; border-color: #e5e7eb; }

.ncard--done    { opacity: 0.45; }
.ncard--overdue { border-color: #fca5a5 !important; box-shadow: 0 0 0 2px rgba(239,68,68,0.15); }
.ncard--today   { border-color: #6ee7b7 !important; box-shadow: 0 0 0 2px rgba(16,185,129,0.15); }
.ncard--pinned  { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }

/* Üst şerit */
.ncard__stripe { height: 4px; }
.ncard--yellow .ncard__stripe { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.ncard--blue   .ncard__stripe { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.ncard--green  .ncard__stripe { background: linear-gradient(90deg, #22c55e, #4ade80); }
.ncard--red    .ncard__stripe { background: linear-gradient(90deg, #ef4444, #f87171); }
.ncard--purple .ncard__stripe { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
.ncard--gray   .ncard__stripe { background: linear-gradient(90deg, #9ca3af, #d1d5db); }

/* Toolbar */
.ncard__toolbar {
  display: flex; align-items: center; gap: 3px;
  padding: 6px 8px 2px;
}
.ncard__tbtn {
  width: 24px; height: 24px; border-radius: 6px;
  border: none; background: rgba(0,0,0,0.05);
  color: #9ca3af; cursor: pointer; display: flex;
  align-items: center; justify-content: center;
  transition: background 0.12s, color 0.12s;
  flex-shrink: 0;
}
.ncard__tbtn:hover { background: rgba(0,0,0,0.1); color: #374151; }
.ncard__tbtn--pin  { color: #d97706; background: rgba(251,191,36,0.25); }
.ncard__tbtn--done { color: #059669; background: rgba(16,185,129,0.2); }
.ncard__tbtn--edit:hover { color: #7c3aed; background: #ede9fe; }

.ncard__chip {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 0.62rem; padding: 2px 6px; border-radius: 20px;
  background: rgba(0,0,0,0.07); color: #6b7280; white-space: nowrap;
  font-weight: 500;
}
.ncard__chip--over  { background: #fecaca; color: #dc2626; font-weight: 700; }
.ncard__chip--today { background: #bbf7d0; color: #059669; font-weight: 700; }

/* Body */
.ncard__body {
  padding: 6px 12px 8px; cursor: pointer; flex: 1;
}
.ncard__title {
  font-weight: 700; font-size: 0.88rem; margin-bottom: 5px; color: #111827;
  line-height: 1.3;
}
.ncard__text {
  font-size: 0.78rem; color: #374151; line-height: 1.55;
  white-space: pre-wrap; overflow: hidden;
  display: -webkit-box; -webkit-line-clamp: 7; line-clamp: 7;
  -webkit-box-orient: vertical;
}

/* Footer */
.ncard__foot {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 10px 8px;
  border-top: 1px solid rgba(0,0,0,0.06);
}
.ncard__date { font-size: 0.65rem; color: #9ca3af; }
.ncard__del {
  border: none; background: none; cursor: pointer; padding: 3px;
  color: #9ca3af; border-radius: 4px; display: flex;
  transition: color 0.15s, background 0.15s;
}
.ncard__del:hover { color: #dc2626; background: #fef2f2; }

/* ═══════════════════════════════ MODAL ═══════════════════════════════ */
.noverlay {
  position: fixed; inset: 0;
  background: rgba(15,15,30,0.55);
  z-index: 1000; display: flex;
  align-items: center; justify-content: center;
  padding: 1.5rem; backdrop-filter: blur(6px);
}
.nmodal {
  background: #fff; border-radius: 18px;
  width: 100%; max-width: 520px;
  box-shadow: 0 30px 90px rgba(0,0,0,0.25);
  display: flex; flex-direction: column; overflow: hidden;
  border: 1.5px solid #e5e7eb;
}

/* Modal header */
.nmodal__head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid #f3f4f6;
}
.nmodal__head-left { display: flex; align-items: center; gap: 10px; }
.nmodal__color-stripe {
  width: 5px; height: 26px; border-radius: 4px;
}
.nmodal__stripe--yellow { background: #eab308; }
.nmodal__stripe--blue   { background: #3b82f6; }
.nmodal__stripe--green  { background: #22c55e; }
.nmodal__stripe--red    { background: #ef4444; }
.nmodal__stripe--purple { background: #8b5cf6; }
.nmodal__stripe--gray   { background: #9ca3af; }
.nmodal__headtitle { font-size: 1.05rem; font-weight: 700; color: #111827; }

.nmodal__close {
  width: 32px; height: 32px; border-radius: 9px;
  border: none; background: #f3f4f6;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #6b7280; transition: background 0.15s;
}
.nmodal__close:hover { background: #e5e7eb; color: #111; }

/* Renk seçici */
.nmodal__colors {
  display: flex; align-items: center; gap: 10px;
  padding: 0.85rem 1.5rem;
  background: #fafafa; border-bottom: 1px solid #f3f4f6;
}
.ncolor-dot {
  width: 24px; height: 24px; border-radius: 50%;
  border: 2.5px solid transparent; cursor: pointer;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
  flex-shrink: 0;
}
.ncolor-dot:hover { transform: scale(1.2); }
.ncolor-dot--active { border-color: #111827; transform: scale(1.18); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
.ncolor-dot--yellow { background: #fde68a; }
.ncolor-dot--blue   { background: #bfdbfe; }
.ncolor-dot--green  { background: #bbf7d0; }
.ncolor-dot--red    { background: #fecaca; }
.ncolor-dot--purple { background: #ddd6fe; }
.ncolor-dot--gray   { background: #e5e7eb; }

/* Modal body */
.nmodal__body {
  padding: 1.25rem 1.5rem;
  display: flex; flex-direction: column; gap: 12px;
  overflow-y: auto;
}

.nfield__title {
  width: 100%; border: none; outline: none;
  font-size: 1rem; font-weight: 600; color: #111827;
  background: transparent; padding-bottom: 7px;
  border-bottom: 1.5px solid #e5e7eb;
  font-family: inherit;
  transition: border-color 0.15s;
}
.nfield__title::placeholder { color: #d1d5db; font-weight: 400; }
.nfield__title:focus { border-bottom-color: #7c3aed; }

.nfield__textarea {
  width: 100%; border: 1.5px solid #e5e7eb; border-radius: 10px;
  padding: 10px 12px; font-size: 0.875rem; resize: vertical;
  font-family: inherit; line-height: 1.6; color: #374151;
  background: #fafafa; outline: none; min-height: 130px;
  transition: border-color 0.15s, background 0.15s;
}
.nfield__textarea:focus { border-color: #7c3aed; background: #fff; }

/* Hatırlatma */
.nremind-row {
  background: #f8fafc; border: 1.5px solid #e5e7eb;
  border-radius: 10px; padding: 10px 14px;
  display: flex; flex-direction: column; gap: 8px;
}
.nremind-row__label {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.78rem; font-weight: 600; color: #6b7280;
}
.nremind-row__fields {
  display: flex; gap: 8px; align-items: center;
}
.nremind-row__picker { flex: 1; }
.nremind-row__picker--time { flex: 0 0 130px; }
.nremind-clear {
  border: none; background: none; cursor: pointer; display: flex;
  color: #9ca3af; padding: 4px; border-radius: 5px;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}
.nremind-clear:hover { color: #dc2626; background: #fef2f2; }

/* Pin toggle */
.npin-toggle {
  display: flex; align-items: center; gap: 10px;
  cursor: pointer; font-size: 0.82rem; color: #6b7280;
  user-select: none;
}
.ntoggle {
  width: 38px; height: 21px; border-radius: 21px;
  background: #d1d5db; position: relative; cursor: pointer;
  transition: background 0.2s; flex-shrink: 0;
}
.ntoggle--on { background: #7c3aed; }
.ntoggle__knob {
  position: absolute; top: 3px; left: 3px;
  width: 15px; height: 15px; border-radius: 50%; background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}
.ntoggle--on .ntoggle__knob { transform: translateX(17px); }

/* Modal footer */
.nmodal__foot {
  display: flex; gap: 8px; align-items: center;
  padding: 1rem 1.5rem 1.25rem;
  border-top: 1px solid #f3f4f6;
}

/* Spinner */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.7s linear infinite; }

/* Modal transitions */
.nmodal-enter-active { transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.nmodal-leave-active { transition: all 0.18s ease; }
.nmodal-enter-from, .nmodal-leave-to { opacity: 0; transform: scale(0.9) translateY(16px); }
</style>
