<script setup lang="ts">
import {PhNavigationArrow, PhSignpost} from '@phosphor-icons/vue'
import type {CountryCode, FuelStation, FuelType, SearchStatus} from '@/domain/fuel'
import {formatStationAddress} from '@/domain/station'

withDefaults(defineProps<{
  country: CountryCode | null;
  station: FuelStation | null;
  stationCount: number;
  fuelType: FuelType;
  state: SearchStatus;
  message: string;
  coolingDown: boolean;
  cooldownSeconds: number;
  showAction?: boolean
}>(), {showAction: true})
const emit = defineEmits<{ search: []; navigate: [station: FuelStation] }>()
</script>

<template>
  <section class="rounded-box border border-base-200 bg-base-100 p-3 text-sm">
    <template v-if="station"><p class="text-xs font-semibold uppercase tracking-wide text-base-content/50">Station la
      moins chère près de l’arrêt <span v-if="country">· {{ country.toUpperCase() }}</span></p>
      <p class="mt-1 font-bold">{{ station.brand || station.name }}</p>
      <p class="mt-0.5 text-base-content/65">{{ formatStationAddress(station) || 'Adresse indisponible' }}</p>
      <p class="mt-1 text-xs text-base-content/55">{{ stationCount }} station{{ stationCount > 1 ? 's' : '' }}
        affichée{{ stationCount > 1 ? 's' : '' }} sur la carte : choisissez celle qui vous convient.</p>
      <div class="mt-3 flex items-center justify-between gap-2"><strong
          class="text-base">{{ station.prices[fuelType]?.toFixed(3) }} € / L</strong>
        <button v-if="showAction" class="btn btn-primary btn-sm" type="button" @click="emit('navigate', station)">
          <PhNavigationArrow :size="16" weight="fill"/>
          Y aller
        </button>
      </div>
    </template>
    <template v-else><p class="font-semibold">Trouver le meilleur arrêt</p>
      <p class="mt-1 text-xs text-base-content/60">Le pays et la source de prix seront choisis selon le repère du
        trajet.</p>
      <button v-if="showAction" class="btn btn-outline btn-sm mt-3 w-full" type="button"
              :disabled="state === 'loading' || coolingDown" @click="emit('search')"><span v-if="state === 'loading'"
                                                                                           class="loading loading-spinner loading-xs"/>
        <PhSignpost v-else :size="16" weight="fill"/>
        {{ coolingDown ? `Disponible dans ${cooldownSeconds}s` : 'Trouver la station la moins chère' }}
      </button>
      <p v-if="message" class="mt-2 text-xs" :class="state === 'error' ? 'text-error' : 'text-base-content/60'">
        {{ message }}</p></template>
  </section>
</template>
