import { FUEL_TYPES, type FuelType } from '@/domain/fuel'

export interface VehicleProfile {
  fuelType: FuelType
  tankCapacityLiters: number
  consumptionLitersPer100km: number
  fuelLevelPercent: number
  budgetEuros: number
}

export const DEFAULT_VEHICLE_PROFILE: VehicleProfile = {
  fuelType: 'diesel',
  tankCapacityLiters: 50,
  consumptionLitersPer100km: 6,
  fuelLevelPercent: 50,
  budgetEuros: 50,
}

export function isFuelType(value: unknown): value is FuelType {
  return typeof value === 'string' && (FUEL_TYPES as readonly string[]).includes(value)
}

export interface FuelPurchaseEstimate {
  liters: number
  resultingLevelPercent: number
  costToFill: number
  fillsTank: boolean
}

export function estimateFuelPurchase(profile: VehicleProfile, pricePerLiter: number, budget = 50): FuelPurchaseEstimate {
  const liters = budget / pricePerLiter
  const currentLiters = profile.tankCapacityLiters * profile.fuelLevelPercent / 100
  const availableLiters = Math.max(0, profile.tankCapacityLiters - currentLiters)
  return {
    liters,
    resultingLevelPercent: Math.min(100, (currentLiters + liters) / profile.tankCapacityLiters * 100),
    costToFill: availableLiters * pricePerLiter,
    fillsTank: liters >= availableLiters,
  }
}

export function estimatedRangeKm(profile: VehicleProfile): number {
  if (profile.consumptionLitersPer100km <= 0) return 0
  const remainingLiters = profile.tankCapacityLiters * profile.fuelLevelPercent / 100
  return remainingLiters / profile.consumptionLitersPer100km * 100
}
