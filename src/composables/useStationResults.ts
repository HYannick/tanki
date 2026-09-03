import { computed, type Ref } from 'vue'
import type { FuelStation, FuelType, SortOption, StationFilters } from '@/domain/fuel'

export function useStationResults(stations: Ref<FuelStation[]>, fuelType: Ref<FuelType>, filters: Ref<StationFilters>, sort: Ref<SortOption>) {
  const filteredStations = computed(() => stations.value.filter((station) => (!filters.value.openNow || station.isOpen === true) && (!filters.value.automatedPayment || station.hasAutomatedPayment === true)))
  const sortedStations = computed(() => [...filteredStations.value].sort((a, b) => sort.value === 'distance' ? (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) : (a.prices[fuelType.value] ?? Infinity) - (b.prices[fuelType.value] ?? Infinity)))
  return { filteredStations, sortedStations }
}
