import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { ARABIC, HANDLE, LATIN } from "../theme";
import { CREAM, GOLD, INK, ORANGE, OUT, clamp, shake, stamp } from "./style";

const CHIPS = [
  { label: "24 posts", bg: INK, fg: CREAM, rot: -4, at: 22 },
  { label: "58.3K views", bg: GOLD, fg: INK, rot: 3, at: 26 },
  { label: "AI tutorials", bg: ORANGE, fg: INK, rot: -2, at: 30 },
];

// Next goal + stat stickers + follow CTA on cream.
export const OutroBlock: React.FC = () => {
  const frame = useCurrentFrame();
  const rise = (at: number) =>
    interpolate(frame, [at, at + 8], ["0% 110%", "0% 0%"], { ...clamp, easing: OUT });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: CREAM,
        alignItems: "center",
        justifyContent: "center",
        fontFamily: LATIN,
        color: INK,
        padding: "0 90px",
      }}
    >
      <div style={{ overflow: "hidden" }}>
        <Interactive.Div
          name="Next stop"
          style={{ fontSize: 64, fontWeight: 900, letterSpacing: 6, translate: rise(2) }}
        >
          NEXT STOP →
        </Interactive.Div>
      </div>

      <Interactive.Div
        name="10K"
        style={{
          fontSize: 340,
          fontWeight: 900,
          letterSpacing: -16,
          lineHeight: 1,
          color: ORANGE,
          textShadow: `12px 12px 0 ${INK}`,
          scale: String(stamp(frame, 8, 2.4)),
          opacity: frame >= 8 ? 1 : 0,
          translate: `${shake(frame, 13, 18)}px 0px`,
        }}
      >
        10K
      </Interactive.Div>

      <div style={{ display: "flex", gap: 20, marginTop: 40, flexWrap: "wrap", justifyContent: "center" }}>
        {CHIPS.map((c) => (
          <div
            key={c.label}
            style={{
              padding: "14px 30px",
              background: c.bg,
              color: c.fg,
              fontSize: 46,
              fontWeight: 800,
              border: `4px solid ${INK}`,
              rotate: `${c.rot}deg`,
              scale: String(stamp(frame, c.at, 1.6)),
              opacity: frame >= c.at ? 1 : 0,
            }}
          >
            {c.label}
          </div>
        ))}
      </div>

      <Interactive.Div
        name="CTA"
        style={{
          marginTop: 110,
          padding: "30px 56px",
          background: INK,
          color: CREAM,
          fontSize: 58,
          fontWeight: 900,
          boxShadow: `12px 12px 0 ${ORANGE}`,
          translate: interpolate(frame, [42, 52], ["0px 700px", "0px 0px"], {
            ...clamp,
            easing: OUT,
          }),
        }}
      >
        Follow @{HANDLE}
      </Interactive.Div>

      <div style={{ overflow: "hidden", marginTop: 36 }}>
        <Interactive.Div
          name="Darija CTA"
          style={{
            fontFamily: ARABIC,
            fontSize: 76,
            fontWeight: 900,
            direction: "rtl",
            translate: rise(52),
          }}
        >
          يلاه نكملو مع بعض
        </Interactive.Div>
      </div>
    </AbsoluteFill>
  );
};
