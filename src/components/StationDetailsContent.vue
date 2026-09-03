<script setup lang="ts">
import {PhClock, PhNavigationArrow, PhStorefront, PhX} from '@phosphor-icons/vue'
import StationTimestamp from '@/components/StationTimestamp.vue'
import type {FuelStation, FuelType} from '@/domain/fuel'
import {estimatedRangeKm, estimateFuelPurchase, type VehicleProfile} from '@/domain/vehicle'
import { formatFuelPrice, formatStationAddress } from '@/domain/station'

const props = defineProps<{ station: FuelStation; fuelType: FuelType; vehicle: VehicleProfile }>()
const emit = defineEmits<{ close: []; navigate: [station: FuelStation] }>()
const purchaseEstimate = () => {
  const stationPrice = props.station.prices[props.fuelType]
  return stationPrice === undefined ? null : estimateFuelPurchase(props.vehicle, stationPrice, props.vehicle.budgetEuros)
}
</script>

<template>
  <header class="flex items-start justify-between gap-3">
    <div><p class="text-xs font-bold uppercase tracking-wider text-base-content/50">Station-service</p>
      <h2 class="mt-1 text-xl font-bold leading-tight">{{ station.brand || station.name }}</h2></div>
    <button class="btn btn-circle btn-ghost btn-sm" aria-label="Fermer la fiche" @click="emit('close')">
      <PhX :size="20"/>
    </button>
  </header>
  <div class="mt-4 flex justify-between items-center">
    <div class="flex items-center justify-between rounded-full bg-base-300 p-3 gap-5"><span
        class="font-bold">{{ fuelType.toUpperCase() }}</span><strong
        class="text-xl">{{ formatFuelPrice(station.prices[fuelType], 3) }}</strong></div>
    <button class="btn btn-info max-w-36 w-full" @click="emit('navigate', station)">
      <PhNavigationArrow :size="17" weight="fill"/>
      Naviguer
    </button>
  </div>
  <StationTimestamp :updated-at="station.updatedAt" :fetched-at="station.fetchedAt"/>
  <section v-if="purchaseEstimate()" class="mt-3 grid grid-cols-2 gap-2">
    <div class="rounded-box bg-base-200 p-3"><p
        class="text-[11px] font-bold uppercase tracking-wide text-base-content/55">Votre budget</p>
      <p class="mt-1 text-lg font-bold tabular-nums">{{ vehicle.budgetEuros.toFixed(0) }} €</p>
      <p class="mt-1 text-xs leading-relaxed text-base-content/70">≈
        {{ purchaseEstimate()!.liters.toFixed(1).replace('.', ',') }} L · autonomie à
        <strong>{{ purchaseEstimate()!.resultingRangeKm.toFixed(0) }} km</strong></p></div>
    <div class="rounded-box bg-primary p-3 text-primary-content"><p
        class="text-[11px] font-bold uppercase tracking-wide text-primary-content/65">Faire le plein</p>
      <p class="mt-1 text-lg font-bold tabular-nums">{{ purchaseEstimate()!.costToFill.toFixed(2).replace('.', ',') }}
        €</p>
      <p class="mt-1 text-xs leading-relaxed text-primary-content/75">Depuis {{ estimatedRangeKm(vehicle).toFixed(0) }} km d’autonomie
        <template v-if="purchaseEstimate()!.fillsTank"> · votre budget suffit</template>
      </p>
    </div>
  </section>
  <div class="mt-4">
    <p class="font-bold text-sm">Adresse</p>
    <p class="text-sm leading-relaxed text-base-content/65">{{ formatStationAddress(station) || 'Adresse indisponible' }}</p>
  </div>
  <p v-if="station.isOpen !== undefined" class="mt-3 text-sm font-bold"
     :class="station.isOpen ? 'text-success' : 'text-error'">
    {{ station.isOpen ? 'Ouvert actuellement' : 'Fermé actuellement' }}</p>
  <p v-if="station.hasAutomatedPayment"
     class="mt-3 flex items-center gap-2 rounded-box bg-base-200 p-3 text-sm font-semibold">
    <PhClock :size="18" weight="bold"/>
    Automate : 24/24
  </p>
  <section v-if="station.openingHours?.length" class="mt-6">
    <h3 class="mb-3 flex items-center gap-2 text-sm font-bold">
      <PhClock :size="18"/>
      Horaires boutique/guichet
    </h3>
    <ul class="space-y-1.5 text-sm text-base-content/65">
      <li v-for="hour in station.openingHours" :key="hour">{{ hour }}</li>
    </ul>
  </section>
  <section v-if="station.services?.length" class="mt-6">
    <h3 class="mb-3 flex items-center gap-2 text-sm font-bold">
      <PhStorefront :size="18"/>
      Services proposés
    </h3>
    <div class="flex flex-wrap gap-1.5"><span v-for="service in station.services" :key="service"
                                              class="badge badge-ghost badge-sm h-auto whitespace-normal py-1.5 text-left">{{
        service
      }}</span></div>
  </section>
</template>
