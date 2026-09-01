import type { Coordinates } from '@/domain/geo'
import { distanceBetweenCoordinatesKm } from '@/domain/geo'

export interface RoutePlan {
  destinationLabel: string
  destination: Coordinates
  geometry: Coordinates[]
  distanceKm: number
  durationMinutes: number
}

export type RouteState = 'idle' | 'loading' | 'ready' | 'error'

export interface FuelStopSuggestion {
  index: number
  location: Coordinates
  distanceFromStartKm: number
  safetyReserveKm: number
}

/**
 * Picks a conservative point on the route, preserving 20% of the estimated
 * range. This is only a search target: it deliberately performs no station API call.
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
export function suggestFuelStops(route: RoutePlan | null, currentRangeKm: number, fullRangeKm: number, safetyMargin = 0.2): FuelStopSuggestion[] {
  if (!route || route.geometry.length < 2 || currentRangeKm <= 0 || fullRangeKm <= 0 || route.distanceKm <= currentRangeKm) return []

  const safeCurrentRangeKm = currentRangeKm * (1 - safetyMargin)
  if (safeCurrentRangeKm <= 0) return []

  const stops: FuelStopSuggestion[] = []
  let legStartKm = 0
  let rangeForLegKm = currentRangeKm

  while (route.distanceKm > legStartKm + rangeForLegKm) {
    const distanceFromStartKm = legStartKm + rangeForLegKm * (1 - safetyMargin)
    const location = pointAtRouteDistance(route, distanceFromStartKm)
    if (!location) break
    stops.push({
      index: stops.length + 1,
      location,
      distanceFromStartKm,
      safetyReserveKm: rangeForLegKm * safetyMargin,
    })
    legStartKm = distanceFromStartKm
    rangeForLegKm = fullRangeKm
  }

  return stops
}
