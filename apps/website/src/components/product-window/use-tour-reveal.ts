import type { PlaybackOverride } from '@repo/ui/custom/workspace/use-thread-playback';
import { useSyncExternalStore } from 'react';
import { ChannelSlug, channelBySlug } from './data';

// The scroll-driven tour plays *inside* the real product's `#welcome` thread: the
// window that forms around it IS the product window (clipped small), so there's one
// chat, no crossfade. `LogoMorphStage` writes how many messages have arrived (and who's
// typing) here from its scroll loop; the product's welcome `Thread` reads it as its
// playback override. SSR and the pre-mount client fall back to the whole thread, so the
// crawlable HTML stays complete until the tour takes over.
const WELCOME_TOTAL = channelBySlug(ChannelSlug.Welcome)?.messages.length ?? 0;
const FULL: PlaybackOverride = { count: WELCOME_TOTAL, typingIds: [] };

let current: PlaybackOverride = FULL;
const listeners = new Set<() => void>();

export function setTourReveal(next: PlaybackOverride): void {
  const sameTyping = next.typingIds.join(',') === current.typingIds.join(',');
  if (next.count === current.count && sameTyping) {
    return;
  }
  current = next;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function useTourReveal(): PlaybackOverride {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => FULL,
  );
}
