<script setup lang="ts">
import { PhMapPin } from '@phosphor-icons/vue'
import StationTimestamp from '@/components/StationTimestamp.vue'
import type { FuelStation, FuelType } from '@/domain/fuel'
import { formatFuelPrice, formatStationAddress, getStationPriceTone } from '@/domain/station'

const props = defineProps<{ stations: FuelStation[]; fuelType: FuelType; selectedId?: string }>()
const emit = defineEmits<{ select: [station: FuelStation] }>()
function priceTone(station: FuelStation) {
  const tone = getStationPriceTone(station, props.stations, props.fuelType)
  return tone === 'green' ? 'text-success' : tone === 'yellow' ? 'text-warning' : 'text-error'
}
</script>

<template>
  <div class="min-h-0 flex-1 overflow-y-auto p-2">
    <button v-for="station in stations" :key="station.id" class="card mb-1 w-full rounded-box bg-transparent text-left shadow-none transition-colors hover:bg-success/10" :class="{ 'bg-success/10': selectedId === station.id }" @click="emit('select', station)">
      <span class="card-body gap-1.5 p-3">
        <span class="flex items-baseline justify-between gap-3"><strong class="truncate text-sm">{{ station.brand || station.name }}</strong><strong class="inline-flex shrink-0 items-center gap-1.5 text-sm" :class="priceTone(station)"><i class="size-2 rounded-full bg-current" aria-hidden="true" />{{ formatFuelPrice(station.prices[fuelType]) }}</strong></span>
        <span class="flex items-baseline justify-between text-xs text-base-content/60"><span>{{ station.distanceKm?.toFixed(1).replace('.', ',') ?? '—' }} km</span><span class="font-semibold" :class="station.isOpen ? 'text-success' : station.isOpen === false ? 'text-error' : ''">{{ station.isOpen === undefined ? 'Statut inconnu' : station.isOpen ? 'Ouvert' : 'Fermé' }}</span></span>
        <span class="flex items-center gap-1 truncate text-xs text-base-content/60"><PhMapPin :size="14" weight="fill" />{{ formatStationAddress(station) || 'Adresse indisponible' }}</span>
        <StationTimestamp :updated-at="station.updatedAt" :fetched-at="station.fetchedAt" compact />
      </span>
    </button>
  </div>
</template>
