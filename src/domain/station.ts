import type { FuelStation, FuelType } from '@/domain/fuel'

export type PriceTone = 'green' | 'yellow' | 'red'

export function formatFuelPrice(price: number | undefined, decimals = 2): string {
  return price === undefined ? 'Prix indisponible' : `${price.toFixed(decimals).replace('.', ',')} €`
}

export function formatStationAddress(station: FuelStation): string {
  const { address } = station
  return [
    [address?.street, address?.houseNumber].filter(Boolean).join(' '),
    [address?.postcode, address?.city].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ')
}

export function getStationPriceTone(station: FuelStation, stations: FuelStation[], fuelType: FuelType): PriceTone {
  const prices = stations.map((item) => item.prices[fuelType]).filter((value): value is number => value !== undefined)
  const value = station.prices[fuelType]
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (value === undefined || !Number.isFinite(min) || max === min) return 'green'
  const relativePosition = (value - min) / (max - min)
  if (relativePosition <= 1 / 3) return 'green'
  if (relativePosition <= 2 / 3) return 'yellow'
  return 'red'
}
