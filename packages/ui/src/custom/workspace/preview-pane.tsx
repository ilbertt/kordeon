import { cn } from '@repo/ui/lib/utils';
import { Eye } from 'lucide-react';
import type { ReactNode } from 'react';

// Plain overflow (not scroll-area): the body must both vertically center short content
// via child `h-full` AND grow to scroll for tall content — only a flex-1 overflow-y-auto
// container satisfies both; a scroll-area viewport child cannot.
export function PreviewPane({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <aside
      className={cn(
        'w-[22rem] shrink-0 flex-col border-border border-l bg-muted/20',
        active ? 'hidden xl:flex' : 'hidden',
      )}
    >
      <div className="flex h-14 shrink-0 items-center border-border border-b px-5">
        <div className="flex items-center gap-2 font-medium text-sm">
          <Eye className="size-4 text-muted-foreground" />
          Preview
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </aside>
  );
}
