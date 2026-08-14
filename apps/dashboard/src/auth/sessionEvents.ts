/**
 * Lets the plain axios client (outside React) notify AuthContext that the current session
 * is no longer valid, without a new auth mechanism — the client emits, AuthContext
 * subscribes and reuses its existing logout path.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitSessionExpired(): void {
  listeners.forEach((listener) => listener());
}
