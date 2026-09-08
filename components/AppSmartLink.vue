<script setup lang="ts">
import { isExternalLink } from "~/utils/site-settings"

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  to?: string
}>(), {
  to: "/",
})

const attrs = useAttrs()

const href = computed(() => String(props.to || "/").trim() || "/")
const external = computed(() => isExternalLink(href.value))
const target = computed(() => href.value.startsWith("http") ? "_blank" : undefined)
const rel = computed(() => href.value.startsWith("http") ? "noreferrer" : undefined)
</script>

<template>
  <a
    v-if="external"
    v-bind="attrs"
    :href="href"
    :target="target"
    :rel="rel"
  >
    <slot />
  </a>
  <NuxtLink
    v-else
    v-bind="attrs"
    :to="href"
  >
    <slot />
  </NuxtLink>
</template>
