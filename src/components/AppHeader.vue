<script setup lang="ts">
import { PhCar } from '@phosphor-icons/vue'

defineEmits<{ openVehicle: [] }>()
</script>

<template>
  <header class="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-4 py-3 sm:px-5">
    <p class="rounded-box bg-base-100/95 px-3 py-2 text-sm font-black tracking-tight shadow-sm backdrop-blur">Tanki</p>
    <button class="btn btn-sm bg-base-100/95 shadow-sm backdrop-blur" aria-label="Ouvrir les réglages de mon véhicule" @click="$emit('openVehicle')">
      <PhCar :size="20" weight="fill" />
      <span class="hidden sm:inline">Mon véhicule</span>
    </button>
  </header>
</template>
