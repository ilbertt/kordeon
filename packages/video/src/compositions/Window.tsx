import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { channelBySlug, HERO_SLUG } from '#data/channels';
import { threadStateAt } from '#lib/thread-timeline';
import { ProductWindow } from '#product-window/product-window';

// Drives the hero thread's reveal from the frame — messages land one at a time
// with the right person shown composing the next, all deterministic.
export function Window() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hero = channelBySlug(HERO_SLUG);
  const { visibleCount, typingId } = threadStateAt({
    messages: hero?.messages ?? [],
    fps,
    frame,
    currentUserId: 'you',
  });

  return (
    <AbsoluteFill className="dark bg-background">
      <ProductWindow activeSlug={HERO_SLUG} visibleCount={visibleCount} typingId={typingId} />
    </AbsoluteFill>
  );
}
