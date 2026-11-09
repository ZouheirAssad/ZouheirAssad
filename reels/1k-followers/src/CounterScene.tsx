import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { Background } from "./Background";
import { COLORS, HANDLE, LATIN } from "./theme";

const COUNT_START = 12;
const COUNT_END = 78;
const RING = 340; // ring radius

// Follower counter racing 0 → 1,000 inside a filling progress ring.
export const CounterScene: React.FC = () => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [COUNT_START, COUNT_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.45, 0, 0.15, 1),
  });
  const count = Math.round(progress * 1000);
  const done = frame >= COUNT_END;
  const circumference = 2 * Math.PI * RING;

  return (
    <AbsoluteFill>
      <Background />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          fontFamily: LATIN,
          color: COLORS.text,
        }}
      >
        <Interactive.Div
          name="Handle pill"
          style={{
            position: "absolute",
            top: 260,
            padding: "18px 40px",
            borderRadius: 999,
            border: `2px solid ${COLORS.cardBorder}`,
            background: COLORS.card,
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: -0.5,
            opacity: interpolate(frame, [0, 12], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(frame, [0, 15], ["0px -40px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          @{HANDLE}
        </Interactive.Div>

        <Interactive.Div
          name="Counter"
          style={{
            position: "relative",
            width: RING * 2 + 80,
            height: RING * 2 + 80,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            scale: interpolate(
              frame,
              [0, 14, COUNT_END, COUNT_END + 6, COUNT_END + 14],
              [0.6, 1, 1, 1.12, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                output: "perceptual-scale",
              },
            ),
            opacity: interpolate(frame, [0, 10, 96, 105], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <svg
            width={RING * 2 + 80}
            height={RING * 2 + 80}
            style={{ position: "absolute", inset: 0, rotate: "-90deg" }}
          >
            <defs>
              <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={COLORS.gold} />
                <stop offset="100%" stopColor={COLORS.orange} />
              </linearGradient>
            </defs>
            <circle
              cx={RING + 40}
              cy={RING + 40}
              r={RING}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={26}
            />
            <circle
              cx={RING + 40}
              cy={RING + 40}
              r={RING}
              fill="none"
              stroke="url(#ring)"
              strokeWidth={26}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              style={{
                filter: `drop-shadow(0 0 ${done ? 30 : 14}px ${COLORS.orange})`,
              }}
            />
          </svg>

          <div
            style={{
              fontSize: 196,
              fontWeight: 900,
              letterSpacing: -10,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              color: done ? COLORS.gold : COLORS.text,
              textShadow: done ? `0 0 60px ${COLORS.orange}AA` : "none",
            }}
          >
            {count.toLocaleString("en-US")}
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: COLORS.muted,
              marginTop: 10,
              textTransform: "uppercase",
              letterSpacing: 10,
            }}
          >
            followers
          </div>
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
