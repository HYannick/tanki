import { ref, watch } from 'vue'
import { DEFAULT_VEHICLE_PROFILE, isFuelType, type VehicleProfile } from '@/domain/vehicle'

const STORAGE_KEY = 'fuel-nearby:vehicle-profile'

function loadVehicleProfile(): VehicleProfile {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<VehicleProfile>
    return {
      fuelType: isFuelType(saved.fuelType) ? saved.fuelType : DEFAULT_VEHICLE_PROFILE.fuelType,
      tankCapacityLiters: Number.isFinite(saved.tankCapacityLiters) ? Math.max(1, saved.tankCapacityLiters!) : DEFAULT_VEHICLE_PROFILE.tankCapacityLiters,
      consumptionLitersPer100km: Number.isFinite(saved.consumptionLitersPer100km) ? Math.max(0.1, saved.consumptionLitersPer100km!) : DEFAULT_VEHICLE_PROFILE.consumptionLitersPer100km,
      fuelLevelPercent: Number.isFinite(saved.fuelLevelPercent) ? Math.min(100, Math.max(0, saved.fuelLevelPercent!)) : DEFAULT_VEHICLE_PROFILE.fuelLevelPercent,
      budgetEuros: Number.isFinite(saved.budgetEuros) ? Math.max(1, saved.budgetEuros!) : DEFAULT_VEHICLE_PROFILE.budgetEuros,
    }
  } catch { return { ...DEFAULT_VEHICLE_PROFILE } }
}

export function useVehicleProfile() {
  const vehicle = ref<VehicleProfile>(loadVehicleProfile())
  watch(vehicle, (profile) => window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)), { deep: true })

  function updateVehicle(profile: VehicleProfile) { vehicle.value = profile }

  return { vehicle, updateVehicle }
}
