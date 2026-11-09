import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { COLORS, WIDTH } from "./theme";

const PALETTE = [COLORS.orange, COLORS.gold, COLORS.teal, "#FFFFFF", "#FF3D7F"];

type Props = { count?: number; originY?: number; seed?: string };

// Deterministic confetti burst from a point, with gravity and drag.
export const Confetti: React.FC<Props> = ({
  count = 140,
  originY = 820,
  seed = "confetti",
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const delay = Math.floor(r("d") * 6);
        const t = Math.max(0, frame - delay);
        if (frame < delay) return null;

        const angle = r("a") * Math.PI * 2;
        const speed = 22 + r("s") * 38;
        const drag = 0.94;
        // Closed-form position under exponential drag + gravity.
        const travel = (1 - Math.pow(drag, t)) / (1 - drag);
        const x = WIDTH / 2 + Math.cos(angle) * speed * travel;
        const y =
          originY + Math.sin(angle) * speed * travel + 0.55 * t * t * 0.5;
        const w = 14 + r("w") * 16;
        const h = r("shape") > 0.5 ? w * 0.45 : w;
        const spin = (r("sp") - 0.5) * 30 * t;
        const flip = Math.abs(Math.cos((t + r("f") * 20) / 4));
        const opacity = Math.min(1, Math.max(0, (90 - t) / 20));

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: w,
              height: h,
              borderRadius: r("round") > 0.7 ? "50%" : 3,
              background: PALETTE[Math.floor(r("c") * PALETTE.length)],
              rotate: `${spin}deg`,
              scale: `1 ${0.2 + flip * 0.8}`,
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
