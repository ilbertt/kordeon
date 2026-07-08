import { cn } from '@repo/ui/lib/utils';
import { AVATARS, PEOPLE, type Person, type PersonId } from './data';

// Everyone gets a cartoon avatar; the coloured initials remain a graceful
// fallback if the SVG hasn't loaded.
export function Avatar({ person, className }: { person: Person; className?: string }) {
  const src = AVATARS[person.id];
  if (src) {
    return (
      <img
        src={src}
        alt={person.name}
        className={cn('shrink-0 rounded-full object-cover', className)}
        style={{ backgroundColor: person.color }}
      />
    );
  }
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-medium text-white',
        className,
      )}
      style={{ backgroundColor: person.color }}
    >
      {person.initials}
    </span>
  );
}

export function Facepile({ ids, online }: { ids: PersonId[]; online?: boolean }) {
  const people = ids.map((id) => PEOPLE[id]);
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {people.map((person) => (
          <Avatar
            key={person.id}
            person={person}
            className="size-6 text-[0.6rem] ring-2 ring-card"
          />
        ))}
      </div>
      {online ? (
        <span className="flex items-center gap-1 text-muted-foreground text-xs">
          <span className="size-1.5 rounded-full bg-chart-2" />
          {people.length} online
        </span>
      ) : null}
    </div>
  );
}
