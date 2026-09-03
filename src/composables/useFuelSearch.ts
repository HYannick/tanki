import { computed, ref } from 'vue'
import { distanceBetweenCoordinatesKm, type Coordinates } from '@/domain/geo'
import type { CountryCode, FuelStation, FuelType, ProviderRegistry, SearchStatus, SortOption, StationFilters } from '@/domain/fuel'
import { GermanyFuelProvider } from '@/providers/GermanyFuelProvider'
import { FranceFuelProvider } from '@/providers/FranceFuelProvider'
import { detectCountryAt, findLocation } from '@/services/geocoding'
import { getCurrentPosition } from '@/services/geolocation'
import { MOBILE_MEDIA_QUERY } from '@/domain/layout'
import { useGermanyCooldown } from '@/composables/useGermanyCooldown'
import { useStationResults } from '@/composables/useStationResults'
import { useStationDetails } from '@/composables/useStationDetails'

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
  const { selectStation } = useStationDetails(providers, country, selectedStation)
  const fuelType = ref<FuelType>('diesel')
  const sort = ref<SortOption>('price')
  const filters = ref<StationFilters>({ openNow: false, automatedPayment: false })
  const state = ref<SearchStatus>('idle')
  const message = ref('Autorisez votre position pour voir les prix autour de vous.')
  const locationQuery = ref('')
  const mapCenter = ref<Coordinates | null>(null)
  const { cooldownSeconds, refresh: refreshGermanyCooldown } = useGermanyCooldown(germanyProvider)
  const germanyCoolingDown = computed(() => country.value === 'de' && cooldownSeconds.value > 0)
  const mapMoved = computed(() => Boolean(position.value && mapCenter.value) && distanceBetweenCoordinatesKm(position.value!, mapCenter.value!) >= MAP_SEARCH_THRESHOLD_KM)
  const { filteredStations, sortedStations } = useStationResults(stations, fuelType, filters, sort)

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
      selectedStation.value = window.matchMedia(MOBILE_MEDIA_QUERY).matches ? null : stations.value[0] ?? null
      state.value = 'ready'; message.value = stations.value.length ? `${stations.value.length} stations dans un rayon de ${RADIUS_KM} km.` : 'Aucune station trouvée dans ce rayon.'
      if (country.value === 'de') refreshGermanyCooldown()
    } catch (error) {
      if (country.value === 'de') refreshGermanyCooldown()
      state.value = 'error'; message.value = error instanceof Error ? error.message : 'Impossible de récupérer les prix.'
    }
  }
  async function searchForLocation() {
    state.value = 'loading'; message.value = 'Recherche du lieu…'
    try { const location = await findLocation(locationQuery.value); position.value = location; applyDetectedCountry(location.country); await loadStations() }
    catch (error) { state.value = 'error'; message.value = error instanceof Error ? error.message : 'La recherche du lieu a échoué.' }
  }
  function changeFuel(fuel: FuelType) { fuelType.value = fuel; if (position.value) loadStations() }
  function changeFilters(nextFilters: StationFilters) { filters.value = nextFilters }
  async function searchThisArea() {
    if (!mapCenter.value) return
    position.value = { ...mapCenter.value }; stations.value = []; selectedStation.value = null; message.value = 'Recherche dans cette zone…'; applyDetectedCountry(await detectCountryAt(position.value)); loadStations()
  }
  async function findStationsNear(location: Coordinates): Promise<{ country: CountryCode; stations: FuelStation[] }> {
    const stopCountry = await detectCountryAt(location)
    if (!stopCountry) throw new Error('Impossible d’identifier le pays de cet arrêt.')
    try {
      const nearby = await providers[stopCountry].searchStations({ ...location, radiusKm: ROUTE_STOP_RADIUS_KM, fuelType: fuelType.value })
      const stationsWithPrice = nearby
        .filter((item) => item.prices[fuelType.value] !== undefined)
        .sort((a, b) => (a.prices[fuelType.value]! - b.prices[fuelType.value]!) || (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
      if (!stationsWithPrice.length) throw new Error('Aucune station avec un prix disponible n’a été trouvée autour de cet arrêt.')
      return { country: stopCountry, stations: stationsWithPrice }
    } finally { if (stopCountry === 'de') refreshGermanyCooldown() }
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
  return { country, position, stations, selectedStation, fuelType, sort, filters, state, message, locationQuery, mapCenter, cooldownSeconds, germanyCooldownSeconds: cooldownSeconds, germanyCoolingDown, mapMoved, filteredStations, sortedStations, locateAndLoad, loadStations, searchForLocation, changeFuel, changeFilters, selectStation, searchThisArea, findStationsNear, syncCountryAt, changeCountry }
}
