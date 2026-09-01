<script setup lang="ts">
import StationDetailsContent from '@/components/StationDetailsContent.vue'
import type { FuelStation, FuelType } from '@/domain/fuel'
import type { VehicleProfile } from '@/domain/vehicle'

defineProps<{ station: FuelStation; fuelType: FuelType; vehicle: VehicleProfile }>()
const emit = defineEmits<{ close: []; navigate: [station: FuelStation] }>()
</script>

<template>
  <aside class="absolute inset-y-4.5 right-4.5 z-30 hidden w-87.5 overflow-y-auto rounded-box bg-base-100 p-5 shadow-2xl min-[681px]:block" aria-label="Détail de la station">
    <StationDetailsContent :station="station" :fuel-type="fuelType" :vehicle="vehicle" @close="emit('close')" @navigate="emit('navigate', $event)" />
  </aside>
</template>
