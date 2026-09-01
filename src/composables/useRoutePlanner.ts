import { ref } from 'vue'
import type { Coordinates } from '@/domain/geo'
import type { RoutePlan, RouteState } from '@/domain/route'
import { findLocation } from '@/services/geocoding'
import { getDrivingRoute } from '@/services/mapboxDirections'

export function useRoutePlanner() {
  const destinationQuery = ref('')
  const route = ref<RoutePlan | null>(null)
  const state = ref<RouteState>('idle')
  const message = ref('Saisissez une destination pour préparer votre trajet.')

  async function planRoute(origin: Coordinates) {
    const destinationLabel = destinationQuery.value.trim()
    if (!destinationLabel) {
      state.value = 'error'
      message.value = 'Indiquez une destination avant de calculer l’itinéraire.'
      return
    }

    state.value = 'loading'
    message.value = 'Calcul de l’itinéraire…'
    try {
      const destination = await findLocation(destinationLabel)
      route.value = await getDrivingRoute(origin, destination, destinationLabel)
      state.value = 'ready'
      message.value = 'Itinéraire prêt.'
    } catch (error) {
      state.value = 'error'
      message.value = error instanceof Error ? error.message : 'Impossible de calculer cet itinéraire.'
    }
  }

  function setError(error: unknown) {
    state.value = 'error'
    message.value = error instanceof Error ? error.message : 'Votre position est indisponible.'
  }

  function clearRoute() {
    route.value = null
    state.value = 'idle'
    message.value = 'Saisissez une destination pour préparer votre trajet.'
  }

  return { destinationQuery, route, state, message, planRoute, setError, clearRoute }
}
