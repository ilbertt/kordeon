'use client';

import type { Person } from '@repo/domain/workspace';
import type { MentionSuggestion } from '@repo/ui/custom/mention/types';
import { createContext, type ReactNode, useContext } from 'react';

// Resolves people, the current user, and composer suggestions for the workspace
// panels — so the presentational components stay data-source agnostic (the
// landing feeds static data, a future product feeds server data).
export type WorkspaceContextValue = {
  people: Record<string, Person>;
  currentUserId: string;
  mentionSuggestions: MentionSuggestion[];
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  people,
  currentUserId,
  mentionSuggestions,
  children,
}: WorkspaceContextValue & { children: ReactNode }) {
  return (
    <WorkspaceContext.Provider value={{ people, currentUserId, mentionSuggestions }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return value;
}

export function usePerson(id: string): Person {
  const { people } = useWorkspace();
  const person = people[id];
  if (!person) {
    throw new Error(`Unknown person id: ${id}`);
  }
  return person;
}

export function useCurrentUser(): Person {
  const { currentUserId } = useWorkspace();
  return usePerson(currentUserId);
}
