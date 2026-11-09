import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "./theme";

// Dark backdrop with two slowly drifting warm glows and a faint dot grid.
export const Background: React.FC<{ glow?: string; glow2?: string }> = ({
  glow = COLORS.orange,
  glow2 = COLORS.gold,
}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 40) * 60;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${30 + drift / 20}% ${22 + drift / 30}%, ${glow}55 0%, transparent 45%),
            radial-gradient(circle at ${75 - drift / 25}% ${80 - drift / 30}%, ${glow2}40 0%, transparent 42%),
            linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.bg2} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.09) 2px, transparent 2px)",
          backgroundSize: "48px 48px",
          backgroundPosition: `0px ${interpolate(frame, [0, 300], [0, -96])}px`,
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
    </AbsoluteFill>
  );
};
