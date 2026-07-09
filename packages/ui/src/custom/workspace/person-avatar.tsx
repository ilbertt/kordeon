import type { Person } from '@repo/domain/workspace';
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { useWorkspace } from './context';

type AvatarSize = 'default' | 'sm' | 'lg';

// Everyone gets a cartoon avatar; the coloured initials remain a graceful
// fallback if the image hasn't loaded.
export function PersonAvatar({
  person,
  size = 'default',
  className,
}: {
  person: Person;
  size?: AvatarSize;
  className?: string;
}) {
  return (
    <Avatar size={size} className={className}>
      {person.avatarUrl ? (
        <AvatarImage
          src={person.avatarUrl}
          alt={person.name}
          style={{ backgroundColor: person.color }}
        />
      ) : null}
      <AvatarFallback className="font-medium text-white" style={{ backgroundColor: person.color }}>
        {person.initials}
      </AvatarFallback>
    </Avatar>
  );
}

const DEFAULT_FACEPILE_MAX = 5;

export function Facepile({
  ids,
  online,
  max = DEFAULT_FACEPILE_MAX,
}: {
  ids: string[];
  online?: boolean;
  max?: number;
}) {
  const { people } = useWorkspace();
  const resolved = ids
    .map((id) => people[id])
    .filter((person): person is Person => Boolean(person));
  const shown = resolved.slice(0, max);
  const overflow = resolved.length - shown.length;
  return (
    <div className="flex items-center gap-2">
      <AvatarGroup>
        {shown.map((person) => (
          <PersonAvatar key={person.id} person={person} size="sm" />
        ))}
        {overflow > 0 ? <AvatarGroupCount>+{overflow}</AvatarGroupCount> : null}
      </AvatarGroup>
      {online ? (
        <span className="flex items-center gap-1 text-muted-foreground text-xs">
          <span className="size-1.5 rounded-full bg-primary" />
          {resolved.length} online
        </span>
      ) : null}
    </div>
  );
}
