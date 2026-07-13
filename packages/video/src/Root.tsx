// The product's real theme + component classes come straight from @repo/ui —
// the same stylesheet the landing page uses, scanned across apps/** + packages/**.
import '@repo/ui/globals.css';
import { Composition } from 'remotion';
import { FILM_DURATION, filmDefaultProps, filmSchema, LaunchFilm } from '#compositions/LaunchFilm';
import { FILM_V3_DURATION, LaunchFilmV3 } from '#compositions/LaunchFilmV3';
import {
  FILM_V4_DURATION,
  filmV4DefaultProps,
  filmV4Schema,
  LaunchFilmV4,
} from '#compositions/LaunchFilmV4';
import { FILM_V5_DURATION, LaunchFilmV5 } from '#compositions/LaunchFilmV5';
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
      {/* Fourth cut — opens on the problem (collaborate-after PR) + tighter zoom. */}
      <Composition
        id="LaunchFilmV4"
        component={LaunchFilmV4}
        durationInFrames={FILM_V4_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={filmV4Schema}
        defaultProps={filmV4DefaultProps}
      />
      {/* Fifth cut — cut 4 with smooth, non-jumping scene transitions. */}
      <Composition
        id="LaunchFilmV5"
        component={LaunchFilmV5}
        durationInFrames={FILM_V5_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={filmV4Schema}
        defaultProps={filmV4DefaultProps}
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
