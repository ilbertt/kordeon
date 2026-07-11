// biome-ignore-all lint/style/noMagicNumbers: date/offset math
// Timezone-aware date helpers. Conversion is derived from the Intl formatter, so
// DST is handled without pulling in a date library.

export const TIME_ZONES: string[] =
  typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : [
        'UTC',
        'America/New_York',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Rome',
        'Asia/Tokyo',
      ];

export function systemTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

type WallClock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function wallClockFromParts(parts: Intl.DateTimeFormatPart[]): WallClock {
  const at: Partial<Record<Intl.DateTimeFormatPartTypes, number>> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      at[part.type] = Number(part.value);
    }
  }
  return {
    year: at.year ?? 0,
    month: at.month ?? 1,
    day: at.day ?? 1,
    hour: at.hour ?? 0,
    minute: at.minute ?? 0,
    second: at.second ?? 0,
  };
}

function parseWallClock({ date, time }: { date: string; time: string }): WallClock {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  return { year, month, day, hour, minute, second: 0 };
}

// A UTC timestamp (ms) for a wall clock read as if it were already UTC.
function wallClockToUtc(clock: WallClock): number {
  return Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute, clock.second);
}

function zoneOffset({ instant, timeZone }: { instant: Date; timeZone: string }): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  return wallClockToUtc(wallClockFromParts(parts)) - instant.getTime();
}

export function zonedToInstant({
  date,
  time,
  timeZone,
}: {
  date: string;
  time: string;
  timeZone: string;
}): Date {
  const naiveUtc = wallClockToUtc(parseWallClock({ date, time }));
  return new Date(naiveUtc - zoneOffset({ instant: new Date(naiveUtc), timeZone }));
}

// The inverse of zonedToInstant: a wall-clock {date,time} in a zone, from an
// instant. Drives the calendar grid back into the source-of-truth strings when a
// day is picked.
export function zonedFromInstant({ instant, timeZone }: { instant: Date; timeZone: string }): {
  date: string;
  time: string;
} {
  const at: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const part of new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(instant)) {
    if (part.type !== 'literal') {
      at[part.type] = part.value;
    }
  }
  return {
    date: `${at.year}-${at.month}-${at.day}`,
    time: `${at.hour}:${at.minute}`,
  };
}

export function formatInZone({ instant, timeZone }: { instant: Date; timeZone?: string }): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: timeZone ? 'short' : undefined,
  }).format(instant);
}

export function todayInputValue(): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
