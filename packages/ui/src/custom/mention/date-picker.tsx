import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { NativeSelect, NativeSelectOption } from '@repo/ui/components/native-select';
import { useState } from 'react';
import { formatInZone, systemTimeZone, TIME_ZONES, todayInputValue, zonedToInstant } from './dates';

// Pick a wall-clock time in any timezone; the preview (and the resulting tag)
// show it in the viewer's system timezone.
export function DatePicker({
  onAdd,
  onCancel,
}: {
  onAdd: (value: { date: string; time: string; timeZone: string }) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(todayInputValue);
  const [time, setTime] = useState('09:00');
  const [timeZone, setTimeZone] = useState(systemTimeZone);
  const valid = Boolean(date && time);
  const preview = valid ? formatInZone({ instant: zonedToInstant({ date, time, timeZone }) }) : '';

  return (
    <div className="absolute bottom-full left-0 z-30 mb-2 w-72 max-w-[calc(100vw-3rem)] space-y-2 rounded-lg border border-border bg-card p-3 shadow-lg">
      <div className="font-medium text-[0.65rem] text-muted-foreground uppercase tracking-wide">
        Pick a date
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          aria-label="Date"
        />
        <Input
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          aria-label="Time"
        />
      </div>
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
