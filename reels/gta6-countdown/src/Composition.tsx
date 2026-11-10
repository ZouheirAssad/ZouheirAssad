import { Composition, continueRender, delayRender, staticFile } from "remotion";
import { FPS, Reel, ReelProps, TOTAL } from "./Reel";

// Cairo (Arabic) + Inter, bundled in public/fonts so renders work offline.
const waitForFonts = delayRender("Loading fonts");
const link = document.createElement("link");
link.rel = "stylesheet";
link.href = staticFile("fonts/fonts.css");
link.onload = () => {
  Promise.all([
    document.fonts.load("900 40px Cairo", "بقاو"),
    document.fonts.load("800 40px Cairo", "بقاو"),
    document.fonts.load("900 40px Cairo", "19"),
    document.fonts.load("900 40px Inter", "J-9"),
  ]).finally(() => continueRender(waitForFonts));
};
link.onerror = () => continueRender(waitForFonts);
document.head.appendChild(link);

const defaultProps: ReelProps = {
  startDay: 10,
  releaseDay: 19,
  monthAr: "نونبر",
  year: 2026,
  brand: "Zouheir Builds",
  audio: "mix",
};

export const MyComposition = () => {
  return (
    <Composition
      id="GTA6Countdown"
      component={Reel}
      durationInFrames={TOTAL}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
    />
  );
};
