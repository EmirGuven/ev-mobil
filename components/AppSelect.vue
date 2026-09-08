<template>
  <div ref="wrapRef" class="asl-wrap" :class="{ 'asl-wrap--open': open, 'asl-wrap--filled': modelValue !== '' && modelValue !== undefined }">
    <!-- Trigger -->
    <button type="button" class="asl-trigger" @click="toggle">
      <span class="asl-value">{{ selectedLabel || placeholder }}</span>
      <svg class="asl-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <!-- Teleport: z-index sorununu aşmak için body'e taşı -->
    <Teleport to="body">
      <div v-if="open" class="asl-backdrop" @click="open = false"></div>
      <div v-if="open" class="asl-dropdown" :style="dropdownStyle" @click.stop>
        <div
          v-for="opt in options"
          :key="opt.value"
          class="asl-option"
          :class="{ 'asl-option--selected': modelValue === opt.value }"
          @click="select(opt.value)"
        >
          <span v-if="modelValue === opt.value" class="asl-check">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <span v-else class="asl-check asl-check--empty"></span>
          <span class="asl-opt-dot" :class="`asl-opt-dot--${opt.value}`"></span>
          {{ opt.label }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  options: { value: string; label: string }[]
  placeholder?: string
}>(), {
  placeholder: 'Seçin…'
})

const emit = defineEmits<{ 'update:modelValue': [val: string] }>()

const open = ref(false)
const wrapRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

const selectedLabel = computed(() =>
  props.options.find(o => o.value === props.modelValue)?.label ?? ''
)

function calcPosition() {
  if (!wrapRef.value) return
  const rect = wrapRef.value.getBoundingClientRect()
  const dropH = props.options.length * 44 + 16
  const spaceBelow = window.innerHeight - rect.bottom
  const top = spaceBelow >= dropH
    ? rect.bottom + window.scrollY + 4
    : rect.top + window.scrollY - dropH - 4
  dropdownStyle.value = {
    position: 'absolute',
    top: `${top}px`,
    left: `${rect.left + window.scrollX}px`,
    minWidth: `${rect.width}px`,
    zIndex: '9999',
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) nextTick(calcPosition)
}

function select(val: string) {
  emit('update:modelValue', val)
  open.value = false
}
</script>

<style scoped>
.asl-wrap { position: relative; width: 100%; }

.asl-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.asl-trigger:hover { border-color: #8b5cf6; }
.asl-wrap--open .asl-trigger {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
}
.asl-value { flex: 1; }
.asl-wrap:not(.asl-wrap--filled) .asl-value { color: #9ca3af; }
.asl-wrap--filled .asl-value { color: #111827; font-weight: 500; }
.asl-chevron { color: #9ca3af; flex-shrink: 0; transition: transform 0.15s; }
.asl-wrap--open .asl-chevron { transform: rotate(180deg); }

.asl-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
}
</style>

<style>
/* Global — teleport body içinde render edildiği için */
.asl-dropdown {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.14);
  overflow: hidden;
  animation: aslIn 0.14s ease;
}
@keyframes aslIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.asl-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: background 0.1s;
}
.asl-option:hover { background: #f8f5ff; }
.asl-option--selected { background: #f3f0ff; color: #7c3aed; font-weight: 500; }
.asl-check {
  width: 16px; height: 16px;
  display: flex; align-items: center; justify-content: center;
  color: #7c3aed; flex-shrink: 0;
}
.asl-check--empty { width: 16px; }
.asl-opt-dot {
  width: 8px; height: 8px;
  border-radius: 50%; flex-shrink: 0;
}
.asl-opt-dot--new        { background: #3b82f6; }
.asl-opt-dot--contacted  { background: #f59e0b; }
.asl-opt-dot--appointment{ background: #8b5cf6; }
.asl-opt-dot--completed  { background: #10b981; }
.asl-opt-dot--cancelled  { background: #ef4444; }
.asl-opt-dot--yellow  { background: #fbbf24; }
.asl-opt-dot--blue    { background: #3b82f6; }
.asl-opt-dot--green   { background: #10b981; }
.asl-opt-dot--red     { background: #ef4444; }
.asl-opt-dot--purple  { background: #8b5cf6; }
.asl-opt-dot--pink    { background: #ec4899; }
.asl-opt-dot--all,
.asl-opt-dot--default { background: #d1d5db; }
</style>
