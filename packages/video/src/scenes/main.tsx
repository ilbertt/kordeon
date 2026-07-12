// biome-ignore-all lint/style/noMagicNumbers: camera keyframes + beat timing
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Caption } from '#components/caption';
import { channelBySlug, HERO_SLUG } from '#data/channels';
import { type CameraShot, cameraTransform, lerpShot } from '#lib/camera';
import { threadStateAt } from '#lib/thread-timeline';
import { ProductWindow } from '#product-window/product-window';

const WIDTH = 1920;
const HEIGHT = 1080;

// Named shots over the window's own pixel grid (tuned against rendered stills).
const WIDE: CameraShot = { focusX: 960, focusY: 540, scale: 1.0 };
const CHAT_TOP: CameraShot = { focusX: 730, focusY: 360, scale: 1.16 };
const CHAT_MID: CameraShot = { focusX: 730, focusY: 470, scale: 1.16 };
const PLAN: CameraShot = { focusX: 545, focusY: 515, scale: 1.62 };
const HANDOFF: CameraShot = { focusX: 900, focusY: 540, scale: 1.06 };
const PREVIEW: CameraShot = { focusX: 1744, focusY: 330, scale: 1.66 };

const SEGMENTS = [
  { start: 0, end: 36, from: WIDE, to: CHAT_TOP },
  { start: 36, end: 180, from: CHAT_TOP, to: CHAT_MID },
  { start: 180, end: 300, from: CHAT_MID, to: CHAT_MID },
  { start: 300, end: 340, from: CHAT_MID, to: PLAN },
  { start: 340, end: 470, from: PLAN, to: PLAN },
  { start: 470, end: 540, from: PLAN, to: HANDOFF },
  { start: 540, end: 620, from: HANDOFF, to: HANDOFF },
  { start: 620, end: 680, from: HANDOFF, to: PREVIEW },
  { start: 680, end: 100000, from: PREVIEW, to: PREVIEW },
];

function shotAt(frame: number): CameraShot {
  for (const segment of SEGMENTS) {
    if (frame < segment.end) {
      const t = interpolate(frame, [segment.start, segment.end], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.cubic),
      });
      return lerpShot({ from: segment.from, to: segment.to, t });
    }
  }
  return PREVIEW;
}

// The continuous product-window shot spanning shape → refine → hand off → ship.
// Everything is a pure function of the local frame, so the window stays mounted
// while the camera moves and the state evolves — no cuts inside the loop.
export function Main() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hero = channelBySlug(HERO_SLUG);

  const { visibleCount, typingId } = threadStateAt({
    messages: hero?.messages ?? [],
    fps,
    frame,
    currentUserId: 'you',
  });

  const planDone = Math.round(
    interpolate(frame, [540, 720], [2, 4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
  );
  const previewReveal = interpolate(frame, [660, 860], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const previewState = frame < 470 ? 'placeholder' : frame < 660 ? 'building' : 'dashboard';

  const shot = shotAt(frame);

  return (
    <AbsoluteFill className="dark overflow-hidden bg-background">
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          transformOrigin: '0 0',
          transform: cameraTransform({ shot, width: WIDTH, height: HEIGHT }),
        }}
      >
        <ProductWindow
          activeSlug={HERO_SLUG}
          visibleCount={visibleCount}
          typingId={typingId}
          planDone={planDone}
          previewState={previewState}
          previewReveal={previewReveal}
        />
      </div>

      <Sequence from={8} durationInFrames={150}>
        <Caption durationInFrames={150}>
          Your team and your agent talk through the work — in one thread
        </Caption>
      </Sequence>
      <Sequence from={170} durationInFrames={130}>
        <Caption durationInFrames={130}>
          @mention the agent like any teammate — it replies, it has a face
        </Caption>
      </Sequence>
      <Sequence from={312} durationInFrames={150}>
        <Caption durationInFrames={150}>Shape the plan together before anything runs</Caption>
      </Sequence>
      <Sequence from={474} durationInFrames={150}>
        <Caption durationInFrames={150}>Hand it off — the agent builds it and opens a PR</Caption>
      </Sequence>
      <Sequence from={636} durationInFrames={200}>
        <Caption durationInFrames={200}>
          The running product renders live, right beside the chat
        </Caption>
      </Sequence>
    </AbsoluteFill>
  );
}
