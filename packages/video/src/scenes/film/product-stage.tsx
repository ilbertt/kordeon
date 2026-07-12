import { AbsoluteFill, Interactive, useVideoConfig } from 'remotion';
import { type CameraShot, cameraTransform } from '#lib/camera';
import { ProductWindow, type ProductWindowProps } from '#product-window/product-window';

// A subtle 3D pose for the window: a forward tilt that settles, a gentle yaw for
// depth, a lift, and a scale — driven by the caller from the frame.
export type StageTilt = {
  rotateX: number;
  rotateY: number;
  lift: number;
  scale: number;
  opacity?: number;
};

// Mounts the real ProductWindow inside a window-space camera (translate + scale
// over the composition's own 1920×1080 grid), with an optional 3D tilt on the
// window and an optional dim scrim for text-over-window beats. Every product beat
// renders through this, so the window stays pixel-identical as the camera moves.
export function ProductStage({
  shot,
  product,
  tilt,
  dim,
}: {
  shot: CameraShot;
  product: ProductWindowProps;
  tilt?: StageTilt;
  dim?: number;
}) {
  const { width, height } = useVideoConfig();
  const camera = cameraTransform({ shot, width, height });
  const tiltTransform = tilt
    ? `perspective(1800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateY(${tilt.lift}px) scale(${tilt.scale})`
    : undefined;
  return (
    <AbsoluteFill className="dark overflow-hidden bg-background">
      <Interactive.Div
        name="Camera"
        style={{
          width,
          height,
          transformOrigin: '0 0',
          translate: camera.translate,
          scale: camera.scale,
        }}
      >
        <div
          style={{
            width,
            height,
            transform: tiltTransform,
            transformOrigin: 'center center',
            opacity: tilt?.opacity ?? 1,
          }}
        >
          <ProductWindow {...product} />
        </div>
      </Interactive.Div>
      {dim ? <AbsoluteFill style={{ backgroundColor: `rgba(0, 0, 0, ${dim})` }} /> : null}
    </AbsoluteFill>
  );
}
