<script setup lang="ts">
import { computed } from 'vue'
import { PhArrowCounterClockwise, PhGasPump, PhMapPin, PhNavigationArrow, PhRoadHorizon, PhSignpost, PhNavigationArrow as PhNavigate } from '@phosphor-icons/vue'
import type { CountryCode, FuelStation, SearchStatus } from '@/domain/fuel'
import type { FuelStopSuggestion, RoutePlan, RouteState } from '@/domain/route'
import { estimatedRangeKm, type VehicleProfile } from '@/domain/vehicle'

const props = withDefaults(defineProps<{
  mode?: 'desktop' | 'mobile'
  destinationQuery: string
  state: RouteState
  message: string
  route: RoutePlan | null
  suggestedStops: FuelStopSuggestion[]
  country: CountryCode
  firstStopStation: FuelStation | null
  routeStopStationCount: number
  stationState: SearchStatus
  stationMessage: string
  stationCoolingDown: boolean
  stationCooldownSeconds: number
  vehicle: VehicleProfile
}>(), { mode: 'desktop' })
const emit = defineEmits<{ 'update:destinationQuery': [value: string]; plan: []; clear: []; findFirstStopStation: []; navigate: [station: FuelStation] }>()

const rangeKm = computed(() => estimatedRangeKm(props.vehicle))
const duration = computed(() => {
  if (!props.route) return ''
  const minutes = Math.round(props.route.durationMinutes)
  const hours = Math.floor(minutes / 60)
  return hours ? `${hours} h ${minutes % 60} min` : `${minutes} min`
})
const firstStopStationAddress = computed(() => {
  const address = props.firstStopStation?.address
  return [address?.street && `${address.street}${address.houseNumber ? ` ${address.houseNumber}` : ''}`, [address?.postcode, address?.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
})
</script>

<template>
  <section :class="mode === 'desktop' ? 'flex w-full flex-1 flex-col overflow-y-auto rounded-box bg-base-100/95 shadow-xl backdrop-blur' : 'w-full rounded-box bg-base-100/95 p-3 shadow-lg backdrop-blur'" aria-label="Planificateur d’itinéraire">
    <div v-if="mode === 'desktop'" class="border-b border-base-200 px-5 py-3"><p class="text-xs font-bold uppercase tracking-wider text-base-content/50">Mode itinéraire</p><p class="mt-0.5 text-xs text-base-content/65">Préparez vos arrêts sans requête de prix supplémentaire.</p></div>
    <form :class="mode === 'desktop' ? 'space-y-3 border-b border-base-200 p-4' : 'space-y-2'" @submit.prevent="$emit('plan')">
      <div class="flex items-center gap-3 rounded-box bg-base-200 px-3 py-2.5 text-sm"><PhNavigationArrow class="text-primary" :size="18" weight="fill" /><span><strong>Départ</strong><span class="ml-2 text-base-content/60">Position affichée sur la carte</span></span></div>
      <label class="sr-only" for="route-destination">Destination</label>
      <div class="join w-full">
        <span class="join-item grid place-items-center bg-base-200 px-3 text-primary"><PhMapPin :size="20" weight="fill" /></span>
        <input id="route-destination" class="input input-bordered join-item w-full" :value="destinationQuery" placeholder="Destination" autocomplete="street-address" @input="emit('update:destinationQuery', ($event.target as HTMLInputElement).value)">
        <button class="btn btn-primary join-item" :disabled="state === 'loading'" aria-label="Calculer l’itinéraire"><span v-if="state === 'loading'" class="loading loading-spinner loading-sm" /><PhRoadHorizon v-else :size="20" weight="fill" /></button>
      </div>
    </form>

    <div v-if="route" :class="mode === 'desktop' ? 'space-y-3 p-4' : 'mt-3 border-t border-base-200 pt-3'">
      <p v-if="mode === 'desktop'" class="text-xs font-semibold uppercase tracking-wide text-base-content/50">Vers {{ route.destinationLabel }}</p>
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="rounded-box bg-base-200 p-2"><p class="text-[11px] text-base-content/60">Distance</p><p class="mt-1 font-bold tabular-nums">{{ route.distanceKm.toFixed(0) }} km</p></div>
        <div class="rounded-box bg-base-200 p-2"><p class="text-[11px] text-base-content/60">Durée</p><p class="mt-1 font-bold tabular-nums">{{ duration }}</p></div>
        <div class="rounded-box bg-base-200 p-2"><p class="text-[11px] text-base-content/60">Autonomie</p><p class="mt-1 font-bold tabular-nums">{{ Math.round(rangeKm) }} km</p></div>
      </div>
      <div v-if="suggestedStops.length" class="rounded-box bg-warning/15 p-3 text-sm text-warning-content">
        <div class="flex items-center gap-2 font-semibold"><PhGasPump :size="18" weight="fill" />Premier plein conseillé</div>
        <p class="mt-1">Vers le km {{ Math.round(suggestedStops[0].distanceFromStartKm) }}, avec {{ Math.round(suggestedStops[0].safetyReserveKm) }} km de marge.</p>
        <p v-if="suggestedStops.length > 1" class="mt-1">Puis {{ suggestedStops.length - 1 }} autre{{ suggestedStops.length > 2 ? 's' : '' }} arrêt{{ suggestedStops.length > 2 ? 's' : '' }} après remplissage.</p>
      </div>
      <div v-if="country === 'de' && suggestedStops.length" class="rounded-box border border-base-200 bg-base-100 p-3 text-sm">
        <template v-if="firstStopStation">
          <p class="text-xs font-semibold uppercase tracking-wide text-base-content/50">Station la moins chère près de l’arrêt</p>
          <p class="mt-1 font-bold">{{ firstStopStation.brand || firstStopStation.name }}</p>
          <p class="mt-0.5 text-base-content/65">{{ firstStopStationAddress || 'Adresse indisponible' }}</p>
          <p class="mt-1 text-xs text-base-content/55">{{ routeStopStationCount }} station{{ routeStopStationCount > 1 ? 's' : '' }} affichée{{ routeStopStationCount > 1 ? 's' : '' }} sur la carte : choisissez celle qui vous convient.</p>
          <div class="mt-3 flex items-center justify-between gap-2"><strong class="text-base">{{ firstStopStation.prices[vehicle.fuelType]?.toFixed(3) }} € / L</strong><button class="btn btn-primary btn-sm" type="button" @click="emit('navigate', firstStopStation)"><PhNavigate :size="16" weight="fill" />Y aller</button></div>
        </template>
        <template v-else>
          <p class="font-semibold">Trouver le meilleur arrêt</p>
          <p class="mt-1 text-xs text-base-content/60">Recherche manuelle autour du premier repère, dans un rayon de 15 km.</p>
          <button class="btn btn-outline btn-sm mt-3 w-full" type="button" :disabled="stationState === 'loading' || stationCoolingDown" @click="emit('findFirstStopStation')"><span v-if="stationState === 'loading'" class="loading loading-spinner loading-xs" /><PhSignpost v-else :size="16" weight="fill" />{{ stationCoolingDown ? `Disponible dans ${stationCooldownSeconds}s` : 'Trouver la station la moins chère' }}</button>
          <p v-if="stationMessage" class="mt-2 text-xs" :class="stationState === 'error' ? 'text-error' : 'text-base-content/60'">{{ stationMessage }}</p>
        </template>
      </div>
      <button v-if="mode === 'desktop'" type="button" class="btn btn-ghost btn-sm" @click="$emit('clear')"><PhArrowCounterClockwise :size="16" />Effacer le trajet</button>
    </div>
    <p v-else :class="mode === 'desktop' ? 'm-4 rounded-box bg-base-200 p-3 text-sm text-base-content/65' : 'mt-2 rounded-box bg-base-200 p-2 text-xs text-base-content/65'">{{ message }}</p>
  </section>
</template>
