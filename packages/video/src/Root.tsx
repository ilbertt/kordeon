// The product's real theme + component classes come straight from @repo/ui —
// the same stylesheet the landing page uses, scanned across apps/** + packages/**.
import '@repo/ui/globals.css';
import { Composition } from 'remotion';
import { Smoke } from '#compositions/Smoke';
import { Window } from '#compositions/Window';

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="Smoke"
        component={Smoke}
        durationInFrames={90}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="Window"
        component={Window}
        durationInFrames={180}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
}
