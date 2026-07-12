// A camera shot over the composition's own pixel grid ("window space"): place the
// point (focusX, focusY) at the viewport centre, scaled by `scale`. Lets the film
// push into a single panel of an otherwise-dense product UI, so each beat has one
// clear focal point (video is watched from the whole frame, not read up close).
export type CameraShot = { focusX: number; focusY: number; scale: number };

export function cameraTransform({
  shot,
  width,
  height,
}: {
  shot: CameraShot;
  width: number;
  height: number;
}): string {
  const tx = width / 2 - shot.focusX * shot.scale;
  const ty = height / 2 - shot.focusY * shot.scale;
  return `translate(${tx}px, ${ty}px) scale(${shot.scale})`;
}

export function lerpShot({
  from,
  to,
  t,
}: {
  from: CameraShot;
  to: CameraShot;
  t: number;
}): CameraShot {
  return {
    focusX: from.focusX + (to.focusX - from.focusX) * t,
    focusY: from.focusY + (to.focusY - from.focusY) * t,
    scale: from.scale + (to.scale - from.scale) * t,
  };
}
