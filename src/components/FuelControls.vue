<script setup lang="ts">
import type { CountryCode, SortOption, StationFilters } from '@/domain/fuel'

defineProps<{ country: CountryCode; sort: SortOption; filters: StationFilters }>()
const emit = defineEmits<{ filtersChange: [filters: StationFilters]; sortChange: [sort: SortOption] }>()
</script>

<template>
  <header class="z-20 flex gap-2 bg-base-100/95 px-4 py-2.5" aria-label="Filtres">
    <div class="join"><button class="btn btn-sm join-item" :class="{ 'btn-primary': filters.openNow }" @click="emit('filtersChange', { ...filters, openNow: !filters.openNow })">Ouvert</button><button v-if="country === 'fr'" class="btn btn-sm join-item" :class="{ 'btn-primary': filters.automatedPayment }" @click="emit('filtersChange', { ...filters, automatedPayment: !filters.automatedPayment })">24/24</button></div>
    <select :value="sort" class="select select-sm" aria-label="Trier les stations" @change="emit('sortChange', ($event.target as HTMLSelectElement).value as SortOption)"><option value="price">Prix</option><option value="distance">Distance</option></select>
  </header>
</template>
