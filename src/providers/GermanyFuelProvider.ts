import type { FuelProvider, FuelStation, FuelType, StationSearchParams } from '@/domain/fuel'

interface TankerStation { id: string; name: string; brand?: string; lat: number; lng: number; street?: string; houseNumber?: string; postCode?: number; place?: string; price?: number; diesel?: number; e5?: number; e10?: number; isOpen?: boolean; dist?: number }
interface TankerResponse { ok: boolean; message?: string; stations?: TankerStation[] }
interface TankerDetail { id: string; name: string; brand?: string; lat: number; lng: number; street?: string; houseNumber?: string; postCode?: number; place?: string; diesel?: number; e5?: number; e10?: number; isOpen?: boolean; wholeDay?: boolean; openingTimes?: Array<{ text: string; start: string; end: string }>; overrides?: string[] }
interface TankerDetailResponse { ok: boolean; message?: string; station?: TankerDetail }

const API_URL = 'https://creativecommons.tankerkoenig.de/json/list.php'
const DETAIL_URL = 'https://creativecommons.tankerkoenig.de/json/detail.php'
const CACHE_MS = 65_000

export class GermanyFuelProvider implements FuelProvider {
  private cache = new Map<string, { createdAt: number; stations: FuelStation[] }>()
  private pending = new Map<string, Promise<FuelStation[]>>()
  private detailCache = new Map<string, Partial<FuelStation>>()
  private detailPending = new Map<string, Promise<Partial<FuelStation>>>()
  private lastRequestAt = 0

  getCooldownRemainingMs() { return Math.max(0, CACHE_MS - (Date.now() - this.lastRequestAt)) }

  async searchStations({ latitude, longitude, radiusKm, fuelType }: StationSearchParams) {
    const apiKey = import.meta.env.VITE_TANKERKOENIG_API_KEY
    if (!apiKey) throw new Error('La clé API Tankerkönig est absente. Ajoutez-la dans .env.local.')

    const radius = Math.min(Math.max(radiusKm, 0.1), 25)
    // list.php avec type=all renvoie les trois prix : changer de carburant est alors local et instantané.
    const key = `${latitude.toFixed(3)}:${longitude.toFixed(3)}:${radius}`
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.createdAt < CACHE_MS) return cached.stations
    const existing = this.pending.get(key)
    if (existing) return existing

    if (Date.now() - this.lastRequestAt < CACHE_MS) {
      throw new Error('Les prix viennent d’être demandés. Réessayez dans un instant pour respecter la limite de l’API.')
    }
    const request = this.fetchStations({ latitude, longitude, radius, fuelType, apiKey })
      .then((stations) => { this.cache.set(key, { createdAt: Date.now(), stations }); return stations })
      .finally(() => this.pending.delete(key))
    this.pending.set(key, request)
    this.lastRequestAt = Date.now()
    return request
  }

  async getStationDetails(stationId: string) {
    console.log('sid',stationId)
    const cached = this.detailCache.get(stationId)
    console.log('cached',cached)
    if (cached) return cached
    const existing = this.detailPending.get(stationId)
    console.log('existing', existing)
    if (existing) return existing
    const apiKey = import.meta.env.VITE_TANKERKOENIG_API_KEY
    if (!apiKey) throw new Error('La clé API Tankerkönig est absente. Ajoutez-la dans .env.local.')
    const request = this.fetchDetails(stationId, apiKey)
      .then((details) => { this.detailCache.set(stationId, details); return details })
      .finally(() => this.detailPending.delete(stationId))
    this.detailPending.set(stationId, request)
    return request
  }

  private async fetchStations({ latitude, longitude, radius, fuelType, apiKey }: { latitude: number; longitude: number; radius: number; fuelType: FuelType; apiKey: string }) {
    const query = new URLSearchParams({ lat: String(latitude), lng: String(longitude), rad: String(radius), type: 'all', sort: 'dist', apikey: apiKey })
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 10_000)
    try {
      const response = await fetch(`${API_URL}?${query}`, { signal: controller.signal })
      if (!response.ok) throw new Error('Le service de prix est momentanément indisponible.')
      const data = await response.json() as TankerResponse
      if (!data.ok) throw new Error(data.message || 'La recherche des stations a échoué.')
      const fetchedAt = new Date()
      return (data.stations ?? []).map((station): FuelStation => ({
        id: station.id, name: station.name, brand: station.brand,
        location: { latitude: station.lat, longitude: station.lng },
        address: { street: station.street, houseNumber: station.houseNumber, postcode: station.postCode?.toString(), city: station.place },
        prices: { diesel: station.diesel, e5: station.e5, e10: station.e10 }, isOpen: station.isOpen,
        provider: 'tankerkoenig', distanceKm: station.dist, fetchedAt
      }))
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw new Error('La recherche a expiré. Vérifiez votre connexion puis réessayez.')
      throw error
    } finally { clearTimeout(timeout) }
  }

  private async fetchDetails(stationId: string, apiKey: string): Promise<Partial<FuelStation>> {
    const controller = new AbortController()
    console.log('fetching...');
    const timeout = window.setTimeout(() => controller.abort(), 10_000)
    try {
      const query = new URLSearchParams({ id: stationId, apikey: apiKey })
      const response = await fetch(`${DETAIL_URL}?${query}`, { signal: controller.signal })
      console.log(response);
      if (!response.ok) throw new Error('Le détail de cette station est momentanément indisponible.')
      const data = await response.json() as TankerDetailResponse
      console.log(data);
      if (!data.ok || !data.station) throw new Error(data.message || 'Le détail de cette station est indisponible.')
      const station = data.station
      const prices: Partial<Record<FuelType, number>> = {}
      if (station.diesel !== undefined) prices.diesel = station.diesel
      if (station.e5 !== undefined) prices.e5 = station.e5
      if (station.e10 !== undefined) prices.e10 = station.e10
      const openingHours = station.wholeDay ? ['Ouvert 24h/24'] : station.openingTimes?.map((time) => `${time.text} : ${time.start.slice(0, 5)}–${time.end.slice(0, 5)}`)
      return {
        name: station.name, brand: station.brand, location: { latitude: station.lat, longitude: station.lng },
        address: { street: station.street, houseNumber: station.houseNumber, postcode: station.postCode?.toString(), city: station.place },
        prices, isOpen: station.isOpen, hasAutomatedPayment: station.wholeDay, openingHours,
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw new Error('Le chargement du détail a expiré.')
      throw error
    } finally { clearTimeout(timeout) }
  }
}
