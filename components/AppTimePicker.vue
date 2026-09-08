<template>
  <div ref="wrapRef" class="atp-wrap" :class="{ 'atp-wrap--open': open, 'atp-wrap--filled': !!modelValue }">
    <!-- Trigger -->
    <button type="button" class="atp-trigger" @click="toggle">
      <svg class="atp-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      <span class="atp-value">{{ modelValue || placeholder }}</span>
      <svg v-if="modelValue" class="atp-clear" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" @click.stop="clear">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
      <svg v-else class="atp-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <!-- Teleport: z-index sorununu aşmak için body'e taşı -->
    <Teleport to="body">
      <div v-if="open" class="atp-backdrop" @click="open = false"></div>
      <div v-if="open" class="atp-dropdown" :style="dropdownStyle" @click.stop>

        <!-- Büyük saat gösterimi -->
        <div class="atp-display">
          <span class="atp-display-time">{{ padH }}:{{ padM }}</span>
        </div>

        <!-- Hızlı saat önerileri -->
        <div class="atp-quick-label">Sık Kullanılan</div>
        <div class="atp-quick-grid">
          <button
            v-for="t in quickTimes"
            :key="t"
            type="button"
            class="atp-quick-btn"
            :class="{ 'atp-quick-btn--active': modelValue === t }"
            @click="selectTime(t)"
          >{{ t }}</button>
        </div>

        <!-- Manuel saat/dk seçimi -->
        <div class="atp-sliders">
          <div class="atp-slider-row">
            <span class="atp-slider-lbl">Saat</span>
            <div class="atp-spin-group">
              <button type="button" class="atp-spin-btn" @click="changeHour(-1)">−</button>
              <span class="atp-spin-val">{{ padH }}</span>
              <button type="button" class="atp-spin-btn" @click="changeHour(1)">+</button>
            </div>
          </div>
          <div class="atp-slider-row">
            <span class="atp-slider-lbl">Dakika</span>
            <div class="atp-spin-group">
              <button type="button" class="atp-spin-btn" @click="changeMinute(-5)">−</button>
              <span class="atp-spin-val">{{ padM }}</span>
              <button type="button" class="atp-spin-btn" @click="changeMinute(5)">+</button>
            </div>
          </div>
        </div>

        <button type="button" class="atp-confirm" @click="confirm">Onayla</button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
}>(), {
  placeholder: 'Saat seçin…'
})

const emit = defineEmits<{ 'update:modelValue': [val: string] }>()

const open = ref(false)
const wrapRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

const hour = ref(9)
const minute = ref(0)

const quickTimes = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','17:00']

const pad = (n: number) => String(n).padStart(2, '0')
const padH = computed(() => pad(hour.value))
const padM = computed(() => pad(minute.value))

function calcPosition() {
  if (!wrapRef.value) return
  const rect = wrapRef.value.getBoundingClientRect()
  const dropH = 380
  const spaceBelow = window.innerHeight - rect.bottom
  const top = spaceBelow >= dropH
    ? rect.bottom + window.scrollY + 6
    : rect.top + window.scrollY - dropH - 6
  dropdownStyle.value = {
    position: 'absolute',
    top: `${top}px`,
    left: `${rect.left + window.scrollX}px`,
    width: '260px',
    zIndex: '9999',
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) {
    if (props.modelValue) {
      const parts = props.modelValue.split(':').map(Number)
      hour.value = parts[0] ?? 9
      minute.value = parts[1] ?? 0
    }
    nextTick(calcPosition)
  }
}

function selectTime(t: string) {
  emit('update:modelValue', t)
  open.value = false
}

function changeHour(delta: number) { hour.value = (hour.value + delta + 24) % 24 }
function changeMinute(delta: number) { minute.value = ((minute.value + delta) % 60 + 60) % 60 }

function confirm() {
  emit('update:modelValue', `${padH.value}:${padM.value}`)
  open.value = false
}

function clear() { emit('update:modelValue', '') }
</script>

<style scoped>
.atp-wrap { position: relative; width: 100%; }

.atp-trigger {
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
.atp-trigger:hover { border-color: #8b5cf6; }
.atp-wrap--open .atp-trigger {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
}
.atp-icon { color: #8b5cf6; flex-shrink: 0; }
.atp-value { flex: 1; }
.atp-wrap:not(.atp-wrap--filled) .atp-trigger .atp-value { color: #9ca3af; }
.atp-wrap--filled .atp-trigger .atp-value { color: #111827; font-weight: 600; }
.atp-chevron { color: #9ca3af; }
.atp-clear { color: #9ca3af; cursor: pointer; transition: color 0.15s; }
.atp-clear:hover { color: #ef4444; }

/* Backdrop */
.atp-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
}
</style>

<style>
/* Global — teleport body içinde render edildiği için */
.atp-dropdown {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  padding: 14px;
  animation: atpIn 0.15s ease;
}
@keyframes atpIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.atp-display {
  text-align: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}
.atp-display-time {
  font-size: 2rem; font-weight: 800;
  color: #8b5cf6;
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
}
.atp-quick-label {
  font-size: 0.68rem; font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}
.atp-quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-bottom: 12px;
}
.atp-quick-btn {
  padding: 5px 0;
  border: 1.5px solid #e2e8f0;
  border-radius: 7px;
  background: transparent;
  font-size: 0.75rem; font-weight: 500;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.12s;
}
.atp-quick-btn:hover { border-color: #8b5cf6; color: #7c3aed; background: #f3f0ff; }
.atp-quick-btn--active { background: #8b5cf6; border-color: #8b5cf6; color: #fff; }
.atp-sliders {
  border-top: 1px solid #f1f5f9;
  padding-top: 10px;
  display: flex; flex-direction: column; gap: 8px;
  margin-bottom: 12px;
}
.atp-slider-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.atp-slider-lbl { font-size: 0.8rem; font-weight: 500; color: #6b7280; }
.atp-spin-group {
  display: flex; align-items: center;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  overflow: hidden;
}
.atp-spin-btn {
  width: 32px; height: 30px;
  border: none; background: #f8fafc;
  font-size: 1.1rem; color: #6b7280;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-weight: 500;
  transition: background 0.12s, color 0.12s;
}
.atp-spin-btn:hover { background: #f3f0ff; color: #7c3aed; }
.atp-spin-val {
  width: 38px; text-align: center;
  font-size: 0.9rem; font-weight: 700; color: #111827;
  border-left: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  line-height: 30px;
  font-variant-numeric: tabular-nums;
}
.atp-confirm {
  width: 100%; padding: 8px 0;
  background: #8b5cf6; border: none;
  border-radius: 9px; color: #fff;
  font-size: 0.85rem; font-weight: 600;
  cursor: pointer; transition: background 0.15s;
}
.atp-confirm:hover { background: #7c3aed; }
</style>
