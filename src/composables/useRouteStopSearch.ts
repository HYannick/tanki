import { ref } from 'vue'
import type { AsyncStatus } from '@/domain/async'
import type { CountryCode, FuelStation } from '@/domain/fuel'
import type { FuelStopSuggestion } from '@/domain/route'
import type { Coordinates } from '@/domain/geo'

type SearchStationsNear = (location: Coordinates) => Promise<{ country: CountryCode; stations: FuelStation[] }>

export function useRouteStopSearch(searchStationsNear: SearchStationsNear) {
  const stations = ref<FuelStation[]>([])
  const recommendedStation = ref<FuelStation | null>(null)
  const country = ref<CountryCode | null>(null)
  const state = ref<AsyncStatus>('idle')
  const message = ref('')
  let requestVersion = 0

  function clear() {
    requestVersion += 1
    stations.value = []
    recommendedStation.value = null
    country.value = null
    state.value = 'idle'
    message.value = ''
  }

  async function searchFirstStop(stop: FuelStopSuggestion | undefined) {
    if (!stop) return
    const currentRequest = ++requestVersion
    stations.value = []
    recommendedStation.value = null
    state.value = 'loading'
    message.value = 'Recherche de la station la moins chère autour du premier arrêt…'
    try {
      const result = await searchStationsNear(stop.location)
      if (currentRequest !== requestVersion) return
      country.value = result.country
      stations.value = result.stations
      recommendedStation.value = result.stations[0] ?? null
      state.value = 'ready'
      message.value = ''
    } catch (error) {
      if (currentRequest !== requestVersion) return
      state.value = 'error'
      message.value = error instanceof Error ? error.message : 'Impossible de rechercher une station près de cet arrêt.'
    }
  }

  return { stations, recommendedStation, country, state, message, clear, searchFirstStop }
}
