<script setup lang="ts">
import { PhArrowClockwise, PhX } from '@phosphor-icons/vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW({ immediate: true })
</script>

<template>
  <Teleport to="body">
    <div v-if="needRefresh" class="toast toast-end z-60" data-theme="light" role="alert">
      <div class="alert bg-base-100 shadow-xl"><div><p class="font-bold">Mise à jour disponible</p><p class="text-xs text-base-content/65">Une nouvelle version de Tanki est prête.</p></div><button class="btn btn-primary btn-sm" @click="updateServiceWorker(true)"><PhArrowClockwise :size="16" weight="bold" />Mettre à jour</button><button class="btn btn-circle btn-ghost btn-sm" aria-label="Plus tard" @click="needRefresh = false"><PhX :size="16" /></button></div>
    </div>
  </Teleport>
</template>
