// biome-ignore-all lint/style/noMagicNumbers: decorative cursor choreography (coordinates + timings)

import { Cursor } from '@repo/ui/components/cursor';
import { cn } from '@repo/ui/lib/utils';
import { useEffect, useRef } from 'react';

type Actor = {
  name: string;
  color: string;
  x: number;
  y: number;
  drift: [number, number][];
  duration: number;
};

const actors: Actor[] = [
  {
    name: 'Maya',
    color: 'var(--chart-1)',
    x: 16,
    y: 26,
    drift: [
      [0, 0],
      [70, -36],
      [24, 44],
      [0, 0],
    ],
    duration: 23000,
  },
  {
    name: 'Theo',
    color: 'var(--chart-2)',
    x: 67,
    y: 19,
    drift: [
      [0, 0],
      [-46, 34],
      [30, -22],
      [0, 0],
    ],
    duration: 27000,
  },
  {
    name: 'Ana',
    color: 'var(--chart-3)',
    x: 37,
    y: 56,
    drift: [
      [0, 0],
      [54, 22],
      [-34, -30],
      [0, 0],
    ],
    duration: 31000,
  },
  {
    name: 'Sam',
    color: 'var(--chart-4)',
    x: 79,
    y: 60,
    drift: [
      [0, 0],
      [-52, -24],
      [22, 32],
      [0, 0],
    ],
    duration: 25000,
  },
  {
    name: 'Agent',
    color: 'var(--chart-5)',
    x: 51,
    y: 36,
    drift: [
      [0, 0],
      [32, 46],
      [-44, 12],
      [0, 0],
    ],
    duration: 29000,
  },
];

export function CursorField({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) {
      return;
    }
    const nodes = Array.from(root.children) as HTMLElement[];
    const animations: Animation[] = [];
    for (const [i, actor] of actors.entries()) {
      const node = nodes[i];
      if (!node) {
        continue;
      }
      animations.push(
        node.animate(
          actor.drift.map(([dx, dy]) => ({ transform: `translate(${dx}px, ${dy}px)` })),
          {
            duration: actor.duration,
            iterations: Number.POSITIVE_INFINITY,
            easing: 'ease-in-out',
            delay: i * -3000,
          },
        ),
      );
    }
    return () => {
      for (const animation of animations) {
        animation.cancel();
      }
    };
  }, []);

  return (
    <div ref={ref} className={cn('absolute inset-0 overflow-hidden', className)}>
      {actors.map((actor) => (
        <Cursor
          key={actor.name}
          name={actor.name}
          color={actor.color}
          className="absolute"
          style={{ left: `${actor.x}%`, top: `${actor.y}%` }}
        />
      ))}
    </div>
  );
}
