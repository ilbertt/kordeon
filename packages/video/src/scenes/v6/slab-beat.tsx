// biome-ignore-all lint/style/noMagicNumbers: slab framing + pose/caption timing
import type { ReactNode } from 'react';
import { AbsoluteFill, interpolate, Sequence } from 'remotion';
import { KineticCaption } from '#components/kinetic-caption';
import { EASE_IN_OUT } from '#lib/motion';
import type { ProductWindowProps } from '#product-window/product-window';
import { poseAt, type SlabPose, SlabStage } from '#scenes/slab/slab-stage';

// The pose only starts moving once the crossfade is over, so the incoming beat
// holds its start pose for the whole transition. With a continuous float (`phase`)
// and a matching start pose, the outgoing and incoming slabs are identical through
// the crossfade — it dissolves the window into itself, so product cuts don't jump.
export const MOVE_START = 24;

// Each caption is fully gone this many frames before its beat ends: 12 empty frames
// of product, then the 24-frame crossfade runs caption-free. So only one caption is
// ever on screen, with a clear gap across every seam.
const CAPTION_TAIL = 36;

// Frames over which a preview pane crossfades between states instead of hard-swapping
// the whole pane on one frame (which reads as a flash).
const SWAP_FADE = 8;

export const SLAB = {
  wide: { focusX: 960, focusY: 540, scale: 0.72, rotateX: 6, rotateY: 0 },
  chat: { focusX: 800, focusY: 430, scale: 0.96, rotateX: 5, rotateY: 3 },
  composer: { focusX: 770, focusY: 812, scale: 1.04, rotateX: 4, rotateY: 1 },
  handoff: { focusX: 1020, focusY: 560, scale: 0.9, rotateX: 5, rotateY: -4 },
  preview: { focusX: 1720, focusY: 360, scale: 1.06, rotateX: 5, rotateY: -8 },
  pullback: { focusX: 960, focusY: 540, scale: 0.74, rotateX: 6, rotateY: 0 },
} satisfies Record<string, SlabPose>;

// Every product-beat push shares the same start (after the crossfade) and the strong
// on-screen ease-in-out, so only the destination pose and its end frame vary.
export function move({
  from,
  to,
  frame,
  end,
}: {
  from: SlabPose;
  to: SlabPose;
  frame: number;
  end: number;
}): SlabPose {
  return poseAt({ from, to, frame, start: MOVE_START, end, easing: EASE_IN_OUT });
}

// 0 → 1 crossfade weight for a preview state that flips at `at`.
export function swapMix({ frame, at }: { frame: number; at: number }): number {
  return interpolate(frame, [at, at + SWAP_FADE], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

// The establishing "home" push: hold the shared wide slab through the crossfade,
// ease gently into the left channel-list panel, then crane slowly *down* the
// threads before pulling back to wide — so the beat still enters and leaves its
// crossfades on the same wide pose (no seam), while the middle scans the channels.
const HOME_PANEL = {
  top: { focusX: 470, focusY: 400, scale: 0.84, rotateX: 6, rotateY: 4 },
  bottom: { focusX: 470, focusY: 540, scale: 0.92, rotateX: 6, rotateY: 4 },
} satisfies Record<string, SlabPose>;

const HOME_PUSH_END = 60;
const HOME_CRANE_END = 122;
const HOME_RETURN_END = 158;

export function homePanPose(frame: number): SlabPose {
  if (frame < HOME_PUSH_END) {
    return poseAt({
      from: SLAB.wide,
      to: HOME_PANEL.top,
      frame,
      start: MOVE_START,
      end: HOME_PUSH_END,
      easing: EASE_IN_OUT,
    });
  }
  if (frame < HOME_CRANE_END) {
    return poseAt({
      from: HOME_PANEL.top,
      to: HOME_PANEL.bottom,
      frame,
      start: HOME_PUSH_END,
      end: HOME_CRANE_END,
    });
  }
  return poseAt({
    from: HOME_PANEL.bottom,
    to: SLAB.wide,
    frame,
    start: HOME_CRANE_END,
    end: HOME_RETURN_END,
    easing: EASE_IN_OUT,
  });
}

export function SlabBeat({
  pose,
  product,
  phase,
  caption,
  captionStart,
  durationInFrames,
}: {
  pose: SlabPose;
  product: ProductWindowProps;
  phase: number;
  caption: string;
  captionStart: number;
  durationInFrames: number;
}): ReactNode {
  const captionDuration = durationInFrames - captionStart - CAPTION_TAIL;
  return (
    <AbsoluteFill className="dark bg-background">
      <SlabStage pose={pose} product={product} phase={phase} />
      <Sequence from={captionStart} durationInFrames={captionDuration}>
        <KineticCaption text={caption} durationInFrames={captionDuration} />
      </Sequence>
    </AbsoluteFill>
  );
}
