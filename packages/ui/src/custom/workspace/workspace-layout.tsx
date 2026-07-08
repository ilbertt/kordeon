import type { ReactNode } from 'react';

export function WorkspaceLayout({
  topBar,
  sidebar,
  children,
}: {
  topBar: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {topBar}
      <div className="flex min-h-0 flex-1">
        {sidebar}
        {children}
      </div>
    </div>
  );
}
