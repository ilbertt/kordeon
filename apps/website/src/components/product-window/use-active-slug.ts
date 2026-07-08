import { useSyncExternalStore } from 'react';
import { type ChannelSlug, channelBySlug, DEFAULT_SLUG } from './data';

// On load, a URL that deep-links to a real section (e.g. `#refine-the-plan`)
// should present the product already full at that section, skipping the
// scroll-in intro. A missing or unknown hash keeps the intro. Module-scope so
// its identity is stable — ScrollStage runs it once on mount.
export function hasSectionHash(): boolean {
  return channelBySlug(window.location.hash.slice(1)) !== undefined;
}

function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

// The active feature is derived from `location.hash`. `useSyncExternalStore` is
// the SSR-safe way to read it: the prerender/hydration pass uses the default and
// the client re-reads after mount, so there's no hydration mismatch. TanStack
// Router has no type-safe hash validation, so `ChannelSlug` is what keeps the
// fragment type-safe end to end.
export function useActiveSlug(): ChannelSlug {
  return useSyncExternalStore(
    subscribeToHash,
    () => channelBySlug(window.location.hash.slice(1))?.slug ?? DEFAULT_SLUG,
    () => DEFAULT_SLUG,
  );
}
