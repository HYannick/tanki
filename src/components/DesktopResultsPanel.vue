<script setup lang="ts">
import LocationSearch from '@/components/LocationSearch.vue'
import StationList from '@/components/StationList.vue'
import type { CountryCode, FuelStation, FuelType } from '@/domain/fuel'

defineProps<{ query: string; loading: boolean; message: string; error: boolean; stations: FuelStation[]; fuelType: FuelType; selectedId?: string; country: CountryCode }>()
const emit = defineEmits<{ 'update:query': [value: string]; search: []; locate: []; select: [station: FuelStation] }>()
</script>

<template>
  <aside class="flex w-full flex-1 flex-col overflow-hidden rounded-box bg-base-100/95 pt-2 shadow-xl backdrop-blur">
    <div class="border-b border-base-200 px-5 py-3"><p class="text-xs font-bold uppercase tracking-wider text-base-content/50">Autour de vous</p><p class="mt-0.5 text-xs leading-relaxed text-base-content/65" :class="{ 'text-error': error }">{{ message }}</p></div>
    <LocationSearch :model-value="query" :loading="loading" @update:model-value="emit('update:query', $event)" @submit="emit('search')" @locate="emit('locate')" />
    <StationList v-if="stations.length" :stations="stations" :fuel-type="fuelType" :selected-id="selectedId" @select="emit('select', $event)" />
    <p v-else-if="!loading" class="px-5 text-sm leading-relaxed text-base-content/60">La carte restera accessible, même si la position ou les prix ne sont pas disponibles.</p>
    <footer class="mt-auto border-t border-base-200 px-5 py-3 text-[11px] text-base-content/50">Prix : <a v-if="country === 'fr'" class="link" href="https://www.prix-carburants.gouv.fr/index.php/rubrique/opendata/" target="_blank" rel="noreferrer">Prix des carburants · Licence Ouverte</a><a v-else class="link" href="https://creativecommons.tankerkoenig.de/" target="_blank" rel="noreferrer">Tankerkönig · CC BY 4.0</a> · Lieux © <a class="link" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></footer>
  </aside>
</template>
