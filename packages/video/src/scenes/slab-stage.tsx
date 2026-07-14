// biome-ignore-all lint/style/noMagicNumbers: slab framing + float tuning
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import type { ProductWindowProps } from '#product-window/product-window';
import { ProductWindow } from '#product-window/product-window';

const FRAME_W = 1920;
const FRAME_H = 1080;
const PERSPECTIVE = 2200;

// A slab pose over the window's own pixel grid: bring the point (focusX, focusY)
// toward the frame centre, sized by `scale`, tilted by rotateX/rotateY. Unlike the
// crop camera, `scale` stays < 1 so the whole slab stays framed — it's an object
// in space, not a plane the frame cuts into.
export type SlabPose = {
  focusX: number;
  focusY: number;
  scale: number;
  rotateX: number;
  rotateY: number;
};

function mix({ from, to, t }: { from: number; to: number; t: number }): number {
  return from + (to - from) * t;
}

// An eased move between poses over [start, end].
export function poseAt({
  from,
  to,
  frame,
  start,
  end,
  easing = Easing.inOut(Easing.cubic),
}: {
  from: SlabPose;
  to: SlabPose;
  frame: number;
  start: number;
  end: number;
  easing?: (t: number) => number;
}): SlabPose {
  const t = interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });
  return {
    focusX: mix({ from: from.focusX, to: to.focusX, t }),
    focusY: mix({ from: from.focusY, to: to.focusY, t }),
    scale: mix({ from: from.scale, to: to.scale, t }),
    rotateX: mix({ from: from.rotateX, to: to.rotateX, t }),
    rotateY: mix({ from: from.rotateY, to: to.rotateY, t }),
  };
}

// A slow, layered drift so the slab feels like it's floating, not sitting still.
function floatAt(frame: number) {
  return {
    ry: Math.sin(frame / 88) * 2.2,
    rx: Math.sin(frame / 116 + 1.3) * 1.1,
    y: Math.sin(frame / 72) * 6,
    breath: Math.sin(frame / 132) * 0.005,
  };
}

// Presents the real ProductWindow as a rounded, shadowed, perspective-tilted slab
// floating on the dark background. The pose positions/sizes it; the float adds a
// continuous drift on top. `phase` offsets the float onto the global timeline so
// the drift stays continuous across a cut (a beat's local frame resets to 0, which
// would otherwise snap the slab's tilt at every scene boundary).
export function SlabStage({
  pose,
  product,
  phase = 0,
}: {
  pose: SlabPose;
  product: ProductWindowProps;
  phase?: number;
}) {
  const frame = useCurrentFrame();
  const drift = floatAt(frame + phase);
  const x = (FRAME_W / 2 - pose.focusX) * pose.scale;
  const y = (FRAME_H / 2 - pose.focusY) * pose.scale + drift.y;
  const scale = pose.scale + drift.breath;
  return (
    <div
      className="dark h-full w-full overflow-hidden bg-background"
      style={{ perspective: `${PERSPECTIVE}px` }}
    >
      <div
        style={{
          position: 'absolute',
          width: FRAME_W,
          height: FRAME_H,
          transformOrigin: 'center center',
          transform: `translate(${x}px, ${y}px) scale(${scale}) rotateX(${pose.rotateX + drift.rx}deg) rotateY(${pose.rotateY + drift.ry}deg)`,
          borderRadius: 22,
          overflow: 'hidden',
          boxShadow: '0 60px 140px -30px rgba(0, 0, 0, 0.8)',
          outline: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        <ProductWindow {...product} />
      </div>
    </div>
  );
}
