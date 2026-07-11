import { useSyncExternalStore } from 'react';

// The visitor's waitlist email, persisted to localStorage so it survives reloads.
// Shared across the product window — the threads capture it on send, and the
// sidebar identity reads it back. Modeled as a module-level store (like the
// dynamic-channel registry) so every component sees the same value without a
// provider. `useSyncExternalStore` keeps it SSR-safe: the prerender renders as
// if there's no email, and the client re-reads after mount, so there's no
// hydration mismatch.
const STORAGE_KEY = 'kordeon:visitor-email';
const listeners = new Set<() => void>();

function getSnapshot(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function useVisitorEmail(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setVisitorEmail(email: string): void {
  window.localStorage.setItem(STORAGE_KEY, email);
  for (const listener of listeners) {
    listener();
  }
}
