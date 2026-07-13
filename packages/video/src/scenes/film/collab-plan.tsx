// biome-ignore-all lint/style/noMagicNumbers: collab choreography + layout tuning

import type { Person } from '@repo/domain/workspace';
import { Checkbox } from '@repo/ui/components/checkbox';
import { Cursor } from '@repo/ui/custom/cursor';
import { useEffect } from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { PEOPLE } from '#data/people';

const EASE = Easing.inOut(Easing.cubic);

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

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mt-3 mb-1 font-medium text-[0.7rem] text-muted-foreground uppercase tracking-wide">
      {children}
    </div>
  );
}

function Task({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-start gap-2 text-xs leading-relaxed">
      <Checkbox
        checked={checked}
        readOnly
        tabIndex={-1}
        className="pointer-events-none mt-0.5 size-3.5"
      />
      <span className={checked ? 'text-muted-foreground line-through' : 'text-foreground/80'}>
        {label}
      </span>
    </div>
  );
}

// A presence cursor easing from `from` to `to` (percentages of the brief box)
// across [enter, arrive], then resting — so it reads as a teammate working a line.
function Mate({
  person,
  kind,
  from,
  to,
  enter,
  arrive,
}: {
  person: Person;
  kind: 'human' | 'agent';
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
      <Cursor color={person.color} name={person.name} kind={kind} />
    </div>
  );
}

function Highlight({
  color,
  rect,
  at,
}: {
  color: string;
  rect: { left: number; top: number; width: number; height: number };
  at: number;
}) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [at, at + 12], [0, 0.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      className="absolute rounded-[3px]"
      style={{
        left: `${rect.left}%`,
        top: `${rect.top}%`,
        width: `${rect.width}%`,
        height: `${rect.height}%`,
        backgroundColor: color,
        opacity,
      }}
    />
  );
}

// Frame Maya ticks the last requirement (in the animated, editable state).
const TICK_AT = 52;

export function CollabPlan({
  editable,
  animate = false,
  onText,
  label,
}: {
  editable: boolean;
  // Play the co-writing choreography (cursors travelling, a requirement ticked).
  // Off in the resting collab state and once the brief is handed off (locked).
  animate?: boolean;
  onText?: (text: string) => void;
  label?: string;
}) {
  const frame = useCurrentFrame();
  useEffect(() => {
    onText?.(BRIEF_TEXT);
  }, [onText]);
  // The last requirement gets ticked as it's worked; a handed-off brief shows it done.
  const freshChecked = editable ? animate && frame >= TICK_AT : true;
  const showCursors = editable && animate;
  return (
    <div className="px-3 pb-1">
      <div className="mb-1 font-medium text-[0.7rem] text-muted-foreground uppercase tracking-wide">
        {label ?? (editable ? 'Brief' : 'Plan')}
      </div>
      <div className="relative">
        {showCursors ? (
          <Highlight
            color={PEOPLE.theo.color}
            rect={{ left: 3, top: 14, width: 52, height: 9 }}
            at={58}
          />
        ) : null}
        {showCursors ? (
          <Highlight
            color={PEOPLE.maya.color}
            rect={{ left: 3, top: 63, width: 27, height: 8 }}
            at={46}
          />
        ) : null}
        <div className="space-y-1.5">
          <div className="font-semibold text-sm">Activation dashboard</div>
          <p className="text-foreground/80 text-xs leading-relaxed">
            One view of how new signups convert — weekly signups and activation rate by channel,
            live from the warehouse.
          </p>
          <SectionLabel>Requirements</SectionLabel>
          <Task label="Signups by week, with the week-over-week trend" checked />
          <Task label="Activation rate by acquisition channel" checked />
          <Task label="Keep it fresh from the warehouse on a schedule" checked={freshChecked} />
          <SectionLabel>Done when</SectionLabel>
          <Task
            label="The team sees signups and per-channel activation at a glance"
            checked={false}
          />
        </div>
        {showCursors ? (
          <>
            <Mate
              person={PEOPLE.theo}
              kind="human"
              from={{ x: 86, y: 46 }}
              to={{ x: 32, y: 15 }}
              enter={24}
              arrive={64}
            />
            <Mate
              person={PEOPLE.maya}
              kind="human"
              from={{ x: 74, y: 8 }}
              to={{ x: 12, y: 61 }}
              enter={10}
              arrive={50}
            />
            <Mate
              person={PEOPLE.korde}
              kind="agent"
              from={{ x: 22, y: 92 }}
              to={{ x: 46, y: 80 }}
              enter={40}
              arrive={84}
            />
          </>
        ) : null}
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
