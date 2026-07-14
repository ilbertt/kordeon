// biome-ignore-all lint/style/noMagicNumbers: collab choreography + layout tuning

import type { Person } from '@repo/domain/workspace';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Cursor } from '@repo/ui/custom/cursor';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { PEOPLE } from '#data/people';

const EASE = Easing.inOut(Easing.cubic);

// Where each teammate's presence cursor comes to rest once the plan is worked —
// percentages of the brief box. Shared so the hand-off beat can seat the same
// cursors at these exact spots, letting the plan→hand-off crossfade blend
// cursor→cursor instead of popping them away.
export const REST = {
  theo: { x: 40, y: 15 },
  maya: { x: 14, y: 61 },
  ada: { x: 44, y: 82 },
} as const;

// The brief the team co-writes with Korde — the content of the collaborate
// composer (`compose: 'collab'`), mirroring the product's PromptEditor. It's a
// frame-driven port: the real editor is tiptap and its presence cursors run on a
// RAF/timer choreography, neither of which renders in a per-frame Remotion seek.
// So the plan is never a message Korde "sends" — it's this shared, co-edited brief.
const BRIEF_TEXT = [
  'Activation dashboard',
  'One view of how new signups convert — weekly signups and activation rate by channel, live from the warehouse.',
  'Requirements: signups by week with the week-over-week trend; activation rate by acquisition channel; keep it fresh from the warehouse on a schedule.',
  'Done when the team sees signups and per-channel activation at a glance.',
].join(' ');

// A teammate's highlight — an inline background *on the text itself*, so it always
// tracks the words (percentage-positioned rects drift off as the text reflows).
// `box-decoration-clone` keeps it correct across a line wrap; the colour's alpha
// ramps in via `color-mix` so the text underneath never fades.
function Mark({
  children,
  color,
  at,
  on,
}: {
  children: ReactNode;
  color: string;
  at: number;
  on: boolean;
}) {
  const frame = useCurrentFrame();
  const pct = on
    ? interpolate(frame, [at, at + 12], [0, 24], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;
  return (
    <span
      className="box-decoration-clone rounded-[3px] px-0.5"
      style={{ backgroundColor: `color-mix(in srgb, ${color} ${pct}%, transparent)` }}
    >
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mt-3 mb-1 font-medium text-[0.7rem] text-muted-foreground uppercase tracking-wide">
      {children}
    </div>
  );
}

function Task({
  label,
  checked,
  mark,
}: {
  label: string;
  checked: boolean;
  mark?: { color: string; at: number; on: boolean };
}) {
  return (
    <div className="flex items-start gap-2 text-xs leading-relaxed">
      <Checkbox
        checked={checked}
        readOnly
        tabIndex={-1}
        className="pointer-events-none mt-0.5 size-3.5"
      />
      <span className={checked ? 'text-muted-foreground line-through' : 'text-foreground/80'}>
        {mark ? (
          <Mark color={mark.color} at={mark.at} on={mark.on}>
            {label}
          </Mark>
        ) : (
          label
        )}
      </span>
    </div>
  );
}

// A presence cursor easing from `from` to `to` (percentages of the brief box)
// across [enter, arrive], then resting — so it reads as a teammate working a line.
function Mate({
  person,
  from,
  to,
  enter,
  arrive,
}: {
  person: Person;
  from: { x: number; y: number };
  to: { x: number; y: number };
  enter: number;
  arrive: number;
}) {
  const frame = useCurrentFrame();
  const range = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE } as const;
  const left = interpolate(frame, [enter, arrive], [from.x, to.x], range);
  const top = interpolate(frame, [enter, arrive], [from.y, to.y], range);
  return (
    <div className="absolute z-20" style={{ left: `${left}%`, top: `${top}%` }}>
      <Cursor color={person.color} name={person.name} kind="human" />
    </div>
  );
}

// Frame Maya ticks the last requirement (in the animated, editable state).
const TICK_AT = 52;

export function CollabPlan({
  editable,
  animate = false,
  onText,
  label,
  overlay,
}: {
  editable: boolean;
  // Play the co-writing choreography (cursors travelling, a requirement ticked).
  // Off in the resting collab state and once the brief is handed off (locked).
  animate?: boolean;
  onText?: (text: string) => void;
  label?: string;
  // Extra cursor layer drawn inside the brief box (same %-of-box space as the
  // co-writing cursors) — the hand-off beat seats resting teammates + the You
  // cursor here so they align with, and take over from, the plan choreography.
  overlay?: ReactNode;
}) {
  const frame = useCurrentFrame();
  useEffect(() => {
    onText?.(BRIEF_TEXT);
  }, [onText]);
  // The last requirement gets ticked as it's worked; a handed-off brief shows it done.
  const freshChecked = editable ? animate && frame >= TICK_AT : true;
  const on = editable && animate;
  return (
    <div className="px-3 pb-1">
      <div className="mb-1 font-medium text-[0.7rem] text-muted-foreground uppercase tracking-wide">
        {label ?? (editable ? 'Brief' : 'Plan')}
      </div>
      <div className="relative">
        <div className="space-y-1.5">
          <div className="font-semibold text-sm">Activation dashboard</div>
          <p className="text-foreground/80 text-xs leading-relaxed">
            One view of how new signups convert —{' '}
            <Mark color={PEOPLE.theo.color} at={58} on={on}>
              weekly signups and activation rate by channel
            </Mark>
            , live from the warehouse.
          </p>
          <SectionLabel>Requirements</SectionLabel>
          <Task label="Signups by week, with the week-over-week trend" checked />
          <Task label="Activation rate by acquisition channel" checked />
          <Task
            label="Keep it fresh from the warehouse on a schedule"
            checked={freshChecked}
            mark={{ color: PEOPLE.maya.color, at: 46, on }}
          />
          <SectionLabel>Done when</SectionLabel>
          <Task
            label="The team sees signups and per-channel activation at a glance"
            checked={false}
            mark={{ color: PEOPLE.ada.color, at: 74, on }}
          />
        </div>
        {on ? (
          <>
            <Mate
              person={PEOPLE.theo}
              from={{ x: 86, y: 46 }}
              to={REST.theo}
              enter={24}
              arrive={64}
            />
            <Mate
              person={PEOPLE.maya}
              from={{ x: 74, y: 8 }}
              to={REST.maya}
              enter={10}
              arrive={50}
            />
            <Mate
              person={PEOPLE.ada}
              from={{ x: 20, y: 92 }}
              to={REST.ada}
              enter={44}
              arrive={86}
            />
          </>
        ) : null}
        {overlay}
      </div>
    </div>
  );
}

// Render-prop factory for ProductWindow's composer slot: `animate` turns on the
// co-writing choreography (the beat that focuses the plan); elsewhere it rests.
export function collabPlanPrompt(animate: boolean) {
  return ({
    editable,
    onText,
    label,
  }: {
    editable: boolean;
    onText: (text: string) => void;
    label?: string;
  }) => <CollabPlan editable={editable} animate={animate} onText={onText} label={label} />;
}
