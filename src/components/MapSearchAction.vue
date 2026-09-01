<script setup lang="ts">
import { PhMagnifyingGlass } from '@phosphor-icons/vue'
defineProps<{ visible: boolean; loading: boolean; coolingDown: boolean; cooldownSeconds: number }>()
const emit = defineEmits<{ search: [] }>()
</script>

<template><button v-if="visible" class="btn btn-primary shadow-lg" :disabled="loading || coolingDown" @click="emit('search')"><PhMagnifyingGlass :size="16" />{{ coolingDown ? `Disponible dans ${cooldownSeconds}s` : 'Rechercher ici' }}</button></template>
