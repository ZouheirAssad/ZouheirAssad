import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Scene lengths (frames) — the main video is the sum of these.
export const COUNTER_DURATION = 105;
export const THANKS_DURATION = 100;
export const STATS_DURATION = 95;
export const OUTRO_DURATION = 110;
export const TOTAL_DURATION =
  COUNTER_DURATION + THANKS_DURATION + STATS_DURATION + OUTRO_DURATION;

export const COLORS = {
  bg: "#0A0A0F",
  bg2: "#16121F",
  text: "#FFFFFF",
  muted: "#A9A6B8",
  orange: "#FF5A1F",
  gold: "#FFC24B",
  teal: "#2EE6C5",
  card: "rgba(255,255,255,0.06)",
  cardBorder: "rgba(255,255,255,0.12)",
};

export const HANDLE = "zouheir.builds";

export const LATIN = "Inter, sans-serif";
export const ARABIC = "Cairo, Inter, sans-serif";

// Inter ships as one variable file (500–900); Cairo is split by script.
const interWeights = ["500", "700", "800", "900"];
const cairoWeights = ["700", "900"];

export const fontsLoaded = Promise.all([
  ...interWeights.map((weight) =>
    loadFont({ family: "Inter", url: staticFile("Inter.woff2"), weight }),
  ),
  ...cairoWeights.flatMap((weight) => [
    loadFont({
      family: "Cairo",
      url: staticFile("Cairo-Arabic.woff2"),
      weight,
      unicodeRange: "U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFC",
    }),
    loadFont({ family: "Cairo", url: staticFile("Cairo-Latin.woff2"), weight }),
  ]),
]);
