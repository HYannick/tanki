<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, watch} from 'vue'
import maplibregl, {type Marker} from 'maplibre-gl'
import type {FuelStation, FuelType} from '@/domain/fuel'
import type { Coordinates } from '@/domain/geo'
import type { FuelStopSuggestion, RoutePlan } from '@/domain/route'

const ROUTE_SOURCE_ID = 'itinerary-route'
const ROUTE_LAYER_ID = 'itinerary-route-line'

const props = defineProps<{
  position: Coordinates | null;
  stations: FuelStation[];
  routeStopStations: FuelStation[];
  fuelType: FuelType;
  selectedStation: FuelStation | null;
  route: RoutePlan | null;
  suggestedStops: FuelStopSuggestion[]
}>()
const emit = defineEmits<{ select: [station: FuelStation]; mapMoved: [center: Coordinates] }>()
const container = ref<HTMLElement>()
let map: maplibregl.Map | undefined
let userMarker: Marker | undefined
let stationMarkers: Marker[] = []
let suggestedStopMarkers: Marker[] = []
let routeStopStationMarkers: Marker[] = []
let mapLoaded = false

const price = (station: FuelStation) => {
  const value = station.prices[props.fuelType]
  return value === undefined ? '—' : `${value.toFixed(2)} €`
}
const priceTone = (station: FuelStation) => {
  return priceToneAmong(station, props.stations)
}
const priceToneAmong = (station: FuelStation, stations: FuelStation[]) => {
  const prices = stations.map((item) => item.prices[props.fuelType]).filter((value): value is number => value !== undefined)
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

function renderRoute() {
  if (!map || !mapLoaded) return
  const route = props.route
  if (!route || route.geometry.length < 2) {
    if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID)
    if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID)
    return
  }

  const data = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: route.geometry.map(({ longitude, latitude }) => [longitude, latitude]),
    },
  }
  const source = map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined
  if (source) source.setData(data)
  else {
    map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data })
    map.addLayer({
      id: ROUTE_LAYER_ID,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#17213f', 'line-width': 5, 'line-opacity': 0.88 },
    })
  }

  const [first, ...rest] = route.geometry
  const bounds = rest.reduce(
    (value, point) => value.extend([point.longitude, point.latitude]),
    new maplibregl.LngLatBounds([first.longitude, first.latitude], [first.longitude, first.latitude]),
  )
  map.fitBounds(bounds, { padding: 72, maxZoom: 14, duration: 800, essential: true })
}

function renderSuggestedStop() {
  if (!map || !mapLoaded) return
  suggestedStopMarkers.forEach((marker) => marker.remove())
  suggestedStopMarkers = props.suggestedStops.map((suggestedStop) => {
    const element = document.createElement('div')
    element.className = 'suggested-stop-marker'
    element.textContent = `Plein ${suggestedStop.index}`
    return new maplibregl.Marker({ element, anchor: 'bottom' })
      .setLngLat([suggestedStop.location.longitude, suggestedStop.location.latitude])
      .addTo(map!)
  })
}

function renderRouteStopStations() {
  if (!map || !mapLoaded) return
  routeStopStationMarkers.forEach((marker) => marker.remove())
  routeStopStationMarkers = props.routeStopStations.map((station, index) => {
    const element = document.createElement('button')
    element.className = `price-marker route-price-marker price-marker--${priceToneAmong(station, props.routeStopStations)}${index === 0 ? ' is-best' : ''}`
    element.type = 'button'
    element.textContent = price(station)
    element.title = `${station.name} · ${station.address?.street ?? ''}`
    element.addEventListener('click', () => emit('select', station))
    return new maplibregl.Marker({ element, anchor: 'bottom' })
      .setLngLat([station.location.longitude, station.location.latitude])
      .addTo(map!)
  })
  if (!props.routeStopStations.length) return
  const [first, ...rest] = props.routeStopStations
  const bounds = rest.reduce(
    (value, station) => value.extend([station.location.longitude, station.location.latitude]),
    new maplibregl.LngLatBounds([first.location.longitude, first.location.latitude], [first.location.longitude, first.location.latitude]),
  )
  map.fitBounds(bounds, { padding: 72, maxZoom: 13, duration: 650, essential: true })
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
    mapLoaded = true
    updatePosition(props.position);
    renderStations()
    renderRoute()
    renderSuggestedStop()
    renderRouteStopStations()
  })
  map.on('moveend', () => {
    const center = map?.getCenter()
    if (center) emit('mapMoved', {latitude: center.lat, longitude: center.lng})
  })
})
watch(() => props.position, updatePosition)
watch(() => [props.stations, props.fuelType, props.selectedStation], renderStations, {deep: true})
watch(() => props.route, renderRoute, { deep: true })
watch(() => props.suggestedStops, renderSuggestedStop, { deep: true })
watch(() => props.routeStopStations, renderRouteStopStations, { deep: true })
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
