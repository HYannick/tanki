import type { Coordinates } from '@/domain/geo'
import type { RoutePlan } from '@/domain/route'

interface MapboxRoute {
  distance: number
  duration: number
  geometry: { coordinates: [number, number][] }
}

interface DirectionsResponse {
  routes?: MapboxRoute[]
  message?: string
}

const DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox/driving-traffic'

export async function getDrivingRoute(origin: Coordinates, destination: Coordinates, destinationLabel: string): Promise<RoutePlan> {
  const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
  if (!accessToken) throw new Error('La clé Mapbox est absente. Ajoutez VITE_MAPBOX_ACCESS_TOKEN dans .env.local.')

  const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`
  const params = new URLSearchParams({ access_token: accessToken, geometries: 'geojson', overview: 'full', alternatives: 'false', steps: 'false' })
  const response = await fetch(`${DIRECTIONS_URL}/${coordinates}?${params}`)
  const data = await response.json() as DirectionsResponse
  if (!response.ok) throw new Error(data.message || 'Mapbox ne parvient pas à calculer cet itinéraire.')

  const route = data.routes?.[0]
  if (!route || route.geometry.coordinates.length < 2) throw new Error('Aucun itinéraire routier n’a été trouvé vers cette destination.')

  return {
    destinationLabel,
    destination,
    geometry: route.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude })),
    distanceKm: route.distance / 1_000,
    durationMinutes: route.duration / 60,
  }
}
