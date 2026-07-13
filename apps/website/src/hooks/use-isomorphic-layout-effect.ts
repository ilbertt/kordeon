import { useEffect, useLayoutEffect } from 'react';

// `useLayoutEffect` writes the hero's initial frame styles before the browser
// paints, so the mobile slide-up starts already peeking from the bottom instead
// of flashing invisible-then-visible. It's a no-op during the homepage prerender
// (and React warns there), so fall back to `useEffect` on the server.
export const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;
