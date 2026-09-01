<script setup lang="ts">
import { PhCrosshair, PhMagnifyingGlass } from '@phosphor-icons/vue'

withDefaults(defineProps<{ modelValue: string; loading: boolean; mode?: 'desktop' | 'mobile' }>(), { mode: 'desktop' })
const emit = defineEmits<{ 'update:modelValue': [value: string]; submit: []; locate: [] }>()

function clearFocus() {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
}
function submit() { clearFocus(); emit('submit') }
function locate() { clearFocus(); emit('locate') }
</script>

<template>
  <form :class="mode === 'mobile' ? 'flex w-full justify-between gap-3 rounded-full bg-base-100 p-1.5 shadow-lg' : 'flex gap-2 border-b border-base-200 px-4 py-2.5'" @submit.prevent="submit">
    <div class="relative flex-1"><input :value="modelValue" :class="mode === 'mobile' ? 'input input-ghost input-lg w-full pr-10' : 'input input-lg w-full pr-10'" aria-label="Ville ou adresse" autocomplete="street-address" placeholder="Ville ou adresse" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
      <button type="button" class="btn btn-ghost btn-xs absolute right-1 top-1/2 -translate-y-1/2" :disabled="loading" title="Me géolocaliser" aria-label="Me géolocaliser" @click="locate"><PhCrosshair :size="18" /></button>
    </div>
    <button :class="mode === 'mobile' ? 'btn btn-primary btn-square btn-lg' : 'btn btn-primary btn-square btn-lg'" :disabled="loading" aria-label="Chercher"><PhMagnifyingGlass :size="mode === 'mobile' ? 20 : 22" /></button>
  </form>
</template>
