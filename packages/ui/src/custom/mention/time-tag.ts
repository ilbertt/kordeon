import type { MentionTagData, TimeTagValue } from '@repo/domain/workspace';
import { formatInZone, zonedToInstant } from './dates';

// Builds a time tag from a wall-clock value: the pill shows the *reader's* local
// time, the tooltip the source time + zone. Centralised so inserting a date,
// editing a chip in place, and re-rendering a sent chip in the reader's timezone
// (see MentionTag) all produce the same tag.
export function timeTagFromValue(value: TimeTagValue): MentionTagData {
  const instant = zonedToInstant(value);
  return {
    kind: 'time',
    token: formatInZone({ instant }),
    tooltip: `${formatInZone({ instant, timeZone: value.timeZone })} — shown in your time`,
    date: value,
  };
}
