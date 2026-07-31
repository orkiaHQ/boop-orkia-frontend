import { GraphQLClient } from 'graphql-request'

const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT ?? '/api/graphql'

/** GraphQL transport; inject auth in one place when the real API is connected. */
export const gql = new GraphQLClient(endpoint)

export type SyncMessage<T = unknown> = { type: string; entity: string; payload: T }

/**
 * A deliberately small persistent cache boundary. It is transport-agnostic, so
 * optimistic writes remain available offline and a WebSocket event can later
 * reconcile the same entity without coupling UI components to a data vendor.
 */
export function createPersistentCache(namespace = 'riftr-cache') {
  const key = (name: string) => `${namespace}:${name}`
  return {
    read<T>(name: string, fallback: T): T {
      try { return JSON.parse(localStorage.getItem(key(name)) ?? '') as T } catch { return fallback }
    },
    write<T>(name: string, value: T) { localStorage.setItem(key(name), JSON.stringify(value)) },
    remove(name: string) { localStorage.removeItem(key(name)) },
  }
}

/** Connect only when a VITE_SYNC_WS_URL is configured. */
export function connectWorkspaceSync(onMessage: (message: SyncMessage) => void) {
  const url = import.meta.env.VITE_SYNC_WS_URL
  if (!url) return () => undefined
  const socket = new WebSocket(url)
  socket.addEventListener('message', event => {
    try { onMessage(JSON.parse(event.data) as SyncMessage) } catch { /* Ignore malformed events. */ }
  })
  return () => socket.close()
}
