<script setup lang="ts">
import { PhCar, PhMapTrifold } from '@phosphor-icons/vue'

defineProps<{ routeActive: boolean }>()
defineEmits<{ toggleRoute: []; openVehicle: [] }>()
</script>

<template>
  <header class="absolute inset-x-0 top-0 z-40 rounded-b-4xl bg-base-100 pb-5 sm:rounded-none sm:pb-0">
    <div class="flex items-center justify-between px-4 py-3 sm:px-5">
      <h1 class="bg-base-100/95 px-3 py-2 font-black">Tanki</h1>
      <div class="flex gap-2">
        <button class="btn h-10 w-10 p-0 btn-outline sm:w-auto sm:px-4" :class="{ 'btn-primary': routeActive, 'bg-base-100/95': !routeActive }" :aria-label="routeActive ? 'Quitter le mode itinéraire' : 'Planifier un itinéraire'" @click="$emit('toggleRoute')">
          <PhMapTrifold :size="20" weight="fill"/>
          <span class="hidden sm:inline">{{ routeActive ? 'Stations' : 'Itinéraire' }}</span>
        </button>
        <button class="btn h-10 w-10 p-0 btn-outline sm:w-auto sm:px-4" aria-label="Ouvrir les réglages de mon véhicule" @click="$emit('openVehicle')">
          <PhCar :size="20" weight="fill"/>
          <span class="hidden sm:inline">Mon véhicule</span>
        </button>
      </div>
    </div>
    <div class="sm:hidden"><slot name="mobile-content" /></div>
  </header>
</template>
