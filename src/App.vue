<script setup lang="ts">
import { watch } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import DesktopResultsPanel from '@/components/DesktopResultsPanel.vue'
import FuelControls from '@/components/FuelControls.vue'
import FuelMap from '@/components/FuelMap.vue'
import MobileMapToolbar from '@/components/MobileMapToolbar.vue'
import PWAInstallPrompt from '@/components/PWAInstallPrompt.vue'
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt.vue'
import StationDetails from '@/components/StationDetails.vue'
import StationBottomSheet from '@/components/StationBottomSheet.vue'
import VehicleDrawer from '@/components/VehicleDrawer.vue'
import type { FuelStation } from '@/domain/fuel'
import type { VehicleProfile } from '@/domain/vehicle'
import { useFuelSearch } from '@/composables/useFuelSearch'
import { useVehicleProfile } from '@/composables/useVehicleProfile'
import { useDrawerHistory } from '@/composables/useDrawerHistory'

const { country, position, stations, selectedStation, fuelType, sort, filters, state, message, locationQuery, mapCenter, cooldownSeconds, germanyCoolingDown, mapMoved, filteredStations, sortedStations, locateAndLoad, loadStations, searchForLocation, changeFuel, changeFilters, selectStation, searchThisArea, changeCountry } = useFuelSearch()
const { isOpen: vehicleDrawerOpen, open: openVehicleDrawer, close: closeVehicleDrawer } = useDrawerHistory('vehicle')
const { isOpen: stationSheetOpen, open: openStationSheet, close: closeStationSheet } = useDrawerHistory('station')
const { vehicle, updateVehicle } = useVehicleProfile()
if (vehicle.value.fuelType !== fuelType.value) changeFuel(vehicle.value.fuelType)
function saveVehicle(profile: VehicleProfile) { updateVehicle(profile); if (profile.fuelType !== fuelType.value) changeFuel(profile.fuelType) }
function navigate(station: FuelStation) { window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.location.latitude},${station.location.longitude}`, '_blank', 'noopener,noreferrer') }
function isMobile() { return window.matchMedia('(max-width: 680px)').matches }
function handleStationSelection(station: FuelStation) { void selectStation(station); if (isMobile()) openStationSheet() }
function closeStationDetails() { if (isMobile()) closeStationSheet(); else selectedStation.value = null }
watch(stationSheetOpen, (open) => { if (!open && isMobile()) selectedStation.value = null })
</script>

<template>
  <main class="relative h-dvh min-h-137.5 overflow-hidden bg-base-200" data-theme="light">
    <FuelMap :position="position" :stations="filteredStations" :fuel-type="fuelType" :selected-station="selectedStation" @select="handleStationSelection" @map-moved="mapCenter = $event" />
    <AppHeader @open-vehicle="openVehicleDrawer" />
    <div class="absolute bottom-4.5 left-4.5 top-18 flex w-100 flex-col gap-5 max-[680px]:hidden">
      <FuelControls mode="desktop" :country="country" :sort="sort" :filters="filters" :loading="state === 'loading'" :cooling-down="germanyCoolingDown" @country-change="changeCountry" @filters-change="changeFilters" @sort-change="sort = $event" @refresh="loadStations" />
      <DesktopResultsPanel v-model:query="locationQuery" :loading="state === 'loading'" :message="message" :error="state === 'error'" :stations="sortedStations" :fuel-type="fuelType" :selected-id="selectedStation?.id" :country="country" @search="searchForLocation" @locate="locateAndLoad" @select="handleStationSelection" />
    </div>
    <MobileMapToolbar v-model:query="locationQuery" :loading="state === 'loading'" :sort="sort" :map-moved="mapMoved" :cooling-down="germanyCoolingDown" :cooldown-seconds="cooldownSeconds" @search="searchForLocation" @locate="locateAndLoad" @search-area="searchThisArea" />
    <div v-if="state === 'error'" role="alert" class="alert alert-error absolute left-1/2 top-[164px] z-20 hidden w-[min(90vw,360px)] -translate-x-1/2 text-xs shadow-lg max-[680px]:flex"><span>{{ message }}</span></div>
    <StationDetails v-if="selectedStation" :station="selectedStation" :fuel-type="fuelType" :vehicle="vehicle" @close="closeStationDetails" @navigate="navigate" />
    <StationBottomSheet v-if="selectedStation && stationSheetOpen" :open="stationSheetOpen" :station="selectedStation" :fuel-type="fuelType" :vehicle="vehicle" @close="closeStationDetails" @navigate="navigate" />
    <VehicleDrawer :open="vehicleDrawerOpen" :profile="vehicle" :country="country" :filters="filters" @close="closeVehicleDrawer" @update:profile="saveVehicle" @country-change="changeCountry" @filters-change="changeFilters" />
    <PWAInstallPrompt />
    <PWAUpdatePrompt />
  </main>
</template>
