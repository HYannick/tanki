import type { Coordinates } from '@/domain/geo'
import type { CountryCode } from '@/domain/fuel'

interface NominatimResult {
    lat: string;
    lon: string;
    address?: { country_code?: string }
}

export interface LocatedCoordinates extends Coordinates { country?: CountryCode }

const cache = new Map<string, LocatedCoordinates>()
const countryCache = new Map<string, CountryCode | null>()
let lastRequestAt = 0

function countryFromCode(value: string | undefined): CountryCode | undefined { return value === 'fr' || value === 'de' ? value : undefined }
async function requestNominatim(url: string) {
    const waitMs = 1_100 - (Date.now() - lastRequestAt)
    if (waitMs > 0) await new Promise((resolve) => window.setTimeout(resolve, waitMs))
    lastRequestAt = Date.now()
    const response = await fetch(url)
    if (!response.ok) throw new Error('Le service de localisation est momentanément indisponible.')
    return response.json()
}

/** Explicit one-shot search, cached and throttled to respect Nominatim's public policy. */
export async function findLocation(query: string): Promise<LocatedCoordinates> {
    const normalized = query.trim()
    if (normalized.length < 2) throw new Error('Saisissez au moins deux caractères pour rechercher un lieu.')
    const cacheKey = normalized.toLowerCase()
    const cached = cache.get(cacheKey)
    if (cached) return cached
    const params = new URLSearchParams({q: normalized, format: 'jsonv2', limit: '1', countrycodes: 'fr,de', addressdetails: '1'})
    const result = (await requestNominatim(`https://nominatim.openstreetmap.org/search?${params}`) as NominatimResult[])[0]
    if (!result) throw new Error('Aucun lieu trouvé. Essayez avec une ville ou une adresse plus précise.')
    const location = {latitude: Number(result.lat), longitude: Number(result.lon), country: countryFromCode(result.address?.country_code)}
    if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) throw new Error('Le lieu trouvé ne possède pas de coordonnées utilisables.')
    cache.set(cacheKey, location)
    return location
}

/** Reverse geocoding is used only after an explicit location action or map-area search. */
export async function detectCountryAt(location: Coordinates): Promise<CountryCode | undefined> {
    const key = `${location.latitude.toFixed(3)}:${location.longitude.toFixed(3)}`
    if (countryCache.has(key)) return countryCache.get(key) ?? undefined
    try {
      const params = new URLSearchParams({ lat: String(location.latitude), lon: String(location.longitude), format: 'jsonv2', zoom: '3', addressdetails: '1' })
      const result = await requestNominatim(`https://nominatim.openstreetmap.org/reverse?${params}`) as NominatimResult
      const country = countryFromCode(result.address?.country_code)
      countryCache.set(key, country ?? null)
      return country
    } catch { return undefined }
}
