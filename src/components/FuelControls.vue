<script setup lang="ts">
import { PhArrowClockwise } from '@phosphor-icons/vue'
import type { CountryCode, SortOption, StationFilters } from '@/domain/fuel'

defineProps<{ country: CountryCode; sort: SortOption; filters: StationFilters; loading: boolean; coolingDown: boolean; mode: 'desktop' | 'mobile' }>()
const emit = defineEmits<{ countryChange: [country: CountryCode]; filtersChange: [filters: StationFilters]; sortChange: [sort: SortOption]; refresh: [] }>()
</script>

<template>
  <header :class="mode === 'mobile' ? 'flex justify-between gap-2 rounded-full bg-base-100 p-1.5' : 'z-20 flex gap-2 rounded-box bg-base-100/95 p-1.5 shadow-lg backdrop-blur'" aria-label="Filtres">
    <div class="join"><button class="btn btn-sm join-item" :class="{ 'btn-active btn-primary': country === 'fr' }" @click="emit('countryChange', 'fr')">FR</button><button class="btn btn-sm join-item" :class="{ 'btn-active btn-primary': country === 'de' }" @click="emit('countryChange', 'de')">DE</button></div>
    <div class="join"><button class="btn btn-sm join-item" :class="{ 'btn-primary': filters.openNow }" @click="emit('filtersChange', { ...filters, openNow: !filters.openNow })">Ouvert</button><button v-if="country === 'fr'" class="btn btn-sm join-item" :class="{ 'btn-primary': filters.automatedPayment }" @click="emit('filtersChange', { ...filters, automatedPayment: !filters.automatedPayment })">24/24</button></div>
    <select v-if="mode === 'desktop'" :value="sort" class="select select-sm" aria-label="Trier les stations" @change="emit('sortChange', ($event.target as HTMLSelectElement).value as SortOption)"><option value="price">Prix</option><option value="distance">Distance</option></select>
    <button v-if="mode === 'desktop'" class="btn btn-sm btn-ghost" :disabled="loading || coolingDown" :title="coolingDown ? 'Nouvelle recherche bientôt disponible' : 'Rafraîchir les prix'" @click="emit('refresh')"><PhArrowClockwise :size="20" weight="bold" /></button>
  </header>
</template>
