<script setup lang="ts">
import { buildPageCtaBackgroundStyle } from "../../utils/page-cta"

const props = withDefaults(defineProps<{
  title?: string
  lead?: string
  backgroundImage?: string
  primaryLabel?: string
  secondaryLabel?: string
}>(), {
  title: "",
  lead: "",
  backgroundImage: "",
  primaryLabel: "",
  secondaryLabel: "",
})

const previewStyle = computed(() => buildPageCtaBackgroundStyle(props.backgroundImage))
</script>

<template>
  <div class="admin-cta-preview" :style="previewStyle">
    <div class="admin-cta-preview__inner">
      <p class="admin-cta-preview__title">{{ title }}</p>
      <p class="admin-cta-preview__lead">{{ lead }}</p>
      <div v-if="primaryLabel || secondaryLabel" class="admin-cta-preview__actions">
        <span v-if="primaryLabel" class="admin-cta-preview__button">
          {{ primaryLabel }}
        </span>
        <span v-if="secondaryLabel" class="admin-cta-preview__button admin-cta-preview__button--ghost">
          {{ secondaryLabel }}
        </span>
      </div>
    </div>
  </div>
</template>
