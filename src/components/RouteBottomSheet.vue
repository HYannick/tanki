<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { DrawerContent, DrawerHandle, DrawerPortal, DrawerRoot, DrawerTitle } from 'reka-ui'
import { PhNavigationArrow, PhSignpost, PhX } from '@phosphor-icons/vue'
import RouteStopRecommendation from '@/components/RouteStopRecommendation.vue'
import RouteSummary from '@/components/RouteSummary.vue'
import RouteRangeControl from '@/components/RouteRangeControl.vue'
import type { CountryCode, FuelStation, SearchStatus } from '@/domain/fuel'
import type { FuelStopSuggestion, RoutePlan } from '@/domain/route'
import type { VehicleProfile } from '@/domain/vehicle'

const INITIAL_SNAP_POINT = 280
const STATION_SNAP_POINT = 0.48
const snapPoint = ref<string | number | null>(INITIAL_SNAP_POINT)
const ready = ref(false)
onMounted(async () => { await nextTick(); requestAnimationFrame(() => { ready.value = true }) })

const props = defineProps<{
  route: RoutePlan
  suggestedStops: FuelStopSuggestion[]
  stopCountry: CountryCode | null
  station: FuelStation | null
  stationCount: number
  stationState: SearchStatus
  stationMessage: string
  stationCoolingDown: boolean
  stationCooldownSeconds: number
  vehicle: VehicleProfile
}>()
const emit = defineEmits<{ clear: []; updateRangeKm: [value: number]; findFirstStopStation: []; navigate: [station: FuelStation] }>()

watch(() => props.station, (station) => { if (station) snapPoint.value = STATION_SNAP_POINT })
</script>

<template>
  <DrawerRoot :open="true" :modal="false" :dismissible="false" :snap-points="[INITIAL_SNAP_POINT, STATION_SNAP_POINT, 0.82]" :snap-point="snapPoint" :default-snap-point="INITIAL_SNAP_POINT" @update:snap-point="snapPoint = $event">
    <DrawerPortal>
      <DrawerContent class="route-bottom-sheet fixed inset-x-0 bottom-0 z-40 h-[82dvh] rounded-t-3xl bg-base-100 shadow-2xl outline-none" :class="{ 'is-ready': ready }" data-theme="light">
        <DrawerTitle class="sr-only">Résumé de l’itinéraire vers {{ route.destinationLabel }}</DrawerTitle>
        <DrawerHandle class="mx-auto mt-3 block h-1.5 w-12 rounded-full bg-base-content/20" />
        <button class="btn btn-circle btn-ghost btn-sm absolute right-4 top-2" aria-label="Fermer et effacer l’itinéraire" @click="emit('clear')"><PhX :size="20" weight="bold" /></button>
        <div class="h-[calc(82dvh-18px)] px-5 pb-24 pt-3 overscroll-contain" :class="snapPoint === INITIAL_SNAP_POINT ? 'overflow-hidden' : 'overflow-y-auto'">
          <div class="space-y-3">
            <RouteSummary :route="route" :suggested-stops="suggestedStops" :vehicle="vehicle" />
            <RouteRangeControl :vehicle="vehicle" @update="emit('updateRangeKm', $event)" />
            <RouteStopRecommendation v-if="suggestedStops.length" :show-action="false" :country="stopCountry" :station="station" :station-count="stationCount" :fuel-type="vehicle.fuelType" :state="stationState" :message="stationMessage" :cooling-down="stationCoolingDown" :cooldown-seconds="stationCooldownSeconds" />
          </div>
        </div>
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
  <div v-if="suggestedStops.length" class="fixed z-50 inset-x-0 bottom-0 border-t border-base-200 bg-base-100 px-5 py-3">
    <button v-if="station" class="btn btn-primary w-full" type="button" @click="emit('navigate', station)"><PhNavigationArrow :size="18" weight="fill" />Naviguer vers cette station</button>
    <button v-else class="btn btn-primary w-full" type="button" :disabled="stationState === 'loading' || stationCoolingDown" @click="emit('findFirstStopStation')"><span v-if="stationState === 'loading'" class="loading loading-spinner loading-sm" /><PhSignpost v-else :size="18" weight="fill" />{{ stationCoolingDown ? `Disponible dans ${stationCooldownSeconds}s` : 'Trouver une station' }}</button>
  </div>
</template>

<style scoped>
.route-bottom-sheet { transform: translate3d(0, 100%, 0); transition: transform 420ms cubic-bezier(0.32, 0.72, 0, 1); }
.route-bottom-sheet.is-ready { transform: translate3d(0, calc(var(--drawer-snap-point-offset, 0px) + var(--drawer-swipe-movement-y, 0px)), 0); }
.route-bottom-sheet[data-swiping] { transition: none; }

@media (prefers-reduced-motion: reduce) { .route-bottom-sheet { transition-duration: 1ms; } }
</style>
