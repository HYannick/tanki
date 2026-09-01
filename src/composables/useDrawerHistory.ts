import { onBeforeUnmount, onMounted, ref } from 'vue'

const PANEL_QUERY_KEY = 'panel'

/** Makes a transient drawer behave like a navigation screen for browser and Android Back. */
export function useDrawerHistory(name: string) {
  const isOpen = ref(false)
  let ownsHistoryEntry = false
  let closingWithHistory = false

  function urlFor(open: boolean) {
    const url = new URL(window.location.href)
    if (open) url.searchParams.set(PANEL_QUERY_KEY, name)
    else url.searchParams.delete(PANEL_QUERY_KEY)
    return `${url.pathname}${url.search}${url.hash}`
  }
  function isDrawerUrl() { return new URL(window.location.href).searchParams.get(PANEL_QUERY_KEY) === name }
  function syncFromHistory() { isOpen.value = isDrawerUrl(); ownsHistoryEntry = false; closingWithHistory = false }
  function open() {
    if (isOpen.value) return
    window.history.pushState({ ...window.history.state, tankiDrawer: name }, '', urlFor(true))
    ownsHistoryEntry = true
    closingWithHistory = false
    isOpen.value = true
  }
  function close() {
    if (!isOpen.value || closingWithHistory) return
    if (ownsHistoryEntry && isDrawerUrl()) {
      closingWithHistory = true
      window.history.back()
      return
    }
    window.history.replaceState(window.history.state, '', urlFor(false))
    isOpen.value = false
  }

  onMounted(() => {
    syncFromHistory()
    window.addEventListener('popstate', syncFromHistory)
  })
  onBeforeUnmount(() => window.removeEventListener('popstate', syncFromHistory))

  return { isOpen, open, close }
}
