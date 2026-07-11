import { Button } from '@repo/ui/components/button';
import { Calendar } from '@repo/ui/components/calendar';
import { Input } from '@repo/ui/components/input';
import { NativeSelect, NativeSelectOption } from '@repo/ui/components/native-select';
import { useState } from 'react';
import {
  formatInZone,
  systemTimeZone,
  TIME_ZONES,
  todayInputValue,
  zonedFromInstant,
  zonedToInstant,
} from './dates';

// A calendar grid for the day, a time field and a timezone select side by side,
// all in one panel. The wall-clock {date, time, timeZone} stays the source of
// truth; the calendar reads/writes it through the zoned<->instant helpers, and
// the preview (and resulting tag) show it in the viewer's system timezone.
export function DatePicker({
  initialValue,
  onAdd,
  onCancel,
}: {
  initialValue?: { date: string; time: string; timeZone: string };
  onAdd: (value: { date: string; time: string; timeZone: string }) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(initialValue?.date ?? todayInputValue);
  const [time, setTime] = useState(initialValue?.time ?? '09:00');
  const [timeZone, setTimeZone] = useState(initialValue?.timeZone ?? systemTimeZone);
  const valid = Boolean(date && time);
  const instant = zonedToInstant({ date, time, timeZone });
  const preview = valid ? formatInZone({ instant }) : '';

  // Picking a day only updates the date — the time the user set is preserved.
  const onDayPick = (picked: Date | undefined) => {
    if (!picked) {
      return;
    }
    setDate(zonedFromInstant({ instant: picked, timeZone }).date);
  };

  return (
    <div className="absolute bottom-full left-0 z-30 mb-2 w-fit max-w-[calc(100vw-3rem)] space-y-3 rounded-lg border border-border bg-card p-3 shadow-lg">
      <div className="flex gap-3">
        <Calendar
          mode="single"
          timeZone={timeZone}
          defaultMonth={instant}
          selected={instant}
          onSelect={onDayPick}
          // Keep today's cell rounded when it's the selected day. shadcn squares it
          // off (data-[selected=true]:rounded-none) for range selection, which here
          // just draws a square frame around the round pill.
          classNames={{ today: 'rounded-(--cell-radius) bg-muted text-foreground' }}
        />
        <div className="flex w-40 flex-col gap-2">
          <Input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            aria-label="Time"
          />
          <NativeSelect
            className="w-full"
            value={timeZone}
            onChange={(event) => setTimeZone(event.target.value)}
            aria-label="Timezone"
          >
            {TIME_ZONES.map((zone) => (
              <NativeSelectOption key={zone} value={zone}>
                {zone}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {preview ? (
            <div className="text-muted-foreground text-xs">
              In your time: <span className="font-medium text-foreground">{preview}</span>
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!valid}
          onClick={() => onAdd({ date, time, timeZone })}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
