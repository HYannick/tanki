<script setup lang="ts">
import { ref, watch } from 'vue'
import { PhCar, PhX } from '@phosphor-icons/vue'
import { FUEL_TYPES, type CountryCode, type FuelType, type StationFilters } from '@/domain/fuel'
import type { VehicleProfile } from '@/domain/vehicle'

const props = defineProps<{ open: boolean; profile: VehicleProfile; country: CountryCode; filters: StationFilters }>()
const emit = defineEmits<{ close: []; 'update:profile': [profile: VehicleProfile]; countryChange: [country: CountryCode]; filtersChange: [filters: StationFilters] }>()

const tankCapacityDraft = ref(String(props.profile.tankCapacityLiters))
const tankCapacityError = ref('')
watch(() => props.profile.tankCapacityLiters, (value) => { tankCapacityDraft.value = String(value) })

function updateProfile(patch: Partial<VehicleProfile>) { emit('update:profile', { ...props.profile, ...patch }) }
function updateNumber(key: 'consumptionLitersPer100km' | 'safetyReserveKm' | 'budgetEuros', value: string) {
  const parsed = Number(value)
  if (Number.isFinite(parsed)) updateProfile({ [key]: parsed })
}
function commitTankCapacity() {
  const capacity = Number(tankCapacityDraft.value)
  if (!Number.isFinite(capacity) || capacity < 15) {
    tankCapacityError.value = 'La capacité minimale est de 15 L.'
    return
  }
  tankCapacityError.value = ''
  updateProfile({ tankCapacityLiters: capacity })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="fixed inset-0 z-50 bg-base-100/20" data-theme="light" role="dialog" aria-modal="true" aria-labelledby="vehicle-drawer-title">
        <button class="absolute inset-0 bg-neutral/35" aria-label="Fermer les réglages de mon véhicule" @click="$emit('close')" />
        <aside class="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-base-100 shadow-2xl">
          <header class="flex items-center justify-between border-b border-base-200 px-5 py-4">
            <div class="flex items-center gap-3"><span class="grid size-10 place-items-center rounded-full bg-primary text-primary-content"><PhCar :size="21" weight="fill" /></span><div><h2 id="vehicle-drawer-title" class="font-bold">Mon véhicule</h2><p class="text-xs text-base-content/60">Vos réglages de consommation</p></div></div>
            <button class="btn btn-circle btn-sm btn-ghost" aria-label="Fermer" @click="$emit('close')"><PhX :size="20" weight="bold" /></button>
          </header>
          <div class="flex-1 flex flex-col gap-4 overflow-y-auto p-5">
            <section class="sm:hidden"><p class="mb-2 text-sm font-semibold">Zone de prix</p><div class="join w-full"><button class="btn join-item flex-1" :class="{ 'btn-primary': country === 'fr' }" @click="emit('countryChange', 'fr')">France</button><button class="btn join-item flex-1" :class="{ 'btn-primary': country === 'de' }" @click="emit('countryChange', 'de')">Allemagne</button></div></section>
            <section class="sm:hidden"><p class="mb-2 text-sm font-semibold">Filtres</p><div class="flex flex-wrap gap-2"><button class="btn btn-sm" :class="{ 'btn-primary': filters.openNow }" @click="emit('filtersChange', { ...filters, openNow: !filters.openNow })">Ouvert maintenant</button><button v-if="country === 'fr'" class="btn btn-sm" :class="{ 'btn-primary': filters.automatedPayment }" @click="emit('filtersChange', { ...filters, automatedPayment: !filters.automatedPayment })">Automate 24/24</button></div></section>
            <label class="form-control"><span class="label-text mb-2 font-semibold">Carburant</span><select class="select select-bordered w-full" :value="profile.fuelType" @change="updateProfile({ fuelType: ($event.target as HTMLSelectElement).value as FuelType })"><option v-for="fuel in FUEL_TYPES" :key="fuel" :value="fuel">{{ fuel.toUpperCase() }}</option></select></label>
            <label class="form-control"><span class="label-text mb-2 font-semibold">Capacité du réservoir</span><div class="join w-full"><input class="input input-bordered join-item w-full" :class="{ 'input-error': tankCapacityError }" type="number" step="1" :value="tankCapacityDraft" @input="tankCapacityDraft = ($event.target as HTMLInputElement).value; tankCapacityError = ''" @blur="commitTankCapacity"><span class="btn join-item pointer-events-none">L</span></div><span class="label-text-alt mt-1" :class="tankCapacityError ? 'text-error' : 'text-base-content/55'">{{ tankCapacityError || 'Minimum : 15 L.' }}</span></label>
            <label class="form-control"><span class="label-text mb-2 font-semibold">Consommation moyenne</span><div class="join w-full"><input class="input input-bordered join-item w-full" type="number" min="0.1" step="0.1" :value="profile.consumptionLitersPer100km" @input="updateNumber('consumptionLitersPer100km', ($event.target as HTMLInputElement).value)"><span class="btn join-item pointer-events-none">L / 100 km</span></div></label>
            <label class="form-control"><span class="label-text mb-2 font-semibold">Budget de passage</span><div class="join w-full"><input class="input input-bordered join-item w-full" type="number" min="1" step="1" :value="profile.budgetEuros" @input="updateNumber('budgetEuros', ($event.target as HTMLInputElement).value)"><span class="btn join-item pointer-events-none">€</span></div><span class="label-text-alt mt-1 text-base-content/55">Utilisé pour l’estimation affichée dans les stations.</span></label>
            <label class="form-control"><span class="label-text mb-2 font-semibold">Réserve de sécurité</span><div class="join w-full"><input class="input input-bordered join-item w-full" type="number" min="0" step="5" :value="profile.safetyReserveKm" @input="updateNumber('safetyReserveKm', ($event.target as HTMLInputElement).value)"><span class="btn join-item pointer-events-none">km</span></div><span class="label-text-alt mt-1 text-base-content/55">Conservée avant chaque arrêt conseillé.</span></label>
            <p class="rounded-box bg-base-200 p-3 text-xs leading-relaxed text-base-content/65">Ces réglages sont enregistrés uniquement sur cet appareil.</p>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active, .drawer-leave-active { transition: opacity 240ms ease; }
.drawer-enter-active aside, .drawer-leave-active aside { transition: transform 420ms cubic-bezier(0.32, 0.72, 0, 1); }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-from aside, .drawer-leave-to aside { transform: translateX(100%); }

@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active, .drawer-leave-active, .drawer-enter-active aside, .drawer-leave-active aside { transition-duration: 1ms; }
}
</style>
