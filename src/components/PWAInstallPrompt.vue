<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { PhDownloadSimple, PhX } from '@phosphor-icons/vue'

interface InstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

const deferredPrompt = ref<InstallPromptEvent | null>(null)
const dismissed = ref(false)
const visible = computed(() => Boolean(deferredPrompt.value) && !dismissed.value)
function onBeforeInstallPrompt(event: Event) { event.preventDefault(); deferredPrompt.value = event as InstallPromptEvent }
async function install() {
  if (!deferredPrompt.value) return
  await deferredPrompt.value.prompt()
  await deferredPrompt.value.userChoice
  deferredPrompt.value = null
}
onMounted(() => window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt))
onBeforeUnmount(() => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt))
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="toast toast-end z-50" data-theme="light">
      <div class="alert bg-base-100 shadow-xl"><div><p class="font-bold">Installer Tanki</p><p class="text-xs text-base-content/65">Accès rapide, comme une application.</p></div><button class="btn btn-primary btn-sm" @click="install"><PhDownloadSimple :size="16" weight="bold" />Installer</button><button class="btn btn-circle btn-ghost btn-sm" aria-label="Pas maintenant" @click="dismissed = true"><PhX :size="16" /></button></div>
    </div>
  </Teleport>
</template>
