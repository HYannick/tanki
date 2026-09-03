import { describe, expect, it } from 'vitest'
import { suggestFuelStops, type RoutePlan } from '@/domain/route'

const route = (distanceKm: number): RoutePlan => ({
  destinationLabel: 'Destination',
  destination: { latitude: 9, longitude: 0 },
  geometry: [{ latitude: 0, longitude: 0 }, { latitude: 9, longitude: 0 }],
  distanceKm,
  durationMinutes: distanceKm,
})

describe('suggestFuelStops', () => {
  it('does not suggest a stop when the destination is reachable while keeping the reserve', () => {
    expect(suggestFuelStops(route(140), 200, 500, 50)).toEqual([])
  })

  it('places the first stop before the current range is exhausted', () => {
    const stops = suggestFuelStops(route(300), 200, 500, 50)
    expect(stops).toHaveLength(1)
    expect(stops[0]).toMatchObject({ index: 1, distanceFromStartKm: 150, safetyReserveKm: 50 })
  })

  it('plans successive stops using a full tank after the first refuel', () => {
    const stops = suggestFuelStops(route(900), 200, 300, 50)
    expect(stops.map((stop) => stop.distanceFromStartKm)).toEqual([150, 400, 650])
  })
})
