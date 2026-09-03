<script setup lang="ts">
import LocationSearch from '@/components/LocationSearch.vue'
import MapSearchAction from '@/components/MapSearchAction.vue'

defineProps<{ query: string; loading: boolean; mapMoved: boolean; coolingDown: boolean; cooldownSeconds: number }>()
const emit = defineEmits<{ 'update:query': [value: string]; search: []; locate: []; searchArea: [] }>()
</script>

<template>
  <div class="flex flex-col items-center gap-2 sm:hidden">
    <LocationSearch mode="mobile" :model-value="query" :loading="loading" @update:model-value="emit('update:query', $event)" @submit="emit('search')" @locate="emit('locate')" />
    <MapSearchAction :visible="mapMoved" :loading="loading" :cooling-down="coolingDown" :cooldown-seconds="cooldownSeconds" @search="emit('searchArea')" />
  </div>
</template>
