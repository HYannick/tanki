export interface Coordinates {
  latitude: number
  longitude: number
}

export function distanceBetweenCoordinatesKm(a: Coordinates, b: Coordinates) {
  const toRadians = (value: number) => value * Math.PI / 180
  const earthRadiusKm = 6371
  const latitudeDelta = toRadians(b.latitude - a.latitude)
  const longitudeDelta = toRadians(b.longitude - a.longitude)
  const haversine = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(longitudeDelta / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}
