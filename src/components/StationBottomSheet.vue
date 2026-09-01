<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { DrawerContent, DrawerHandle, DrawerOverlay, DrawerPortal, DrawerRoot, DrawerTitle } from 'reka-ui'
import StationDetailsContent from '@/components/StationDetailsContent.vue'
import type { FuelStation, FuelType } from '@/domain/fuel'
import type { VehicleProfile } from '@/domain/vehicle'

defineProps<{ open: boolean; station: FuelStation; fuelType: FuelType; vehicle: VehicleProfile }>()
const emit = defineEmits<{ close: []; navigate: [station: FuelStation] }>()
const SNAP_POINT = 400;
const snapPoint = ref<string | number | null>(SNAP_POINT)
const ready = ref(false)
const closing = ref(false)
let closeTimer: number | undefined
function requestClose() {
  if (closing.value) return
  closing.value = true
  ready.value = false
  closeTimer = window.setTimeout(() => emit('close'), 420)
}
function updateOpen(open: boolean) { if (!open) requestClose() }
onMounted(async () => { await nextTick(); requestAnimationFrame(() => { ready.value = true }) })
onBeforeUnmount(() => window.clearTimeout(closeTimer))
</script>

<template>
  <DrawerRoot :open="open" :snap-points="[SNAP_POINT, 0.82]" :snap-point="snapPoint" :default-snap-point="SNAP_POINT" @update:open="updateOpen" @update:snap-point="snapPoint = $event">
    <DrawerPortal>
      <DrawerOverlay class="station-sheet-overlay fixed inset-0 z-40 bg-black/30" :class="{ 'is-ready': ready }" @click="requestClose" />
      <DrawerContent class="station-bottom-sheet fixed inset-x-0 bottom-0 z-50 h-[82dvh] rounded-t-3xl bg-base-100 shadow-2xl outline-none" :class="{ 'is-ready': ready }" data-theme="light">
        <DrawerTitle class="sr-only">Détail de la station {{ station.brand || station.name }}</DrawerTitle>
        <DrawerHandle class="mx-auto mt-3 block h-1.5 w-12 rounded-full bg-base-content/20" />
        <div class="h-[calc(82dvh-18px)] px-5 pb-5 pt-3 overscroll-contain" :class="snapPoint === 0.82 ? 'overflow-y-auto' : 'overflow-hidden'"><StationDetailsContent :station="station" :fuel-type="fuelType" :vehicle="vehicle" @close="requestClose" @navigate="emit('navigate', $event)" /></div>
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>

<style scoped>
.station-bottom-sheet {
  transform: translate3d(0, 100%, 0);
  transition: transform 420ms cubic-bezier(0.32, 0.72, 0, 1);
}

.station-bottom-sheet.is-ready { transform: translate3d(0, calc(var(--drawer-snap-point-offset, 0px) + var(--drawer-swipe-movement-y, 0px)), 0); }
.station-bottom-sheet[data-swiping] { transition: none; }

.station-sheet-overlay { opacity: 0; transition: opacity 280ms ease; }
.station-sheet-overlay.is-ready { opacity: 1; }

@media (prefers-reduced-motion: reduce) {
  .station-bottom-sheet { transition-duration: 1ms; }
}
</style>
