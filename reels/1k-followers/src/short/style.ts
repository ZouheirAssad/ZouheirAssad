import { Easing } from "remotion";

// Flat editorial palette + snappy motion for the short cut.
export const INK = "#0A0A0F";
export const CREAM = "#F4EFE6";
export const ORANGE = "#FF5A1F";
export const GOLD = "#FFC24B";

export const SNAP = Easing.bezier(0.85, 0, 0.15, 1); // expo in-out
export const OUT = Easing.bezier(0.16, 1, 0.3, 1); // expo out
export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Short decaying camera shake after an impact at `start`.
export const shake = (frame: number, start: number, amp = 14, dur = 8) => {
  const t = frame - start;
  if (t < 0 || t > dur) return 0;
  return amp * (1 - t / dur) * Math.sin(t * 2.6);
};

// Stamp: overshoot scale-in over a few frames.
export const stamp = (frame: number, start: number, from = 1.8) => {
  const t = frame - start;
  if (t < 0) return 0;
  if (t >= 5) return 1;
  return from + (1 - from) * OUT(t / 5);
};

export const SHORT_SCENES = { snap: 60, digits: 60, thanks: 60, outro: 90 };
export const SHORT_DURATION =
  SHORT_SCENES.snap +
  SHORT_SCENES.digits +
  SHORT_SCENES.thanks +
  SHORT_SCENES.outro;
