'use client';

import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { Eye, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useWorkspacePanels } from './workspace-ui';

// Plain overflow (not scroll-area): the body must both vertically center short content
// via child `h-full` AND grow to scroll for tall content — only a flex-1 overflow-y-auto
// container satisfies both; a scroll-area viewport child cannot.
//
// At xl+ the preview sits in flow beside the thread; below that it collapses
// behind the thread's Eye toggle and slides over from the right as a drawer (the
// `preview` panel in the workspace-panels context), but only for the active channel.
export function PreviewPane({ active, children }: { active: boolean; children: ReactNode }) {
  const { openPanel, close } = useWorkspacePanels();
  const isOpen = active && openPanel === 'preview';
  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close preview"
          onClick={close}
          className="absolute inset-0 z-30 bg-foreground/30 backdrop-blur-xs duration-200 animate-in fade-in xl:hidden"
        />
      ) : null}
      <aside
        className={cn(
          'w-[22rem] max-w-[85%] shrink-0 flex-col border-border border-l bg-background xl:static xl:z-auto xl:max-w-none xl:translate-x-0 xl:animate-none xl:bg-muted/20 xl:shadow-none',
          // Wide layout: in flow, shown only for the active channel.
          active ? 'xl:flex' : 'xl:hidden',
          // Narrow layout: overlay drawer, only when this channel's preview is open.
          isOpen
            ? 'absolute inset-y-0 right-0 z-40 flex shadow-xl duration-200 animate-in slide-in-from-right'
            : 'hidden',
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-border border-b px-5">
          <div className="flex items-center gap-2 font-medium text-sm">
            <Eye className="size-4 text-muted-foreground" />
            Preview
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground xl:hidden"
            aria-label="Close preview"
            onClick={close}
          >
            <X />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </>
  );
}
