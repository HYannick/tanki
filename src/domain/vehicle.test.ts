import { describe, expect, it } from 'vitest'
import { estimateFuelPurchase, fullTankRangeKm, normalizeVehicleProfile } from '@/domain/vehicle'

describe('vehicle profile', () => {
  it('normalizes range and reserve against the full-tank range', () => {
    const profile = normalizeVehicleProfile({ tankCapacityLiters: 50, consumptionLitersPer100km: 10, remainingRangeKm: 900, safetyReserveKm: 700 })
    expect(fullTankRangeKm(profile)).toBe(500)
    expect(profile.remainingRangeKm).toBe(500)
    expect(profile.safetyReserveKm).toBe(499)
  })

  it('rejects unrealistically small tank capacities', () => {
    expect(normalizeVehicleProfile({ tankCapacityLiters: 2 }).tankCapacityLiters).toBe(15)
  })

  it('derives the fill cost from the remaining range', () => {
    const profile = normalizeVehicleProfile({ tankCapacityLiters: 50, consumptionLitersPer100km: 10, remainingRangeKm: 200 })
    const estimate = estimateFuelPurchase(profile, 2, 50)
    expect(estimate.costToFill).toBe(60)
    expect(estimate.resultingRangeKm).toBe(450)
  })

  it('does not display more liters than the tank can accept', () => {
    const profile = normalizeVehicleProfile({ tankCapacityLiters: 50, consumptionLitersPer100km: 10, remainingRangeKm: 450 })
    const estimate = estimateFuelPurchase(profile, 2, 50)
    expect(estimate.liters).toBe(5)
    expect(estimate.costToFill).toBe(10)
    expect(estimate.fillsTank).toBe(true)
  })
})
