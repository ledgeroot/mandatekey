"use client";

import { useEffect, useState } from "react";

const SELECT_EVENT = "mandatekey:select-mandate";

/**
 * Which mandate is being traced, shared by the two panels.
 *
 * The authorization list and the timeline are siblings under a server
 * component, so neither holds state the other can read. A module-level value
 * plus an event keeps them in step without turning the page into a client
 * component — the same shape as `refresh-bus`.
 *
 * `null` means "nothing selected", which is a state distinct from any mandate:
 * every mandate has an id.
 */
let selected: string | null = null;

/** Trace `id`, or pass `null` to stop tracing. */
function setSelectedMandate(id: string | null): void {
  if (id === selected) return;
  selected = id;
  window.dispatchEvent(new Event(SELECT_EVENT));
}

/** The id currently being traced, re-rendering the caller whenever it changes. */
export function useSelectedMandate(): string | null {
  const [value, setValue] = useState<string | null>(selected);
  useEffect(() => {
    const handler = () => setValue(selected);
    window.addEventListener(SELECT_EVENT, handler);
    // A selection made between this component's render and its effect would
    // otherwise be missed until the next event.
    handler();
    return () => window.removeEventListener(SELECT_EVENT, handler);
  }, []);
  return value;
}

/** Select `id`, or clear the selection when it is already selected. */
export function toggleSelectedMandate(id: string): void {
  setSelectedMandate(selected === id ? null : id);
}
