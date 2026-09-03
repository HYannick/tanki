<script setup lang="ts">
import { computed } from 'vue'
import { PhGasPump } from '@phosphor-icons/vue'
import type { FuelStopSuggestion, RoutePlan } from '@/domain/route'
import { estimatedRangeKm, type VehicleProfile } from '@/domain/vehicle'

const props = defineProps<{ route: RoutePlan; suggestedStops: FuelStopSuggestion[]; vehicle: VehicleProfile; showDestination: boolean }>()
const rangeKm = computed(() => estimatedRangeKm(props.vehicle))
const duration = computed(() => { const minutes = Math.round(props.route.durationMinutes); const hours = Math.floor(minutes / 60); return hours ? `${hours} h ${minutes % 60} min` : `${minutes} min` })
</script>

<template>
  <section class="space-y-3"><p v-if="showDestination" class="text-xs font-semibold uppercase tracking-wide text-base-content/50">Vers {{ route.destinationLabel }}</p><div class="grid grid-cols-3 gap-2 text-center"><div class="rounded-box bg-base-200 p-2"><p class="text-[11px] text-base-content/60">Distance</p><p class="mt-1 font-bold tabular-nums">{{ route.distanceKm.toFixed(0) }} km</p></div><div class="rounded-box bg-base-200 p-2"><p class="text-[11px] text-base-content/60">Durée</p><p class="mt-1 font-bold tabular-nums">{{ duration }}</p></div><div class="rounded-box bg-base-200 p-2"><p class="text-[11px] text-base-content/60">Autonomie</p><p class="mt-1 font-bold tabular-nums">{{ Math.round(rangeKm) }} km</p></div></div><div v-if="suggestedStops.length" class="rounded-box bg-warning/15 p-3 text-sm text-warning-content"><div class="flex items-center gap-2 font-semibold"><PhGasPump :size="18" weight="fill" />Premier plein conseillé</div><p class="mt-1">Vers le km {{ Math.round(suggestedStops[0].distanceFromStartKm) }}, avec {{ Math.round(suggestedStops[0].safetyReserveKm) }} km de marge.</p><p v-if="suggestedStops.length > 1" class="mt-1">Puis {{ suggestedStops.length - 1 }} autre{{ suggestedStops.length > 2 ? 's' : '' }} arrêt{{ suggestedStops.length > 2 ? 's' : '' }} après remplissage.</p></div></section>
</template>
