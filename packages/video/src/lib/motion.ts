// biome-ignore-all lint/style/noMagicNumbers: easing curves + pacing tuning
import { Easing } from 'remotion';

// The product's own expo ease — reused for container settles and caption holds so
// the film's motion matches the app's motion language.
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// Strong curves from the animation-review standards: a punchy ease-out for
// entrances/exits (starts fast, feels responsive) and a decisive ease-in-out for
// things moving/morphing on screen (the slab pushes). Stronger than the built-ins.
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

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
