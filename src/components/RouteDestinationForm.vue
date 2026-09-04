<script setup lang="ts">
import {PhMapPin, PhNavigationArrow, PhArrowElbowUpRight, PhGpsFix} from '@phosphor-icons/vue'

defineProps<{ destinationQuery: string; loading: boolean }>()
const emit = defineEmits<{ 'update:destinationQuery': [value: string]; submit: [] }>()
</script>

<template>
  <form class="space-y-3" @submit.prevent="emit('submit')">
    <div class="w-full flex items-center gap-3">
      <span class="btn btn-ghost btn-square">
        <PhGpsFix :size="20" weight="fill"/>
      </span>
      <input id="route-destination" class="input input-bordered w-full flex-1"
             value="Position affichée sur la carte" disabled placeholder="Destination"
             autocomplete="street-address"
             @input="emit('update:destinationQuery', ($event.target as HTMLInputElement).value)">
      <button class="w-10 h-10 btn-primary btn-square" :disabled="loading" aria-label="Calculer l’itinéraire"><span
          v-if="loading" class="loading loading-spinner loading-sm"/>

      </button>
    </div>
    <label class="sr-only" for="route-destination">Destination</label>
    <div class="w-full flex items-center gap-3">
      <span class="btn btn-ghost btn-square">
        <PhMapPin :size="20" weight="fill"/>
      </span>
      <input id="route-destination" class="input input-bordered w-full"
             :value="destinationQuery" placeholder="Destination"
             autocomplete="street-address"
             @input="emit('update:destinationQuery', ($event.target as HTMLInputElement).value)">
      <button class="btn btn-primary btn-square" :disabled="loading" aria-label="Calculer l’itinéraire"><span
          v-if="loading" class="loading loading-spinner loading-sm"/>
        <PhArrowElbowUpRight v-else :size="20"/>
      </button>
    </div>
  </form>
</template>
