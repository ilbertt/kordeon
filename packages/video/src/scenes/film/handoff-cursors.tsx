// biome-ignore-all lint/style/noMagicNumbers: cursor choreography + layout tuning

import type { Person } from '@repo/domain/workspace';
import { Cursor } from '@repo/ui/custom/cursor';
import type { ReactNode } from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { PEOPLE } from '#data/people';
import { EASE_OUT } from '#lib/motion';
import { CollabPlan, REST } from '#scenes/film/collab-plan';

// The Build button in the composer footer, expressed in the same %-of-brief-box
// space the teammate cursors use (tuned against stills). The You cursor drives to
// this spot and presses it — the real compose/preview state flip is the result.
const BUILD = { x: 93, y: 107 };

// Where the You cursor starts before it reaches for Build — inside the brief box,
// so it travels down-right onto the button.
const YOU_FROM = { x: 46, y: 56 };

// A short press dip on the click (never scales from 0; ~0.95 per the standards).
const PRESS_SCALE = 0.95;
const PRESS_RELEASE = 4;

// Timings are beat-local frames; `click` is aligned to the beat's state swap so
// the button changing to "Building" (and the preview crossfading) reads as the
// direct result of the press.
export type HandoffSpec = {
  travelStart: number;
  arrive: number;
  click: number;
  fadeStart: number;
  fadeSpan: number;
};

function RestCursor({ person, at }: { person: Person; at: { x: number; y: number } }) {
  return (
    <div className="absolute z-20" style={{ left: `${at.x}%`, top: `${at.y}%` }}>
      <Cursor color={person.color} name={person.name} kind="human" />
    </div>
  );
}

function YouCursor({ spec }: { spec: HandoffSpec }) {
  const frame = useCurrentFrame();
  const range = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT } as const;
  const left = interpolate(frame, [spec.travelStart, spec.arrive], [YOU_FROM.x, BUILD.x], range);
  const top = interpolate(frame, [spec.travelStart, spec.arrive], [YOU_FROM.y, BUILD.y], range);
  const press = interpolate(
    frame,
    [spec.arrive, spec.click, spec.click + PRESS_RELEASE],
    [1, PRESS_SCALE, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  return (
    <div className="absolute z-30" style={{ left: `${left}%`, top: `${top}%` }}>
      <div style={{ transformOrigin: 'top left', transform: `scale(${press})` }}>
        <Cursor color={PEOPLE.you.color} name={PEOPLE.you.name} kind="human" />
      </div>
    </div>
  );
}

// The hand-off cursor layer: the three teammates seated where the plan left them
// plus the You cursor pressing Build, all fading out together once the press lands.
export function HandoffCursors({ spec }: { spec: HandoffSpec }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [spec.fadeStart, spec.fadeStart + spec.fadeSpan], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{ opacity }}>
      <RestCursor person={PEOPLE.theo} at={REST.theo} />
      <RestCursor person={PEOPLE.maya} at={REST.maya} />
      <RestCursor person={PEOPLE.ada} at={REST.ada} />
      <YouCursor spec={spec} />
    </div>
  );
}

// Render-prop factory for the hand-off beat: the resting brief with the click
// choreography seated in its box (the plan animation itself is off here).
export function handoffPlanPrompt(spec: HandoffSpec) {
  return ({
    editable,
    onText,
    label,
  }: {
    editable: boolean;
    onText: (text: string) => void;
    label?: string;
  }): ReactNode => (
    <CollabPlan
      editable={editable}
      animate={false}
      onText={onText}
      label={label}
      overlay={<HandoffCursors spec={spec} />}
    />
  );
}
