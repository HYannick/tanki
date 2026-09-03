import { FUEL_TYPES, type FuelType } from '@/domain/fuel'

export interface VehicleProfile {
  fuelType: FuelType
  tankCapacityLiters: number
  consumptionLitersPer100km: number
  remainingRangeKm: number
  safetyReserveKm: number
  budgetEuros: number
}

export const DEFAULT_VEHICLE_PROFILE: VehicleProfile = {
  fuelType: 'diesel',
  tankCapacityLiters: 50,
  consumptionLitersPer100km: 6,
  remainingRangeKm: 400,
  safetyReserveKm: 50,
  budgetEuros: 50,
}

export const MIN_TANK_CAPACITY_LITERS = 15

export function isFuelType(value: unknown): value is FuelType {
  return typeof value === 'string' && (FUEL_TYPES as readonly string[]).includes(value)
}

export function normalizeVehicleProfile(profile: Partial<VehicleProfile>): VehicleProfile {
  const tankCapacityLiters = Number.isFinite(profile.tankCapacityLiters) ? Math.max(MIN_TANK_CAPACITY_LITERS, profile.tankCapacityLiters!) : DEFAULT_VEHICLE_PROFILE.tankCapacityLiters
  const consumptionLitersPer100km = Number.isFinite(profile.consumptionLitersPer100km) ? Math.max(0.1, profile.consumptionLitersPer100km!) : DEFAULT_VEHICLE_PROFILE.consumptionLitersPer100km
  const fullRangeKm = fullTankRangeKm({ tankCapacityLiters, consumptionLitersPer100km })
  return {
    fuelType: isFuelType(profile.fuelType) ? profile.fuelType : DEFAULT_VEHICLE_PROFILE.fuelType,
    tankCapacityLiters,
    consumptionLitersPer100km,
    remainingRangeKm: Number.isFinite(profile.remainingRangeKm) ? Math.min(fullRangeKm, Math.max(0, profile.remainingRangeKm!)) : DEFAULT_VEHICLE_PROFILE.remainingRangeKm,
    safetyReserveKm: Number.isFinite(profile.safetyReserveKm) ? Math.min(Math.max(0, fullRangeKm - 1), Math.max(0, profile.safetyReserveKm!)) : DEFAULT_VEHICLE_PROFILE.safetyReserveKm,
    budgetEuros: Number.isFinite(profile.budgetEuros) ? Math.max(1, profile.budgetEuros!) : DEFAULT_VEHICLE_PROFILE.budgetEuros,
  }
}

export interface FuelPurchaseEstimate {
  liters: number
  resultingLevelPercent: number
  resultingRangeKm: number
  costToFill: number
  fillsTank: boolean
}

export function estimateFuelPurchase(profile: VehicleProfile, pricePerLiter: number, budget = 50): FuelPurchaseEstimate {
  const currentLiters = remainingLiters(profile)
  const availableLiters = Math.max(0, profile.tankCapacityLiters - currentLiters)
  const affordableLiters = budget / pricePerLiter
  const liters = Math.min(affordableLiters, availableLiters)
  const resultingLiters = Math.min(profile.tankCapacityLiters, currentLiters + liters)
  return {
    liters,
    resultingLevelPercent: resultingLiters / profile.tankCapacityLiters * 100,
    resultingRangeKm: resultingLiters / profile.consumptionLitersPer100km * 100,
    costToFill: availableLiters * pricePerLiter,
    fillsTank: affordableLiters >= availableLiters,
  }
}

export function estimatedRangeKm(profile: VehicleProfile): number {
  return Math.min(Math.max(0, profile.remainingRangeKm), fullTankRangeKm(profile))
}

export function fullTankRangeKm(profile: Pick<VehicleProfile, 'tankCapacityLiters' | 'consumptionLitersPer100km'>): number {
  if (profile.consumptionLitersPer100km <= 0) return 0
  return profile.tankCapacityLiters / profile.consumptionLitersPer100km * 100
}

function remainingLiters(profile: VehicleProfile): number {
  return Math.min(profile.tankCapacityLiters, estimatedRangeKm(profile) * profile.consumptionLitersPer100km / 100)
}
