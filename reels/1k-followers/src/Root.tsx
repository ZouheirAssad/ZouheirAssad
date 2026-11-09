import { Composition, Folder } from "remotion";
import { Celebration } from "./Celebration";
import { CounterScene } from "./CounterScene";
import { OutroScene } from "./OutroScene";
import { ProfileScene } from "./ProfileScene";
import { StatsScene } from "./StatsScene";
import { ThanksScene } from "./ThanksScene";
import {
  COUNTER_DURATION,
  FPS,
  HEIGHT,
  OUTRO_DURATION,
  PROFILE_DURATION,
  STATS_DURATION,
  THANKS_DURATION,
  TOTAL_DURATION,
  WIDTH,
  fontsLoaded,
} from "./theme";

// Make sure fonts are registered before any frame renders.
void fontsLoaded;

const base = { width: WIDTH, height: HEIGHT, fps: FPS };

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Celebration1K"
        component={Celebration}
        durationInFrames={TOTAL_DURATION}
        {...base}
      />
      <Folder name="Scenes">
        <Composition
          id="Profile"
          component={ProfileScene}
          durationInFrames={PROFILE_DURATION}
          {...base}
        />
        <Composition
          id="Counter"
          component={CounterScene}
          durationInFrames={COUNTER_DURATION}
          {...base}
        />
        <Composition
          id="Thanks"
          component={ThanksScene}
          durationInFrames={THANKS_DURATION}
          {...base}
        />
        <Composition
          id="Stats"
          component={StatsScene}
          durationInFrames={STATS_DURATION}
          {...base}
        />
        <Composition
          id="Outro"
          component={OutroScene}
          durationInFrames={OUTRO_DURATION}
          {...base}
        />
      </Folder>
    </>
  );
};
