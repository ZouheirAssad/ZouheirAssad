import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { Background } from "./Background";
import { ARABIC, COLORS, HANDLE, LATIN } from "./theme";

// Next goal (10K) with a progress bar, then the follow call-to-action.
export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();

  const barFill = interpolate(frame, [18, 48], [0, 10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill>
      <Background />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: "0 90px",
          color: COLORS.text,
          fontFamily: LATIN,
        }}
      >
        <Interactive.Div
          name="Next stop label"
          style={{
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: COLORS.muted,
            opacity: interpolate(frame, [0, 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Next stop
        </Interactive.Div>

        <Interactive.Div
          name="10K"
          style={{
            fontSize: 300,
            fontWeight: 900,
            letterSpacing: -14,
            lineHeight: 1.05,
            backgroundImage: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.orange})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            scale: interpolate(frame, [0, 16], [0.7, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.spring({ damping: 12 }),
              output: "perceptual-scale",
            }),
            opacity: interpolate(frame, [0, 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          10K
        </Interactive.Div>

        {/* Progress toward 10K: 1,000 = 10% */}
        <div
          style={{
            width: "100%",
            marginTop: 20,
            opacity: interpolate(frame, [12, 20], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div
            style={{
              height: 36,
              borderRadius: 18,
              background: "rgba(255,255,255,0.08)",
              border: `2px solid ${COLORS.cardBorder}`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${barFill}%`,
                height: "100%",
                borderRadius: 18,
                background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.orange})`,
                boxShadow: `0 0 30px ${COLORS.orange}`,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 14,
              fontSize: 44,
              fontWeight: 700,
              color: COLORS.muted,
            }}
          >
            <span style={{ color: COLORS.gold }}>1,000</span>
            <span>10,000</span>
          </div>
        </div>

        <Interactive.Div
          name="Darija CTA"
          style={{
            fontFamily: ARABIC,
            fontSize: 84,
            fontWeight: 900,
            direction: "rtl",
            textAlign: "center",
            marginTop: 110,
            lineHeight: 1.25,
            opacity: interpolate(frame, [40, 50], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(frame, [40, 54], ["0px 50px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          يلاه نكملو مع بعض
        </Interactive.Div>

        <Interactive.Div
          name="Follow button"
          style={{
            marginTop: 50,
            padding: "28px 60px",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.orange})`,
            color: COLORS.bg,
            fontSize: 56,
            fontWeight: 900,
            boxShadow: `0 20px 60px ${COLORS.orange}77`,
            scale: interpolate(
              frame,
              [52, 64, 80, 86, 92],
              [0, 1, 1, 1.07, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.spring({ damping: 12 }),
                output: "perceptual-scale",
              },
            ),
          }}
        >
          Follow @{HANDLE}
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
