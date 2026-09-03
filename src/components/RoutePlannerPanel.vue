<script setup lang="ts">
import { PhArrowCounterClockwise } from '@phosphor-icons/vue'
import RouteDestinationForm from '@/components/RouteDestinationForm.vue'
import RouteStopRecommendation from '@/components/RouteStopRecommendation.vue'
import RouteSummary from '@/components/RouteSummary.vue'
import type { CountryCode, FuelStation, SearchStatus } from '@/domain/fuel'
import type { FuelStopSuggestion, RoutePlan, RouteState } from '@/domain/route'
import type { VehicleProfile } from '@/domain/vehicle'

withDefaults(defineProps<{
  mode?: 'desktop' | 'mobile'
  destinationQuery: string
  state: RouteState
  message: string
  route: RoutePlan | null
  suggestedStops: FuelStopSuggestion[]
  stopCountry: CountryCode | null
  firstStopStation: FuelStation | null
  routeStopStationCount: number
  stationState: SearchStatus
  stationMessage: string
  stationCoolingDown: boolean
  stationCooldownSeconds: number
  vehicle: VehicleProfile
  showRouteDetails?: boolean
}>(), { mode: 'desktop', showRouteDetails: true })

const emit = defineEmits<{
  'update:destinationQuery': [value: string]
  plan: []
  clear: []
  findFirstStopStation: []
  navigate: [station: FuelStation]
}>()
</script>

<template>
  <section :class="mode === 'desktop' ? 'flex w-full flex-1 flex-col overflow-y-auto rounded-box bg-base-100/95 shadow-xl backdrop-blur' : 'w-full rounded-box bg-base-100/95 p-3 shadow-lg backdrop-blur'" aria-label="Planificateur d’itinéraire">
    <div v-if="mode === 'desktop'" class="border-b border-base-200 px-5 py-3">
      <p class="text-xs font-bold uppercase tracking-wider text-base-content/50">Mode itinéraire</p>
      <p class="mt-0.5 text-xs text-base-content/65">Préparez vos arrêts sans requête de prix supplémentaire.</p>
    </div>
    <div :class="mode === 'desktop' ? 'border-b border-base-200 p-4' : ''">
      <RouteDestinationForm :destination-query="destinationQuery" :loading="state === 'loading'" @update:destination-query="emit('update:destinationQuery', $event)" @submit="emit('plan')" />
    </div>
    <div v-if="route && showRouteDetails" :class="mode === 'desktop' ? 'space-y-3 p-4' : 'mt-3 space-y-3 border-t border-base-200 pt-3'">
      <RouteSummary :route="route" :suggested-stops="suggestedStops" :vehicle="vehicle" :show-destination="mode === 'desktop'" />
      <RouteStopRecommendation v-if="suggestedStops.length" :country="stopCountry" :station="firstStopStation" :station-count="routeStopStationCount" :fuel-type="vehicle.fuelType" :state="stationState" :message="stationMessage" :cooling-down="stationCoolingDown" :cooldown-seconds="stationCooldownSeconds" @search="emit('findFirstStopStation')" @navigate="emit('navigate', $event)" />
      <button v-if="mode === 'desktop'" type="button" class="btn btn-ghost btn-sm" @click="emit('clear')"><PhArrowCounterClockwise :size="16" />Effacer le trajet</button>
    </div>
    <p v-else-if="!route" :class="mode === 'desktop' ? 'm-4 rounded-box bg-base-200 p-3 text-sm text-base-content/65' : 'mt-2 rounded-box bg-base-200 p-2 text-xs text-base-content/65'">{{ message }}</p>
  </section>
</template>
