<script setup lang="ts">
import LocationSearch from '@/components/LocationSearch.vue'
import MapSearchAction from '@/components/MapSearchAction.vue'
import type { SortOption } from '@/domain/fuel'

defineProps<{ query: string; loading: boolean; sort: SortOption; mapMoved: boolean; coolingDown: boolean; cooldownSeconds: number }>()
const emit = defineEmits<{ 'update:query': [value: string]; search: []; locate: []; searchArea: [] }>()
</script>

<template>
  <div class="absolute left-2 right-2 top-16 z-30 flex flex-col items-center gap-2 sm:hidden">
    <LocationSearch mode="mobile" :model-value="query" :loading="loading" @update:model-value="emit('update:query', $event)" @submit="emit('search')" @locate="emit('locate')" />
    <MapSearchAction :visible="mapMoved" :loading="loading" :cooling-down="coolingDown" :cooldown-seconds="cooldownSeconds" @search="emit('searchArea')" />
  </div>
</template>
