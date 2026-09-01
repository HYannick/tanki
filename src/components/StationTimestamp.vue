<script setup lang="ts">
import { PhClock } from '@phosphor-icons/vue'

const props = defineProps<{ updatedAt?: Date; fetchedAt?: Date; compact?: boolean }>()
const timestamp = () => props.updatedAt ?? props.fetchedAt
const label = () => props.updatedAt ? 'Mis à jour' : 'Données reçues'
const format = () => {
  const value = timestamp()
  if (!value) return ''
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(value)
}
</script>

<template>
  <p v-if="timestamp()" class="flex items-center gap-1 text-base-content/55" :class="compact ? 'text-[11px]' : 'mt-3 text-xs'">
    <PhClock :size="compact ? 12 : 14" /> {{ label() }} le {{ format() }}
  </p>
</template>
