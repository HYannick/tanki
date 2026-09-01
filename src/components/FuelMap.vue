<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, watch} from 'vue'
import maplibregl, {type Marker} from 'maplibre-gl'
import type {FuelStation, FuelType} from '@/domain/fuel'
import type { Coordinates } from '@/domain/geo'

const props = defineProps<{
  position: Coordinates | null;
  stations: FuelStation[];
  fuelType: FuelType;
  selectedStation: FuelStation | null
}>()
const emit = defineEmits<{ select: [station: FuelStation]; mapMoved: [center: Coordinates] }>()
const container = ref<HTMLElement>()
let map: maplibregl.Map | undefined
let userMarker: Marker | undefined
let stationMarkers: Marker[] = []

const price = (station: FuelStation) => {
  const value = station.prices[props.fuelType]
  return value === undefined ? '—' : `${value.toFixed(2)} €`
}
const priceTone = (station: FuelStation) => {
  const prices = props.stations.map((item) => item.prices[props.fuelType]).filter((value): value is number => value !== undefined)
  const value = station.prices[props.fuelType]
  const min = Math.min(...prices), max = Math.max(...prices)
  if (value === undefined || !Number.isFinite(min) || max === min) return 'green'
  const relativePosition = (value - min) / (max - min)
  if (relativePosition <= 1 / 3) return 'green'
  if (relativePosition <= 2 / 3) return 'yellow'
  return 'red'
}
const clearMarkers = () => {
  stationMarkers.forEach((marker) => marker.remove());
  stationMarkers = []
}

function renderStations() {
  if (!map) return
  clearMarkers()
  stationMarkers = props.stations.map((station) => {
    const element = document.createElement('button')
    element.className = `price-marker price-marker--${priceTone(station)}${props.selectedStation?.id === station.id ? ' is-selected' : ''}`
    element.type = 'button';
    element.textContent = price(station);
    element.title = station.name
    element.addEventListener('click', () => emit('select', station))
    return new maplibregl.Marker({
      element,
      anchor: 'bottom'
    }).setLngLat([station.location.longitude, station.location.latitude]).addTo(map!)
  })
}

function updatePosition(position: Coordinates | null) {
  if (!map || !position) return
  const lngLat: [number, number] = [position.longitude, position.latitude]
  if (!userMarker) {
    const element = document.createElement('div');
    element.className = 'user-marker'
    userMarker = new maplibregl.Marker({element}).setLngLat(lngLat).addTo(map)
  } else userMarker.setLngLat(lngLat)
  map.flyTo({center: lngLat, zoom: 13, essential: true})
}

onMounted(() => {
  if (!container.value) return
  map = new maplibregl.Map({
    container: container.value,
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [10.4515, 51.1657],
    zoom: 5
  })
  map.addControl(new maplibregl.NavigationControl({showCompass: false}), 'bottom-right')
  map.on('load', () => {
    updatePosition(props.position);
    renderStations()
  })
  map.on('moveend', () => {
    const center = map?.getCenter()
    if (center) emit('mapMoved', {latitude: center.lat, longitude: center.lng})
  })
})
watch(() => props.position, updatePosition)
watch(() => [props.stations, props.fuelType, props.selectedStation], renderStations, {deep: true})
watch(() => props.selectedStation, (station) => {
  if (map && station) map.flyTo({
    center: [station.location.longitude, station.location.latitude],
    zoom: 15,
    essential: true
  })
})
onBeforeUnmount(() => map?.remove())
</script>

<template>
  <div ref="container" class="absolute inset-0 h-full bg-success/10" aria-label="Carte des stations-service"/>
</template>
