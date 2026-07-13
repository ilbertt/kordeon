// The product's real theme + component classes come straight from @repo/ui —
// the same stylesheet the landing page uses, scanned across apps/** + packages/**.
import '@repo/ui/globals.css';
import { Composition } from 'remotion';
import { FILM_DURATION, filmDefaultProps, filmSchema, LaunchFilm } from '#compositions/LaunchFilm';
import { FILM_V3_DURATION, LaunchFilmV3 } from '#compositions/LaunchFilmV3';
import {
  LAUNCH_DURATION,
  LaunchVideo,
  launchDefaultProps,
  launchSchema,
} from '#compositions/LaunchVideo';
import { Smoke } from '#compositions/Smoke';
import { Window } from '#compositions/Window';

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="LaunchVideo"
        component={LaunchVideo}
        durationInFrames={LAUNCH_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={launchSchema}
        defaultProps={launchDefaultProps}
      />
      {/* The sharper second cut — kinetic animation + word-by-word captions. */}
      <Composition
        id="LaunchFilm"
        component={LaunchFilm}
        durationInFrames={FILM_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={filmSchema}
        defaultProps={filmDefaultProps}
      />
      {/* Third cut — the product window as a floating 3D slab (shares LaunchFilm's copy). */}
      <Composition
        id="LaunchFilmV3"
        component={LaunchFilmV3}
        durationInFrames={FILM_V3_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={filmSchema}
        defaultProps={filmDefaultProps}
      />
      {/* Debug probes for the pieces the launch film is built from. */}
      <Composition
        id="Window"
        component={Window}
        durationInFrames={180}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="Smoke"
        component={Smoke}
        durationInFrames={90}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
}
