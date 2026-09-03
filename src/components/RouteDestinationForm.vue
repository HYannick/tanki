<script setup lang="ts">
import { PhMapPin, PhNavigationArrow, PhRoadHorizon } from '@phosphor-icons/vue'

defineProps<{ destinationQuery: string; loading: boolean }>()
const emit = defineEmits<{ 'update:destinationQuery': [value: string]; submit: [] }>()
</script>

<template>
  <form class="space-y-3" @submit.prevent="emit('submit')">
    <div class="flex items-center gap-3 rounded-box bg-base-200 px-3 py-2.5 text-sm"><PhNavigationArrow class="text-primary" :size="18" weight="fill" /><span><strong>Départ</strong><span class="ml-2 text-base-content/60">Position affichée sur la carte</span></span></div>
    <label class="sr-only" for="route-destination">Destination</label>
    <div class="join w-full"><span class="join-item grid place-items-center bg-base-200 px-3 text-primary"><PhMapPin :size="20" weight="fill" /></span><input id="route-destination" class="input input-bordered join-item w-full" :value="destinationQuery" placeholder="Destination" autocomplete="street-address" @input="emit('update:destinationQuery', ($event.target as HTMLInputElement).value)"><button class="btn btn-primary join-item" :disabled="loading" aria-label="Calculer l’itinéraire"><span v-if="loading" class="loading loading-spinner loading-sm" /><PhRoadHorizon v-else :size="20" weight="fill" /></button></div>
  </form>
</template>
