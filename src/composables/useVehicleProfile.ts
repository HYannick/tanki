import { ref, watch } from 'vue'
import { DEFAULT_VEHICLE_PROFILE, fullTankRangeKm, MIN_TANK_CAPACITY_LITERS, normalizeVehicleProfile, type VehicleProfile } from '@/domain/vehicle'

const STORAGE_KEY = 'fuel-nearby:vehicle-profile'

function loadVehicleProfile(): VehicleProfile {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<VehicleProfile>
    const tankCapacityLiters = Number.isFinite(saved.tankCapacityLiters) ? Math.max(MIN_TANK_CAPACITY_LITERS, saved.tankCapacityLiters!) : DEFAULT_VEHICLE_PROFILE.tankCapacityLiters
    const consumptionLitersPer100km = Number.isFinite(saved.consumptionLitersPer100km) ? Math.max(0.1, saved.consumptionLitersPer100km!) : DEFAULT_VEHICLE_PROFILE.consumptionLitersPer100km
    const fullRangeKm = fullTankRangeKm({ tankCapacityLiters, consumptionLitersPer100km })
    const legacyLevelPercent = Number.isFinite((saved as { fuelLevelPercent?: unknown }).fuelLevelPercent) ? Number((saved as { fuelLevelPercent: number }).fuelLevelPercent) : undefined
    return normalizeVehicleProfile({
      ...saved,
      tankCapacityLiters,
      consumptionLitersPer100km,
      remainingRangeKm: Number.isFinite(saved.remainingRangeKm) ? saved.remainingRangeKm : legacyLevelPercent === undefined ? DEFAULT_VEHICLE_PROFILE.remainingRangeKm : fullRangeKm * Math.min(100, Math.max(0, legacyLevelPercent)) / 100,
    })
  } catch { return { ...DEFAULT_VEHICLE_PROFILE } }
}

export function useVehicleProfile() {
  const vehicle = ref<VehicleProfile>(loadVehicleProfile())
  watch(vehicle, (profile) => window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)), { deep: true })

  function updateVehicle(profile: VehicleProfile) { vehicle.value = normalizeVehicleProfile(profile) }

  return { vehicle, updateVehicle }
}
