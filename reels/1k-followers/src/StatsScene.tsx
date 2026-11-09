import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { Background } from "./Background";
import { ARABIC, COLORS, LATIN } from "./theme";

const STATS = [
  { value: "24", label: "posts", color: COLORS.teal },
  { value: "58.3K", label: "views in 30 days", color: COLORS.gold },
  { value: "AI", label: "News · Tools · Tutorials", color: COLORS.orange },
];

const STAGGER = 10;
const FIRST = 16;

// The journey so far: three stat cards popping in one after another.
export const StatsScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Background glow={COLORS.teal} glow2={COLORS.orange} />

      <AbsoluteFill
        style={{
          padding: "0 90px",
          justifyContent: "center",
          gap: 36,
          color: COLORS.text,
          opacity: interpolate(frame, [85, 95], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <Interactive.Div
          name="Heading"
          style={{
            fontFamily: ARABIC,
            fontSize: 96,
            fontWeight: 900,
            direction: "rtl",
            textAlign: "center",
            marginBottom: 30,
            lineHeight: 1.2,
            opacity: interpolate(frame, [0, 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: interpolate(frame, [0, 14], ["0px -40px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          غير البداية…
          <div
            style={{
              fontFamily: LATIN,
              fontSize: 48,
              fontWeight: 700,
              color: COLORS.muted,
              direction: "ltr",
              marginTop: 6,
            }}
          >
            and we're just getting started
          </div>
        </Interactive.Div>

        {STATS.map((s, i) => {
          const start = FIRST + i * STAGGER;
          return (
            <div
              key={s.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 40,
                padding: "40px 52px",
                borderRadius: 40,
                background: COLORS.card,
                border: `2px solid ${COLORS.cardBorder}`,
                boxShadow: `0 0 0 1px ${s.color}22, 0 30px 60px rgba(0,0,0,0.35)`,
                fontFamily: LATIN,
                opacity: interpolate(frame, [start, start + 6], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                translate: interpolate(
                  frame,
                  [start, start + 14],
                  ["140px 0px", "0px 0px"],
                  {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.spring({ damping: 14 }),
                  },
                ),
              }}
            >
              <div
                style={{
                  width: 14,
                  alignSelf: "stretch",
                  borderRadius: 7,
                  background: s.color,
                  boxShadow: `0 0 24px ${s.color}`,
                }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    fontSize: 112,
                    fontWeight: 900,
                    letterSpacing: -4,
                    lineHeight: 1,
                    color: s.color,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 700,
                    color: COLORS.text,
                    marginTop: 8,
                  }}
                >
                  {s.label}
                </div>
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
