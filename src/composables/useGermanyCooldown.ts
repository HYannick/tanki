import { onBeforeUnmount, ref } from 'vue'

interface CooldownSource { getCooldownRemainingMs(): number }

export function useGermanyCooldown(source: CooldownSource) {
  const cooldownSeconds = ref(0)
  let timer: number | undefined

  function refresh() {
    window.clearInterval(timer)
    const update = () => {
      cooldownSeconds.value = Math.ceil(source.getCooldownRemainingMs() / 1000)
      if (!cooldownSeconds.value) window.clearInterval(timer)
    }
    update()
    if (cooldownSeconds.value) timer = window.setInterval(update, 250)
  }

  onBeforeUnmount(() => window.clearInterval(timer))
  return { cooldownSeconds, refresh }
}
