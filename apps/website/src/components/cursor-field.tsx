// biome-ignore-all lint/style/noMagicNumbers: decorative cursor choreography (coordinates + timings)

import { Cursor } from '@repo/ui/components/cursor';
import { cn } from '@repo/ui/lib/utils';
import { useEffect, useRef } from 'react';

type Actor = {
  name: string;
  color: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
  freqY: number;
  phase: number;
  duration: number;
};

const actors: Actor[] = [
  {
    name: 'Maya',
    color: 'var(--chart-1)',
    x: 18,
    y: 30,
    rx: 46,
    ry: 30,
    freqY: 1,
    phase: 0,
    duration: 19000,
  },
  {
    name: 'Theo',
    color: 'var(--chart-2)',
    x: 66,
    y: 22,
    rx: 38,
    ry: 44,
    freqY: 2,
    phase: 1.2,
    duration: 23000,
  },
  {
    name: 'Ana',
    color: 'var(--chart-3)',
    x: 38,
    y: 60,
    rx: 52,
    ry: 26,
    freqY: 1,
    phase: 2.4,
    duration: 27000,
  },
  {
    name: 'Sam',
    color: 'var(--chart-4)',
    x: 78,
    y: 58,
    rx: 30,
    ry: 40,
    freqY: 2,
    phase: 3.6,
    duration: 21000,
  },
  {
    name: 'Agent',
    color: 'var(--chart-5)',
    x: 50,
    y: 40,
    rx: 44,
    ry: 34,
    freqY: 1,
    phase: 4.8,
    duration: 25000,
  },
];

const STEPS = 32;
const TAU = Math.PI * 2;

// A closed Lissajous loop (start === end in both position and velocity), sampled
// finely and played with linear timing → smooth, continuous, seamless drift.
function orbit(actor: Actor): Keyframe[] {
  const frames: Keyframe[] = [];
  for (let k = 0; k <= STEPS; k += 1) {
    const t = k / STEPS;
    const dx = Math.cos(TAU * t) * actor.rx;
    const dy = Math.sin(TAU * actor.freqY * t + actor.phase) * actor.ry;
    frames.push({ transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)` });
  }
  return frames;
}

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
        node.animate(orbit(actor), {
          duration: actor.duration,
          iterations: Number.POSITIVE_INFINITY,
          easing: 'linear',
        }),
      );
    }
    return () => {
      for (const animation of animations) {
        animation.cancel();
      }
    };
  }, []);

  return (
    <div ref={ref} className={cn('absolute inset-0 overflow-hidden blur-[0.5px]', className)}>
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
