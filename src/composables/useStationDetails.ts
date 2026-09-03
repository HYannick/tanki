import type { Ref } from 'vue'
import type { CountryCode, FuelStation, ProviderRegistry } from '@/domain/fuel'

export function useStationDetails(providers: ProviderRegistry, country: Ref<CountryCode>, selectedStation: Ref<FuelStation | null>) {
  async function selectStation(station: FuelStation) {
    selectedStation.value = station
    const provider = providers[country.value]
    if (!provider.getStationDetails) return
    try {
      const details = await provider.getStationDetails(station.id)
      if (selectedStation.value?.id !== station.id) return
      selectedStation.value = {
        ...station,
        ...details,
        location: details.location ?? station.location,
        address: { ...station.address, ...details.address },
        prices: { ...station.prices, ...details.prices },
      }
    } catch {
      // The basic list data remains usable if an optional detail request fails.
    }
  }

  return { selectStation }
}
