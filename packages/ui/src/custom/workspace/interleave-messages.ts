import type { Message } from '@repo/domain/workspace';

// A visitor-sent message (or its reply) tagged with how many seeded messages had
// been revealed when it landed — its slot in the playback timeline.
export type AnchoredMessage = Message & { anchor: number };

export type RenderedMessage = { message: Message; isSent: boolean };

// Interleaves the seeded stream with visitor-sent messages by where they landed:
// a message anchored at `k` slots in after the first `k` revealed seeded
// messages, so later-revealing ones render *below* it instead of always trailing
// the seeded block. Anchors are non-decreasing across the sent list (the reveal
// count only grows), so a single pass interleaves cleanly.
export function interleaveMessages({
  seeded,
  sent,
  revealCount,
}: {
  seeded: Message[];
  sent: AnchoredMessage[];
  revealCount: number;
}): RenderedMessage[] {
  const revealed = seeded.slice(0, revealCount);
  const items: RenderedMessage[] = [];
  let si = 0;
  for (let i = 0; i < revealed.length; i++) {
    let current = sent[si];
    while (current && current.anchor === i) {
      items.push({ message: current, isSent: true });
      si++;
      current = sent[si];
    }
    const revealedMessage = revealed[i];
    if (revealedMessage) {
      items.push({ message: revealedMessage, isSent: false });
    }
  }
  let tail = sent[si];
  while (tail) {
    items.push({ message: tail, isSent: true });
    si++;
    tail = sent[si];
  }
  return items;
}
