import { describe, expect, it } from 'vitest'
import { formatStationAddress, getStationPriceTone } from '@/domain/station'
import type { FuelStation } from '@/domain/fuel'

const station = (id: string, diesel: number): FuelStation => ({ id, name: id, location: { latitude: 0, longitude: 0 }, prices: { diesel }, provider: 'test' })

describe('station helpers', () => {
  it('formats an address without empty separators', () => {
    expect(formatStationAddress({ ...station('a', 1.8), address: { street: 'Rue du Test', houseNumber: '12', postcode: '75000', city: 'Paris' } })).toBe('Rue du Test 12, 75000 Paris')
  })

  it('uses the same relative tones everywhere', () => {
    const stations = [station('low', 1.7), station('mid', 1.8), station('high', 2)]
    expect(getStationPriceTone(stations[0], stations, 'diesel')).toBe('green')
    expect(getStationPriceTone(stations[1], stations, 'diesel')).toBe('yellow')
    expect(getStationPriceTone(stations[2], stations, 'diesel')).toBe('red')
  })
})
