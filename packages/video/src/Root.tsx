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
  FILM_V6_DURATION,
  filmV6DefaultProps,
  filmV6Schema,
  LaunchFilmV6,
} from '#compositions/LaunchFilmV6';
import {
  FILM_V7_DURATION,
  filmV7DefaultProps,
  filmV7Schema,
  LaunchFilmV7,
} from '#compositions/LaunchFilmV7';
import {
  FILM_V8_DURATION,
  filmV8DefaultProps,
  filmV8Schema,
  LaunchFilmV8,
} from '#compositions/LaunchFilmV8';
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
      {/* Sixth cut — desaturated "collaborate after" open, slower pacing, dip cuts. */}
      <Composition
        id="LaunchFilmV6"
        component={LaunchFilmV6}
        durationInFrames={FILM_V6_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={filmV6Schema}
        defaultProps={filmV6DefaultProps}
      />
      {/* Seventh cut — abstract PR review by a generic agent (changes requested). */}
      <Composition
        id="LaunchFilmV7"
        component={LaunchFilmV7}
        durationInFrames={FILM_V7_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={filmV7Schema}
        defaultProps={filmV7DefaultProps}
      />
      {/* Eighth cut — longer caption holds + a Meet-kordeon logo→product morph. */}
      <Composition
        id="LaunchFilmV8"
        component={LaunchFilmV8}
        durationInFrames={FILM_V8_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        schema={filmV8Schema}
        defaultProps={filmV8DefaultProps}
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
