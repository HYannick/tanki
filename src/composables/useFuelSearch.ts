import { computed, onBeforeUnmount, ref } from 'vue'
import { distanceBetweenCoordinatesKm, type Coordinates } from '@/domain/geo'
import type { CountryCode, FuelStation, FuelType, ProviderRegistry, SearchStatus, SortOption, StationFilters } from '@/domain/fuel'
import { GermanyFuelProvider } from '@/providers/GermanyFuelProvider'
import { FranceFuelProvider } from '@/providers/FranceFuelProvider'
import { detectCountryAt, findLocation } from '@/services/geocoding'
import { getCurrentPosition } from '@/services/geolocation'

const RADIUS_KM = 10
const ROUTE_STOP_RADIUS_KM = 15
const MAP_SEARCH_THRESHOLD_KM = 0.5

export function useFuelSearch() {
  const germanyProvider = new GermanyFuelProvider()
  const providers: ProviderRegistry = { de: germanyProvider, fr: new FranceFuelProvider() }
  const country = ref<CountryCode>('fr')
  const position = ref<Coordinates | null>(null)
  const stations = ref<FuelStation[]>([])
  const selectedStation = ref<FuelStation | null>(null)
  const fuelType = ref<FuelType>('diesel')
  const sort = ref<SortOption>('price')
  const filters = ref<StationFilters>({ openNow: false, automatedPayment: false })
  const state = ref<SearchStatus>('idle')
  const message = ref('Autorisez votre position pour voir les prix autour de vous.')
  const locationQuery = ref('')
  const mapCenter = ref<Coordinates | null>(null)
  const cooldownSeconds = ref(0)
  let cooldownTimer: number | undefined
  const germanyCoolingDown = computed(() => country.value === 'de' && cooldownSeconds.value > 0)
  const mapMoved = computed(() => Boolean(position.value && mapCenter.value) && distanceBetweenCoordinatesKm(position.value!, mapCenter.value!) >= MAP_SEARCH_THRESHOLD_KM)
  const filteredStations = computed(() => stations.value.filter((station) => (!filters.value.openNow || station.isOpen === true) && (!filters.value.automatedPayment || station.hasAutomatedPayment === true)))
  const sortedStations = computed(() => [...filteredStations.value].sort((a, b) => sort.value === 'distance' ? (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) : (a.prices[fuelType.value] ?? Infinity) - (b.prices[fuelType.value] ?? Infinity)))

  async function locateAndLoad() {
    state.value = 'loading'; message.value = 'Localisation et recherche des stations…'
    try { position.value = await getCurrentPosition(); applyDetectedCountry(await detectCountryAt(position.value)); await loadStations() }
    catch (error) { state.value = 'error'; message.value = error instanceof Error ? error.message : 'Une erreur est survenue.' }
  }
  async function loadStations() {
    if (!position.value) return locateAndLoad()
    state.value = 'loading'; message.value = 'Mise à jour des prix…'
    try {
      stations.value = await providers[country.value].searchStations({ ...position.value, radiusKm: RADIUS_KM, fuelType: fuelType.value })
      selectedStation.value = window.matchMedia('(max-width: 680px)').matches ? null : stations.value[0] ?? null
      state.value = 'ready'; message.value = stations.value.length ? `${stations.value.length} stations dans un rayon de ${RADIUS_KM} km.` : 'Aucune station trouvée dans ce rayon.'
      if (country.value === 'de') refreshGermanyCooldown()
    } catch (error) {
      if (country.value === 'de') refreshGermanyCooldown()
      state.value = 'error'; message.value = error instanceof Error ? error.message : 'Impossible de récupérer les prix.'
    }
  }
  function refreshGermanyCooldown() {
    window.clearInterval(cooldownTimer)
    const update = () => { cooldownSeconds.value = Math.ceil(germanyProvider.getCooldownRemainingMs() / 1000); if (!cooldownSeconds.value) window.clearInterval(cooldownTimer) }
    update(); if (cooldownSeconds.value) cooldownTimer = window.setInterval(update, 250)
  }
  async function searchForLocation() {
    state.value = 'loading'; message.value = 'Recherche du lieu…'
    try { const location = await findLocation(locationQuery.value); position.value = location; applyDetectedCountry(location.country); await loadStations() }
    catch (error) { state.value = 'error'; message.value = error instanceof Error ? error.message : 'La recherche du lieu a échoué.' }
  }
  function changeFuel(fuel: FuelType) { fuelType.value = fuel; if (position.value) loadStations() }
  function changeFilters(nextFilters: StationFilters) { filters.value = nextFilters }
  async function selectStation(station: FuelStation) {
    selectedStation.value = station
    const provider = providers[country.value]
    if (!provider.getStationDetails) return
    try {
      console.log('search details')
      const details = await provider.getStationDetails(station.id)
      console.log(details)
      if (selectedStation.value?.id !== station.id) return
      selectedStation.value = {
        ...station, ...details,
        location: details.location ?? station.location,
        address: { ...station.address, ...details.address },
        prices: { ...station.prices, ...details.prices },
      }
    } catch {
      // The basic list data remains usable if an optional detail request fails.
    }
  }
  async function searchThisArea() {
    if (!mapCenter.value) return
    position.value = { ...mapCenter.value }; stations.value = []; selectedStation.value = null; message.value = 'Recherche dans cette zone…'; applyDetectedCountry(await detectCountryAt(position.value)); loadStations()
  }
  async function findStationsNear(location: Coordinates): Promise<FuelStation[]> {
    try {
      const nearby = await germanyProvider.searchStations({ ...location, radiusKm: ROUTE_STOP_RADIUS_KM, fuelType: fuelType.value })
      const stationsWithPrice = nearby
        .filter((item) => item.prices[fuelType.value] !== undefined)
        .sort((a, b) => (a.prices[fuelType.value]! - b.prices[fuelType.value]!) || (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
      if (!stationsWithPrice.length) throw new Error('Aucune station avec un prix disponible n’a été trouvée autour de cet arrêt.')
      return stationsWithPrice
    } finally { refreshGermanyCooldown() }
  }
  function applyDetectedCountry(detectedCountry: CountryCode | undefined) {
    if (!detectedCountry || detectedCountry === country.value) return
    if (detectedCountry === 'de') filters.value = { ...filters.value, automatedPayment: false }
    country.value = detectedCountry; stations.value = []; selectedStation.value = null
  }
  async function syncCountryAt(location: Coordinates) {
    applyDetectedCountry(await detectCountryAt(location))
  }
  function changeCountry(nextCountry: CountryCode) {
    if (country.value === nextCountry) return
    if (nextCountry === 'de') filters.value = { ...filters.value, automatedPayment: false }
    country.value = nextCountry; stations.value = []; selectedStation.value = null
    message.value = nextCountry === 'fr' ? 'France sélectionnée. Localisez-vous pour charger le flux officiel.' : 'Allemagne sélectionnée. Ajoutez votre clé Tankerkönig puis localisez-vous.'
    if (position.value) loadStations()
  }
  onBeforeUnmount(() => window.clearInterval(cooldownTimer))

  return { country, position, stations, selectedStation, fuelType, sort, filters, state, message, locationQuery, mapCenter, cooldownSeconds, germanyCoolingDown, mapMoved, filteredStations, sortedStations, locateAndLoad, loadStations, searchForLocation, changeFuel, changeFilters, selectStation, searchThisArea, findStationsNear, syncCountryAt, changeCountry }
}
