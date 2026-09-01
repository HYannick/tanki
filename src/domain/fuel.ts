import type { Coordinates } from './geo'

export const FUEL_TYPES = ['diesel', 'e5', 'e10'] as const
export const SORT_OPTIONS = ['price', 'distance'] as const
export type FuelType = typeof FUEL_TYPES[number]
export type SortOption = typeof SORT_OPTIONS[number]
export type CountryCode = 'de' | 'fr'
export type SearchStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface StationFilters {
  openNow: boolean
  automatedPayment: boolean
}

export interface StationSearchParams extends Coordinates {
  radiusKm: number
  fuelType: FuelType
}

export interface FuelStation {
  id: string
  name: string
  brand?: string
  location: { latitude: number; longitude: number }
  address?: { street?: string; houseNumber?: string; postcode?: string; city?: string }
  prices: Partial<Record<FuelType, number>>
  isOpen?: boolean
  hasAutomatedPayment?: boolean
  openingHours?: string[]
  services?: string[]
  updatedAt?: Date
  fetchedAt?: Date
  provider: string
  distanceKm?: number
}

export interface FuelProvider {
  searchStations(params: StationSearchParams): Promise<FuelStation[]>
  getStationDetails?(stationId: string): Promise<Partial<FuelStation>>
}

export type ProviderRegistry = Record<CountryCode, FuelProvider>
