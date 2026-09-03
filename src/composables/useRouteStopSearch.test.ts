import { describe, expect, it } from 'vitest'
import { useRouteStopSearch } from '@/composables/useRouteStopSearch'
import type { FuelStation } from '@/domain/fuel'

const station: FuelStation = { id: 'station', name: 'Station', location: { latitude: 1, longitude: 2 }, prices: { diesel: 1.8 }, provider: 'test' }
const stop = { index: 1, location: { latitude: 1, longitude: 2 }, distanceFromStartKm: 150, safetyReserveKm: 50 }

describe('useRouteStopSearch', () => {
  it('keeps the country returned for the actual stop location', async () => {
    const search = useRouteStopSearch(async () => ({ country: 'fr', stations: [station] }))
    await search.searchFirstStop(stop)
    expect(search.country.value).toBe('fr')
    expect(search.recommendedStation.value).toEqual(station)
  })

  it('ignores a response invalidated while the request is pending', async () => {
    let resolveSearch!: (value: { country: 'de'; stations: FuelStation[] }) => void
    const search = useRouteStopSearch(() => new Promise((resolve) => { resolveSearch = resolve }))
    const pending = search.searchFirstStop(stop)
    search.clear()
    resolveSearch({ country: 'de', stations: [station] })
    await pending
    expect(search.stations.value).toEqual([])
    expect(search.state.value).toBe('idle')
  })
})
