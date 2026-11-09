import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  Sequence,
  useCurrentFrame,
} from "remotion";
import { Background } from "./Background";
import { Confetti } from "./Confetti";
import { ARABIC, COLORS, LATIN } from "./theme";

// "1K" slam + confetti + thank-you in Darija and English.
export const ThanksScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Background glow={COLORS.gold} glow2={COLORS.orange} />

      {/* Flash on impact */}
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.gold,
          opacity: interpolate(frame, [0, 2, 10], [0, 0.55, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />

      {/* Rotating light rays behind the 1K */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity: interpolate(frame, [0, 10], [0, 0.5], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            width: 1800,
            height: 1800,
            marginTop: -120,
            rotate: `${frame * 0.4}deg`,
            background: `repeating-conic-gradient(${COLORS.gold}33 0deg 8deg, transparent 8deg 24deg)`,
            maskImage:
              "radial-gradient(circle, black 10%, transparent 60%)",
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          color: COLORS.text,
        }}
      >
        <Interactive.Div
          name="1K"
          style={{
            fontFamily: LATIN,
            fontSize: 420,
            fontWeight: 900,
            letterSpacing: -20,
            lineHeight: 1,
            marginTop: -120,
            backgroundImage: `linear-gradient(180deg, #FFF3C9 0%, ${COLORS.gold} 45%, ${COLORS.orange} 100%)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            filter: `drop-shadow(0 20px 60px ${COLORS.orange}88)`,
            scale: interpolate(frame, [0, 8, 16], [2.6, 0.92, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.2, 0.9, 0.3, 1),
              output: "perceptual-scale",
            }),
            opacity: interpolate(frame, [0, 4, 90, 100], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          1K
        </Interactive.Div>

        <Interactive.Div
          name="Darija thanks"
          style={{
            fontFamily: ARABIC,
            fontSize: 120,
            fontWeight: 900,
            direction: "rtl",
            marginTop: 30,
            opacity: interpolate(frame, [14, 24, 90, 100], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(frame, [14, 28], ["0px 60px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          شكراً بزاف!
        </Interactive.Div>

        <Interactive.Div
          name="English thanks"
          style={{
            fontFamily: LATIN,
            fontSize: 56,
            fontWeight: 700,
            color: COLORS.muted,
            marginTop: 10,
            opacity: interpolate(frame, [22, 32, 90, 100], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(frame, [22, 36], ["0px 40px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          Thank you for 1,000 followers
        </Interactive.Div>
      </AbsoluteFill>

      <Sequence name="Confetti" layout="absolute-fill">
        <Confetti originY={820} />
      </Sequence>
    </AbsoluteFill>
  );
};
