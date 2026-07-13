// biome-ignore-all lint/style/noMagicNumbers: camera keyframes + pacing tuning
import { Easing, interpolate } from 'remotion';
import { type CameraShot, lerpShot } from '#lib/camera';

// The product's own expo ease — reused for container settles and caption holds so
// the film's motion matches the app's motion language.
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// Strong curves from the animation-review standards: a punchy ease-out for
// entrances/exits (starts fast, feels responsive) and a decisive ease-in-out for
// things moving/morphing on screen (the slab pushes). Stronger than the built-ins.
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

// Named camera shots over the window's 1920×1080 pixel grid, each a single clear
// focal point for a beat. Values are the ones tuned against rendered stills of the
// same ProductWindow in `scenes/main.tsx` — reused so they stay honest.
export const SHOTS = {
  wide: { focusX: 960, focusY: 540, scale: 1.0 },
  chatTop: { focusX: 730, focusY: 360, scale: 1.16 },
  chatMid: { focusX: 730, focusY: 470, scale: 1.16 },
  // The collaborate composer sits at the bottom of the chat panel — this frames
  // the co-written brief where the team + Korde work it.
  composer: { focusX: 720, focusY: 858, scale: 1.34 },
  handoff: { focusX: 900, focusY: 560, scale: 1.06 },
  preview: { focusX: 1744, focusY: 330, scale: 1.66 },
  pullback: { focusX: 960, focusY: 540, scale: 1.0 },
} satisfies Record<string, CameraShot>;

// An eased push from one shot to another over [start, end], clamped outside.
export function pushShot({
  from,
  to,
  frame,
  start,
  end,
  easing = Easing.inOut(Easing.cubic),
}: {
  from: CameraShot;
  to: CameraShot;
  frame: number;
  start: number;
  end: number;
  easing?: (t: number) => number;
}): CameraShot {
  const t = interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });
  return lerpShot({ from, to, t });
}

// A frame-addressable reveal schedule: the latest step whose `at` has passed sets
// how many messages are visible and who is shown composing the next. Lets each
// beat continue the thread exactly where the previous beat left it (the typing row
// even carries across a transition), so the reveal never restarts on a cut.
export type RevealStep = { at: number; count: number; typing?: string };

export function stagedReveal({ steps, frame }: { steps: RevealStep[]; frame: number }): {
  visibleCount: number;
  typingId?: string;
} {
  let current = steps[0];
  for (const step of steps) {
    if (frame >= step.at) {
      current = step;
    }
  }
  if (!current) {
    return { visibleCount: 0 };
  }
  return { visibleCount: current.count, typingId: current.typing };
}
