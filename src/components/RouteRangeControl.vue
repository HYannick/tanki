<script setup lang="ts">
import { computed } from 'vue'
import { estimatedRangeKm, fullTankRangeKm, type VehicleProfile } from '@/domain/vehicle'

const props = defineProps<{ vehicle: VehicleProfile }>()
const emit = defineEmits<{ update: [value: number] }>()
const rangeKm = computed(() => estimatedRangeKm(props.vehicle))
const fullRangeKm = computed(() => fullTankRangeKm(props.vehicle))
</script>

<template>
  <section class="rounded-box bg-base-200 px-3 py-2.5">
    <div class="flex items-center justify-between gap-3"><span class="text-sm font-semibold">Autonomie actuelle</span><label class="join"><input class="input input-sm join-item w-20 text-right font-bold tabular-nums" type="number" min="0" :max="Math.round(fullRangeKm)" step="1" :value="Math.round(rangeKm)" aria-label="Autonomie actuelle en kilomètres" @input="emit('update', Number(($event.target as HTMLInputElement).value))"><span class="btn btn-sm join-item pointer-events-none">km</span></label></div>
    <input class="range range-primary mt-2 w-full" type="range" min="0" :max="Math.round(fullRangeKm)" step="5" :value="rangeKm" aria-label="Ajuster l’autonomie actuelle" @input="emit('update', Number(($event.target as HTMLInputElement).value))">
  </section>
</template>
