import type { Coordinates } from '@/domain/geo'
import { distanceBetweenCoordinatesKm } from '@/domain/geo'
import type { AsyncStatus } from '@/domain/async'

export interface RoutePlan {
  destinationLabel: string
  destination: Coordinates
  geometry: Coordinates[]
  distanceKm: number
  durationMinutes: number
}

export type RouteState = AsyncStatus

export interface FuelStopSuggestion {
  index: number
  location: Coordinates
  distanceFromStartKm: number
  safetyReserveKm: number
}

/**
 * A stop remains only a search target: it deliberately performs no station API call.
 */
function pointAtRouteDistance(route: RoutePlan, targetDistanceKm: number): Coordinates | null {
  let traveledKm = 0

  for (let index = 1; index < route.geometry.length; index += 1) {
    const start = route.geometry[index - 1]
    const end = route.geometry[index]
    const segmentKm = distanceBetweenCoordinatesKm(start, end)
    if (traveledKm + segmentKm >= targetDistanceKm) {
      const progress = segmentKm === 0 ? 0 : (targetDistanceKm - traveledKm) / segmentKm
      return {
        latitude: start.latitude + (end.latitude - start.latitude) * progress,
        longitude: start.longitude + (end.longitude - start.longitude) * progress,
      }
    }
    traveledKm += segmentKm
  }

  return route.geometry.at(-1) ?? null
}

/**
 * Plans every refuel needed to reach the destination. The first stop uses the
 * fuel currently in the tank; subsequent stops assume a full tank.
 */
export function suggestFuelStops(route: RoutePlan | null, currentRangeKm: number, fullRangeKm: number, safetyReserveKm: number): FuelStopSuggestion[] {
  const reserveKm = Math.min(Math.max(0, safetyReserveKm), Math.max(0, fullRangeKm - 1))
  if (!route || route.geometry.length < 2 || currentRangeKm <= 0 || fullRangeKm <= 0 || route.distanceKm <= Math.max(0, currentRangeKm - reserveKm)) return []

  const stops: FuelStopSuggestion[] = []
  let legStartKm = 0
  let rangeForLegKm = currentRangeKm

  while (route.distanceKm > legStartKm + Math.max(0, rangeForLegKm - reserveKm)) {
    const distanceFromStartKm = legStartKm + Math.max(0, rangeForLegKm - reserveKm)
    const location = pointAtRouteDistance(route, distanceFromStartKm)
    if (!location) break
    stops.push({
      index: stops.length + 1,
      location,
      distanceFromStartKm,
      safetyReserveKm: Math.min(reserveKm, rangeForLegKm),
    })
    legStartKm = distanceFromStartKm
    rangeForLegKm = fullRangeKm
  }

  return stops
}
