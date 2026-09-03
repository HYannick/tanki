<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import DesktopResultsPanel from '@/components/DesktopResultsPanel.vue'
import FuelMap from '@/components/FuelMap.vue'
import MobileMapToolbar from '@/components/MobileMapToolbar.vue'
import PWAInstallPrompt from '@/components/PWAInstallPrompt.vue'
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt.vue'
import RouteBottomSheet from '@/components/RouteBottomSheet.vue'
import RouteDestinationForm from '@/components/RouteDestinationForm.vue'
import RoutePlannerPanel from '@/components/RoutePlannerPanel.vue'
import StationDetails from '@/components/StationDetails.vue'
import StationBottomSheet from '@/components/StationBottomSheet.vue'
import VehicleDrawer from '@/components/VehicleDrawer.vue'
import type {FuelStation} from '@/domain/fuel'
import type {VehicleProfile} from '@/domain/vehicle'
import {estimatedRangeKm, fullTankRangeKm} from '@/domain/vehicle'
import {suggestFuelStops} from '@/domain/route'
import {useFuelSearch} from '@/composables/useFuelSearch'
import {useVehicleProfile} from '@/composables/useVehicleProfile'
import {useDrawerHistory} from '@/composables/useDrawerHistory'
import {useRoutePlanner} from '@/composables/useRoutePlanner'
import {useRouteStopSearch} from '@/composables/useRouteStopSearch'
import {useMediaQuery} from '@/composables/useMediaQuery'
import {getCurrentPosition} from '@/services/geolocation'
import {MOBILE_MEDIA_QUERY} from '@/domain/layout'

const {
  country,
  position,
  selectedStation,
  fuelType,
  sort,
  filters,
  state,
  message,
  locationQuery,
  mapCenter,
  cooldownSeconds,
  germanyCoolingDown,
  mapMoved,
  filteredStations,
  sortedStations,
  locateAndLoad,
  searchForLocation,
  changeFuel,
  changeFilters,
  selectStation,
  searchThisArea,
  findStationsNear,
  syncCountryAt
} = useFuelSearch()
const {isOpen: vehicleDrawerOpen, open: openVehicleDrawer, close: closeVehicleDrawer} = useDrawerHistory('vehicle')
const {isOpen: stationSheetOpen, open: openStationSheet, close: closeStationSheet} = useDrawerHistory('station')
const {vehicle, updateVehicle} = useVehicleProfile()
const {
  destinationQuery,
  route,
  state: routeState,
  message: routeMessage,
  planRoute,
  setError: setRouteError,
  clearRoute
} = useRoutePlanner()
const {
  stations: firstStopStations,
  recommendedStation: firstStopStation,
  country: firstStopCountry,
  state: firstStopStationState,
  message: firstStopStationMessage,
  clear: clearFirstStopSearch,
  searchFirstStop
} = useRouteStopSearch(findStationsNear)
const suggestedStops = computed(() => suggestFuelStops(route.value, estimatedRangeKm(vehicle.value), fullTankRangeKm(vehicle.value), vehicle.value.safetyReserveKm))
const routeMode = ref(false)
const {matches: isMobileViewport} = useMediaQuery(MOBILE_MEDIA_QUERY)

if (vehicle.value.fuelType !== fuelType.value) changeFuel(vehicle.value.fuelType)

function saveVehicle(profile: VehicleProfile) {
  updateVehicle(profile);
  if (profile.fuelType !== fuelType.value) changeFuel(profile.fuelType)
}

function updateRemainingRangeKm(value: number) {
  if (!Number.isFinite(value)) return
  saveVehicle({...vehicle.value, remainingRangeKm: Math.min(fullTankRangeKm(vehicle.value), Math.max(0, value))})
}

function navigate(station: FuelStation) {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.location.latitude},${station.location.longitude}`, '_blank', 'noopener,noreferrer')
}

function handleStationSelection(station: FuelStation) {
  void selectStation(station);
  if (isMobileViewport.value) openStationSheet()
}

function closeStationDetails() {
  if (isMobileViewport.value) closeStationSheet(); else selectedStation.value = null
}

async function planTrip() {
  clearFirstStopSearch()
  try {
    const origin = position.value ?? await getCurrentPosition()
    position.value = origin
    await syncCountryAt(origin)
    await planRoute(origin)
  } catch (error) {
    setRouteError(error)
  }
}

async function locateOnStart() {
  try {
    const currentPosition = await getCurrentPosition()
    position.value = currentPosition
    await syncCountryAt(currentPosition)
  } catch {
    // Geolocation is optional at startup; the explicit location action stays available.
  }
}

function findStationForFirstStop() {
  return searchFirstStop(suggestedStops.value[0])
}

function clearTrip() {
  clearRoute();
  clearFirstStopSearch()
}

function toggleRouteMode() {
  routeMode.value = !routeMode.value
  if (!routeMode.value) clearTrip()
}

onMounted(() => {
  void locateOnStart()
})
watch(stationSheetOpen, (open) => {
  if (!open && isMobileViewport.value) selectedStation.value = null
})
watch(state, (nextState) => {
  if (nextState === 'ready' && !isMobileViewport.value) selectedStation.value = sortedStations.value[0] ?? null
})
watch(() => suggestedStops.value[0]?.distanceFromStartKm, clearFirstStopSearch)
</script>

<template>
  <main class="relative h-dvh min-h-137.5 overflow-hidden bg-base-200" data-theme="light">
    <FuelMap :position="position" :stations="filteredStations" :route-stop-stations="firstStopStations"
             :fuel-type="fuelType" :selected-station="selectedStation" :route="route" :suggested-stops="suggestedStops"
             @select="handleStationSelection" @map-moved="mapCenter = $event"/>
    <AppHeader :route-active="routeMode" @toggle-route="toggleRouteMode" @open-vehicle="openVehicleDrawer">
      <template #mobile-content>
      <MobileMapToolbar v-if="!routeMode" v-model:query="locationQuery" :loading="state === 'loading'"
                        :map-moved="mapMoved" :cooling-down="germanyCoolingDown" :cooldown-seconds="cooldownSeconds"
                        @search="searchForLocation" @locate="locateAndLoad" @search-area="searchThisArea"/>
      <div v-else class="p-3">
        <RouteDestinationForm v-model:destination-query="destinationQuery" :loading="routeState === 'loading'" @submit="planTrip" />
      </div>
      </template>
    </AppHeader>
    <div class="absolute bottom-4.5 left-4.5 top-18 hidden w-100 flex-col gap-5 sm:flex">
      <RoutePlannerPanel v-if="routeMode" v-model:destination-query="destinationQuery" :state="routeState"
                         :message="routeMessage" :route="route" :suggested-stops="suggestedStops"
                         :stop-country="firstStopCountry" :first-stop-station="firstStopStation"
                         :route-stop-station-count="firstStopStations.length" :station-state="firstStopStationState"
                         :station-message="firstStopStationMessage"
                         :station-cooling-down="firstStopCountry === 'de' && germanyCoolingDown"
                         :station-cooldown-seconds="cooldownSeconds" :vehicle="vehicle" @plan="planTrip"
                         @clear="clearTrip" @find-first-stop-station="findStationForFirstStop" @navigate="navigate"/>
      <DesktopResultsPanel v-else v-model:query="locationQuery" :loading="state === 'loading'" :message="message"
                           :error="state === 'error'" :stations="sortedStations" :fuel-type="fuelType"
                           :selected-id="selectedStation?.id" :country="country" :sort="sort" :filters="filters"
                           @search="searchForLocation" @locate="locateAndLoad" @select="handleStationSelection"
                           @filters-change="changeFilters" @sort-change="sort = $event"/>
    </div>
    <RouteBottomSheet v-if="routeMode && route && isMobileViewport" :route="route" :suggested-stops="suggestedStops"
                      :stop-country="firstStopCountry" :station="firstStopStation"
                      :station-count="firstStopStations.length" :station-state="firstStopStationState"
                      :station-message="firstStopStationMessage"
                      :station-cooling-down="firstStopCountry === 'de' && germanyCoolingDown"
                      :station-cooldown-seconds="cooldownSeconds" :vehicle="vehicle"
                      @update-range-km="updateRemainingRangeKm" @clear="clearTrip"
                      @find-first-stop-station="findStationForFirstStop" @navigate="navigate"/>
    <div v-if="state === 'error'" role="alert"
         class="alert alert-error absolute left-1/2 top-41 z-20 flex w-[min(90vw,360px)] -translate-x-1/2 text-xs shadow-lg sm:hidden">
      <span>{{ message }}</span></div>
    <StationDetails v-if="selectedStation && !isMobileViewport" :station="selectedStation" :fuel-type="fuelType"
                    :vehicle="vehicle" @close="closeStationDetails" @navigate="navigate"/>
    <StationBottomSheet v-if="selectedStation && stationSheetOpen && isMobileViewport" :open="stationSheetOpen"
                        :station="selectedStation" :fuel-type="fuelType" :vehicle="vehicle" @close="closeStationDetails"
                        @navigate="navigate"/>
    <VehicleDrawer :open="vehicleDrawerOpen" :profile="vehicle" :country="country" :filters="filters"
                   @close="closeVehicleDrawer" @update:profile="saveVehicle" @filters-change="changeFilters"/>
    <PWAInstallPrompt/>
    <PWAUpdatePrompt/>
  </main>
</template>
