import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/popover';
import { MentionTag } from '@repo/ui/custom/mention/mention-tag';
import { cn } from '@repo/ui/lib/utils';
import {
  Bot,
  Boxes,
  Bug,
  LineChart,
  type LucideIcon,
  Palette,
  Plus,
  Rocket,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useRef, useState } from 'react';

export type NewChannel = { name: string; icon: LucideIcon };

// A small palette the visitor picks from — enough variety to feel like naming a
// real channel, without a full icon browser.
const ICON_OPTIONS: { key: string; icon: LucideIcon }[] = [
  { key: 'rocket', icon: Rocket },
  { key: 'chart', icon: LineChart },
  { key: 'zap', icon: Zap },
  { key: 'bug', icon: Bug },
  { key: 'palette', icon: Palette },
  { key: 'shield', icon: ShieldCheck },
  { key: 'boxes', icon: Boxes },
  { key: 'bot', icon: Bot },
];

const NAME_MAX = 32;

// The rail's "+" — the trigger and the inline create form are one unit so any
// consumer gets the whole "add a channel" flow (name + icon) for free and only
// wires up what happens on submit via `onCreate`.
export function CreateChannelButton({ onCreate }: { onCreate: (value: NewChannel) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [iconKey, setIconKey] = useState(ICON_OPTIONS[0]!.key);
  const inputRef = useRef<HTMLInputElement>(null);

  // Base UI has no `preventScroll` option and focuses the first field on open
  // without it. This popup lives inside the landing's scaled, sticky product
  // frame, where that focus-scroll miscomputes the transform and yanks the whole
  // page back to the top. So take over `initialFocus`: focus the field ourselves
  // with `preventScroll` and return `false` so Base UI doesn't focus it again.
  const focusName = () => {
    inputRef.current?.focus({ preventScroll: true });
    return false as const;
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const chosen = ICON_OPTIONS.find((option) => option.key === iconKey) ?? ICON_OPTIONS[0]!;
    onCreate({ name: trimmed, icon: chosen.icon });
    setName('');
    setIconKey(ICON_OPTIONS[0]!.key);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="Create channel"
        className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[popup-open]:bg-muted data-[popup-open]:text-foreground"
      >
        <Plus className="size-4" />
      </PopoverTrigger>
      <PopoverContent initialFocus={focusName} align="end" sideOffset={8} className="w-64 gap-3">
        <div className="space-y-1">
          <p className="font-medium text-sm">New channel</p>
          <p className="text-muted-foreground text-xs">
            <MentionTag tag={{ kind: 'person', token: '@Korde' }} /> joins automatically, ready to
            build anything you need.
          </p>
        </div>
        <Input
          ref={inputRef}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              submit();
            }
          }}
          placeholder="e.g. growth-dashboard"
          maxLength={NAME_MAX}
        />
        <div className="grid grid-cols-4 gap-1.5">
          {ICON_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = option.key === iconKey;
            return (
              <button
                key={option.key}
                type="button"
                aria-label={`Use the ${option.key} icon`}
                aria-pressed={selected}
                onClick={() => setIconKey(option.key)}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-md border transition-colors',
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-transparent text-muted-foreground hover:bg-muted',
                )}
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>
        <Button size="sm" className="w-full" disabled={!name.trim()} onClick={submit}>
          Create channel
        </Button>
      </PopoverContent>
    </Popover>
  );
}
