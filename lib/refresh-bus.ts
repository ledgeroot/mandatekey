"use client";

const REFRESH_EVENT = "mandatekey:refresh";

/**
 * Ask every polling view to re-read its data right now.
 *
 * Polling alone is enough for receipts to appear as an agent spends, but an
 * action taken in the dashboard has to be visible the moment it lands — the
 * kill switch revoking every mandate is the whole point of the demo, and it
 * cannot wait for the next tick.
 */
export function requestRefresh(): void {
  window.dispatchEvent(new Event(REFRESH_EVENT));
}

/** Run `handler` on every refresh request. Returns an unsubscribe. */
export function onRefreshRequest(handler: () => void): () => void {
  window.addEventListener(REFRESH_EVENT, handler);
  return () => window.removeEventListener(REFRESH_EVENT, handler);
}
