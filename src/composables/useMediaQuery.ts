import { onBeforeUnmount, onMounted, readonly, ref } from 'vue'

export function useMediaQuery(query: string) {
  const matches = ref(false)
  let mediaQuery: MediaQueryList | null = null

  function updateMatches() {
    matches.value = mediaQuery?.matches ?? false
  }

  if (typeof window !== 'undefined') {
    mediaQuery = window.matchMedia(query)
    updateMatches()
  }

  onMounted(() => {
    mediaQuery ??= window.matchMedia(query)
    updateMatches()
    mediaQuery.addEventListener('change', updateMatches)
  })

  onBeforeUnmount(() => mediaQuery?.removeEventListener('change', updateMatches))

  return { matches: readonly(matches) }
}
