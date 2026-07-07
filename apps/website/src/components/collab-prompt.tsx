// biome-ignore-all lint/style/noMagicNumbers: motion + layout tuning constants
import { CollabDoc, type CollabPresence, type DocBlock } from '@repo/ui/custom/collab-doc';
import { useEffect, useState } from 'react';

// The collaborate composer: the team co-writes the prompt handed to the agent,
// rendered with the product's own CollabDoc primitive — the same component the
// product drives from its realtime layer. The viewer can really select and edit
// the text (nothing is saved), while Maya's and Theo's presence moves over it on
// a looping timeline.

const PROMPT_DOC: DocBlock[] = [
  { kind: 'h1', id: 'title', text: 'Realtime presence in the editor' },
  {
    kind: 'p',
    id: 'intro',
    runs: [
      {
        t: 'text',
        v: 'Let a team edit the same document together and see each other live — presence, cursors, and selections, synced on every keystroke.',
      },
    ],
  },
  { kind: 'h2', id: 'req', text: 'Requirements' },
  {
    kind: 'list',
    id: 'req-list',
    items: [
      { id: 'r-online', text: 'Show who’s online, with avatars and a per-person color' },
      { id: 'r-cursors', text: 'Live cursors with name labels, updated as they move' },
      { id: 'r-sel', text: 'Shared text selections, highlighted per collaborator' },
      { id: 'r-crdt', text: 'Broadcast edits on every keystroke; merge with a CRDT' },
      { id: 'r-reconnect', text: 'Reconnect and resync cleanly after a dropped connection' },
    ],
  },
  { kind: 'h2', id: 'con', text: 'Constraints' },
  {
    kind: 'list',
    id: 'con-list',
    items: [
      { id: 'c-latency', text: 'p95 cursor latency under 80ms on the presence channel' },
      { id: 'c-degrade', text: 'Degrade to a plain “N online” count if a client can’t sync' },
      { id: 'c-deps', text: 'Reuse the existing realtime layer — no new dependencies' },
    ],
  },
  { kind: 'h2', id: 'done', text: 'Done when' },
  {
    kind: 'list',
    id: 'done-list',
    items: [
      { id: 'd-browsers', text: 'Two browsers show each other’s cursors and selections' },
      { id: 'd-clears', text: 'Presence clears within 2s of a tab closing' },
    ],
  },
];

const MAYA = { id: 'maya', name: 'Maya', color: 'var(--chart-3)', kind: 'human' as const };
const THEO = { id: 'theo', name: 'Theo', color: 'var(--chart-4)', kind: 'human' as const };

// A looping presence timeline — cursors hop between real anchors, sometimes
// highlighting a line as a selection, so the draft reads as a live co-edit.
const STEPS: CollabPresence[][] = [
  [
    { ...MAYA, anchor: 'r-cursors', selection: ['r-cursors'] },
    { ...THEO, anchor: 'intro' },
  ],
  [
    { ...MAYA, anchor: 'r-sel' },
    { ...THEO, anchor: 'c-latency', selection: ['c-latency'] },
  ],
  [
    { ...MAYA, anchor: 'title' },
    { ...THEO, anchor: 'd-browsers', selection: ['d-browsers'] },
  ],
  [
    { ...MAYA, anchor: 'r-crdt', selection: ['r-crdt'] },
    { ...THEO, anchor: 'con' },
  ],
];

const STEP_MS = 2200;

export function CollabPrompt() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((prev) => (prev + 1) % STEPS.length), STEP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <div className="mb-1 font-medium text-[0.7rem] text-muted-foreground uppercase tracking-wide">
        New prompt
      </div>
      <div className="h-[15rem] overflow-y-auto">
        <CollabDoc
          contentClassName="max-w-none px-1 py-1"
          doc={PROMPT_DOC}
          editable
          presence={STEPS[step] ?? []}
          size="sm"
        />
      </div>
    </div>
  );
}
