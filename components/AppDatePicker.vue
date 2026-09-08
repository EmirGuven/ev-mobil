<template>
  <div ref="wrapRef" class="adp-wrap" :class="{ 'adp-wrap--open': open, 'adp-wrap--filled': !!modelValue }">
    <!-- Trigger -->
    <button type="button" class="adp-trigger" @click="toggle">
      <svg class="adp-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect width="18" height="18" x="3" y="4" rx="2"/>
        <line x1="16" x2="16" y1="2" y2="6"/>
        <line x1="8" x2="8" y1="2" y2="6"/>
        <line x1="3" x2="21" y1="10" y2="10"/>
      </svg>
      <span class="adp-value">{{ displayValue || placeholder }}</span>
      <svg v-if="modelValue" class="adp-clear" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" @click.stop="clear">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
      <svg v-else class="adp-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <!-- Teleport: z-index sorununu aşmak için body'e taşı -->
    <Teleport to="body">
      <div v-if="open" class="adp-backdrop" @click="open = false"></div>
      <div v-if="open" class="adp-dropdown" :style="dropdownStyle" @click.stop>

        <!-- Ay/Yıl Navigasyon -->
        <div class="adp-nav">
          <button type="button" class="adp-nav-btn" @click="prevMonth">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="adp-nav-title">{{ monthName }} {{ viewYear }}</span>
          <button type="button" class="adp-nav-btn" @click="nextMonth">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <!-- Haftanın günleri -->
        <div class="adp-weekdays">
          <span v-for="d in ['Pt','Sa','Ça','Pe','Cu','Ct','Pz']" :key="d">{{ d }}</span>
        </div>

        <!-- Günler -->
        <div class="adp-days">
          <span v-for="blank in leadingBlanks" :key="'b' + blank" class="adp-day adp-day--blank"></span>
          <button
            v-for="day in daysInMonth"
            :key="day"
            type="button"
            class="adp-day"
            :class="{
              'adp-day--selected': isSelected(day),
              'adp-day--today': isToday(day),
              'adp-day--past': isPast(day),
            }"
            @click="selectDay(day)"
          >{{ day }}</button>
        </div>

        <!-- Hızlı Seçimler -->
        <div class="adp-shortcuts">
          <button type="button" class="adp-shortcut" @click="selectQuick(0)">Bugün</button>
          <button type="button" class="adp-shortcut" @click="selectQuick(1)">Yarın</button>
          <button type="button" class="adp-shortcut" @click="selectQuick(7)">+7 gün</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
}>(), {
  placeholder: 'Tarih seçin…'
})

const emit = defineEmits<{ 'update:modelValue': [val: string] }>()

const open = ref(false)
const wrapRef = ref<HTMLElement | null>(null)

const dropdownStyle = ref<Record<string, string>>({})

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())

const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

const monthName = computed(() => MONTHS_TR[viewMonth.value])

const daysInMonth = computed(() =>
  new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
)

const leadingBlanks = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1).getDay()
  return (firstDay + 6) % 7
})

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const parts = props.modelValue.split('-')
  const y = parts[0] ?? ''
  const m = parts[1] ?? '01'
  const d = parts[2] ?? '01'
  return `${d} ${MONTHS_TR[parseInt(m) - 1]} ${y}`
})

function calcPosition() {
  if (!wrapRef.value) return
  const rect = wrapRef.value.getBoundingClientRect()
  const dropH = 360
  const spaceBelow = window.innerHeight - rect.bottom
  const top = spaceBelow >= dropH
    ? rect.bottom + window.scrollY + 6
    : rect.top + window.scrollY - dropH - 6
  dropdownStyle.value = {
    position: 'absolute',
    top: `${top}px`,
    left: `${rect.left + window.scrollX}px`,
    width: '280px',
    zIndex: '9999',
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) {
    if (props.modelValue) {
      const parts = props.modelValue.split('-')
      viewYear.value = parseInt(parts[0] ?? '2026')
      viewMonth.value = parseInt(parts[1] ?? '1') - 1
    }
    nextTick(calcPosition)
  }
}

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}

function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}

function pad(n: number) { return String(n).padStart(2, '0') }

function selectDay(day: number) {
  emit('update:modelValue', `${viewYear.value}-${pad(viewMonth.value + 1)}-${pad(day)}`)
  open.value = false
}

function selectQuick(daysAhead: number) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  emit('update:modelValue', `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
  open.value = false
}

function clear() { emit('update:modelValue', '') }

function isSelected(day: number) {
  if (!props.modelValue) return false
  const parts = props.modelValue.split('-')
  return parseInt(parts[0] ?? '0') === viewYear.value
    && parseInt(parts[1] ?? '0') - 1 === viewMonth.value
    && parseInt(parts[2] ?? '0') === day
}

function isToday(day: number) {
  return today.getFullYear() === viewYear.value && today.getMonth() === viewMonth.value && today.getDate() === day
}

function isPast(day: number) {
  const d = new Date(viewYear.value, viewMonth.value, day)
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return d < t
}
</script>

<style scoped>
.adp-wrap { position: relative; width: 100%; }

.adp-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 40px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
  transition: border-color 0.15s, box-shadow 0.15s;
  text-align: left;
}
.adp-trigger:hover { border-color: #8b5cf6; }
.adp-wrap--open .adp-trigger {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
}
.adp-icon { color: #8b5cf6; flex-shrink: 0; }
.adp-value { flex: 1; }
.adp-wrap:not(.adp-wrap--filled) .adp-trigger .adp-value { color: #9ca3af; }
.adp-wrap--filled .adp-trigger .adp-value { color: #111827; font-weight: 500; }
.adp-chevron { color: #9ca3af; flex-shrink: 0; }
.adp-clear { color: #9ca3af; flex-shrink: 0; cursor: pointer; transition: color 0.15s; }
.adp-clear:hover { color: #ef4444; }

/* Backdrop */
.adp-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
}
</style>

<style>
/* Global: scoped dışı — teleport body içinde render edildiği için */
.adp-dropdown {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  padding: 14px;
  animation: adpIn 0.15s ease;
}
@keyframes adpIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.adp-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.adp-nav-title { font-size: 0.875rem; font-weight: 600; color: #111827; }
.adp-nav-btn {
  width: 28px; height: 28px;
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
  background: transparent;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #374151;
  transition: background 0.15s, border-color 0.15s;
}
.adp-nav-btn:hover { background: #f3f0ff; border-color: #8b5cf6; color: #8b5cf6; }
.adp-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}
.adp-weekdays span {
  text-align: center;
  font-size: 0.7rem; font-weight: 600; color: #9ca3af;
  padding: 2px 0;
}
.adp-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.adp-day {
  width: 100%; aspect-ratio: 1;
  border: none; background: transparent;
  border-radius: 8px;
  font-size: 0.8rem; color: #374151;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.12s, color 0.12s;
}
.adp-day:hover:not(.adp-day--selected):not(.adp-day--blank) { background: #f3f0ff; color: #7c3aed; }
.adp-day--blank { pointer-events: none; }
.adp-day--today:not(.adp-day--selected) { background: #f3f0ff; color: #7c3aed; font-weight: 700; }
.adp-day--selected { background: #8b5cf6; color: #fff; font-weight: 700; }
.adp-day--past { color: #d1d5db; }
.adp-day--past:hover { background: #f9fafb; color: #d1d5db; }
.adp-shortcuts {
  display: flex; gap: 6px;
  margin-top: 10px; padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}
.adp-shortcut {
  flex: 1; padding: 5px 0;
  border: 1.5px solid #e2e8f0; border-radius: 8px;
  background: transparent;
  font-size: 0.72rem; font-weight: 500; color: #6b7280;
  cursor: pointer; transition: all 0.15s;
}
.adp-shortcut:hover { border-color: #8b5cf6; color: #7c3aed; background: #f3f0ff; }
</style>
