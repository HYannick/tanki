import type { FuelProvider, FuelStation, FuelType, StationSearchParams } from '@/domain/fuel'
import { distanceBetweenCoordinatesKm } from '@/domain/geo'

const API_URL = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records'
const CACHE_MS = 10 * 60_000

interface FranceRecord {
  id: string | number; adresse?: string; ville?: string; cp?: string
  geom?: { lat: number; lon: number }
  gazole_prix?: number | null; sp95_prix?: number | null; e10_prix?: number | null
  gazole_maj?: string | null; sp95_maj?: string | null; e10_maj?: string | null
  horaires?: string | null; services_service?: string[] | null; horaires_automate_24_24?: string | null
}
interface FranceResponse { results: FranceRecord[] }

/** CORS-enabled official Explore API, filtered server-side around the requested point. */
export class FranceFuelProvider implements FuelProvider {
  private cache = new Map<string, { createdAt: number; stations: FuelStation[] }>()
  private pending = new Map<string, Promise<FuelStation[]>>()

  async searchStations({ latitude, longitude, radiusKm, fuelType }: StationSearchParams) {
    const radius = Math.min(Math.max(radiusKm, 0.1), 25)
    const key = `${latitude.toFixed(3)}:${longitude.toFixed(3)}:${radius}`
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.createdAt < CACHE_MS) return filterByFuel(cached.stations, fuelType)
    const existing = this.pending.get(key)
    if (existing) return filterByFuel(await existing, fuelType)
    const request = this.fetchStations(latitude, longitude, radius)
      .then((stations) => { this.cache.set(key, { createdAt: Date.now(), stations }); return stations })
      .finally(() => this.pending.delete(key))
    this.pending.set(key, request)
    return filterByFuel(await request, fuelType)
  }

  private async fetchStations(latitude: number, longitude: number, radiusKm: number) {
    const where = `within_distance(geom, geom'POINT(${longitude} ${latitude})', ${radiusKm} km)`
    // Explore API caps a single response at 100 records; that is sufficient for the MVP map.
    const query = new URLSearchParams({ where, limit: '100' })
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 12_000)
    try {
      const response = await fetch(`${API_URL}?${query}`, { signal: controller.signal })
      if (!response.ok) throw new Error('Le flux officiel français est momentanément indisponible.')
      const data = await response.json() as FranceResponse
      const fetchedAt = new Date()
      return data.results.flatMap((station) => normalize(station, latitude, longitude)).map((station) => ({ ...station, fetchedAt }))
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw new Error('La recherche des prix français a expiré. Réessayez avec une meilleure connexion.')
      throw error
    } finally { clearTimeout(timeout) }
  }
}

function normalize(record: FranceRecord, originLat: number, originLon: number): FuelStation[] {
  if (!record.geom || !Number.isFinite(record.geom.lat) || !Number.isFinite(record.geom.lon)) return []
  const prices: Partial<Record<FuelType, number>> = {}
  if (record.gazole_prix !== null && record.gazole_prix !== undefined) prices.diesel = record.gazole_prix
  if (record.sp95_prix !== null && record.sp95_prix !== undefined) prices.e5 = record.sp95_prix
  if (record.e10_prix !== null && record.e10_prix !== undefined) prices.e10 = record.e10_prix
  const dates = [record.gazole_maj, record.sp95_maj, record.e10_maj].flatMap((value) => value ? [new Date(value)] : []).filter((date) => !Number.isNaN(date.getTime()))
  const city = record.ville?.trim()
  const openingHours = parseOpeningHours(record.horaires)
  return [{
    id: String(record.id), name: city ? `Station · ${city}` : 'Station-service',
    location: { latitude: record.geom.lat, longitude: record.geom.lon },
    address: { street: record.adresse?.trim(), postcode: record.cp, city }, prices,
    isOpen: isCurrentlyOpen(record.horaires), hasAutomatedPayment: record.horaires_automate_24_24 === 'Oui', openingHours,
    services: record.services_service ?? undefined,
    updatedAt: dates.sort((a, b) => b.getTime() - a.getTime())[0], provider: 'france-prix-carburants',
    distanceKm: distanceBetweenCoordinatesKm({ latitude: originLat, longitude: originLon }, { latitude: record.geom.lat, longitude: record.geom.lon })
  }]
}

interface OpeningDay { name: string; closed: boolean; intervals: Array<{ start: string; end: string }> }

function parseSchedule(raw: string | null | undefined): OpeningDay[] | undefined {
  if (!raw) return undefined
  try {
    const schedule = JSON.parse(raw) as { jour?: Array<{ '@nom'?: string; '@ferme'?: string; horaire?: { '@ouverture'?: string; '@fermeture'?: string } | Array<{ '@ouverture'?: string; '@fermeture'?: string }> }> }
    return schedule.jour?.map((day) => ({ name: day['@nom'] ?? 'Jour', closed: day['@ferme'] === '1', intervals: (Array.isArray(day.horaire) ? day.horaire : [day.horaire]).flatMap((time) => time?.['@ouverture'] && time['@fermeture'] ? [{ start: time['@ouverture'], end: time['@fermeture'] }] : []) }))
  } catch { return undefined }
}

function parseOpeningHours(raw: string | null | undefined) {
  return parseSchedule(raw)?.map((day) => day.closed ? `${day.name} : fermé` : day.intervals.length ? `${day.name} : ${day.intervals.map((interval) => `${interval.start.replace('.', 'h')}–${interval.end.replace('.', 'h')}`).join(', ')}` : `${day.name} : horaires non renseignés`)
}

function isCurrentlyOpen(raw: string | null | undefined) {
  const schedule = parseSchedule(raw)
  if (!schedule) return undefined
  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  const today = schedule.find((day) => day.name.trim().toLocaleLowerCase('fr-FR') === dayNames[new Date().getDay()])
  if (!today) return undefined
  if (today.closed) return false
  const now = new Date(); const minutes = now.getHours() * 60 + now.getMinutes()
  const toMinutes = (value: string) => { const [hours, mins = '0'] = value.replace('h', '.').split('.'); return Number(hours) * 60 + Number(mins) }
  return today.intervals.some((interval) => minutes >= toMinutes(interval.start) && minutes <= toMinutes(interval.end))
}

function filterByFuel(stations: FuelStation[], fuelType: FuelType) { return stations.filter((station) => station.prices[fuelType] !== undefined) }
