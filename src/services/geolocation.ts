import type { Coordinates } from '@/domain/geo'

export type { Coordinates } from '@/domain/geo'

export function getCurrentPosition(): Promise<Coordinates> {
  if (!navigator.geolocation) return Promise.reject(new Error('La géolocalisation n’est pas prise en charge par ce navigateur.'))
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
    (error) => reject(new Error(error.code === error.PERMISSION_DENIED ? 'La géolocalisation a été refusée. Autorisez-la pour trouver les stations proches.' : 'Votre position est indisponible. Réessayez dans un endroit avec une meilleure réception.')),
    { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 }
  ))
}
