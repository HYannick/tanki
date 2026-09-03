<script setup lang="ts">
import { PhArrowCounterClockwise } from '@phosphor-icons/vue'
import RouteDestinationForm from '@/components/RouteDestinationForm.vue'
import RouteStopRecommendation from '@/components/RouteStopRecommendation.vue'
import RouteSummary from '@/components/RouteSummary.vue'
import type { CountryCode, FuelStation, SearchStatus } from '@/domain/fuel'
import type { FuelStopSuggestion, RoutePlan, RouteState } from '@/domain/route'
import type { VehicleProfile } from '@/domain/vehicle'

defineProps<{
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
}>()

const emit = defineEmits<{
  'update:destinationQuery': [value: string]
  plan: []
  clear: []
  findFirstStopStation: []
  navigate: [station: FuelStation]
}>()
</script>

<template>
  <section class="flex w-full flex-1 flex-col overflow-y-auto rounded-box bg-base-100/95 shadow-xl backdrop-blur" aria-label="Planificateur d’itinéraire">
    <div class="border-b border-base-200 p-4">
      <RouteDestinationForm :destination-query="destinationQuery" :loading="state === 'loading'" @update:destination-query="emit('update:destinationQuery', $event)" @submit="emit('plan')" />
    </div>
    <div v-if="route" class="space-y-3 p-4">
      <RouteSummary :route="route" :suggested-stops="suggestedStops" :vehicle="vehicle" />
      <RouteStopRecommendation v-if="suggestedStops.length" :country="stopCountry" :station="firstStopStation" :station-count="routeStopStationCount" :fuel-type="vehicle.fuelType" :state="stationState" :message="stationMessage" :cooling-down="stationCoolingDown" :cooldown-seconds="stationCooldownSeconds" @search="emit('findFirstStopStation')" @navigate="emit('navigate', $event)" />
      <button type="button" class="btn btn-ghost btn-sm" @click="emit('clear')"><PhArrowCounterClockwise :size="16" />Effacer le trajet</button>
    </div>
    <p v-else class="m-4 rounded-box bg-base-200 p-3 text-sm text-base-content/65">{{ message }}</p>
  </section>
</template>
