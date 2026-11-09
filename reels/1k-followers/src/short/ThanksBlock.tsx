import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { ARABIC, LATIN } from "../theme";
import { Marquee } from "./Marquee";
import { CREAM, INK, ORANGE, OUT, SNAP, clamp, stamp } from "./style";

// Black block: outlined "THANK YOU" rows scroll behind a masked Darija reveal.
export const ThanksBlock: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: INK,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          justifyContent: "center",
          gap: 10,
          rotate: "-8deg",
          scale: "1.3",
          opacity: 0.35,
        }}
      >
        {new Array(9).fill(0).map((_, i) => (
          <Marquee
            key={i}
            text="THANK YOU"
            speed={10 + (i % 3) * 4}
            direction={i % 2 ? 1 : -1}
            textStyle={{
              fontFamily: LATIN,
              fontSize: 150,
              fontWeight: 900,
              lineHeight: 1.05,
              color: i === 4 ? ORANGE : "transparent",
              WebkitTextStroke: i === 4 ? "0" : `3px ${CREAM}`,
            }}
          />
        ))}
      </AbsoluteFill>

      <Interactive.Div
        name="Darija thanks"
        style={{
          fontFamily: ARABIC,
          fontSize: 170,
          fontWeight: 900,
          color: CREAM,
          direction: "rtl",
          background: INK,
          padding: "0 40px 20px",
          // Right-to-left wipe reveal, matching reading direction.
          clipPath: `inset(0 0 0 ${interpolate(frame, [4, 16], [100, 0], {
            ...clamp,
            easing: SNAP,
          })}%)`,
        }}
      >
        شكراً بزاف
      </Interactive.Div>

      <Interactive.Div
        name="English thanks"
        style={{
          marginTop: 20,
          padding: "14px 40px",
          background: ORANGE,
          color: INK,
          fontFamily: LATIN,
          fontSize: 64,
          fontWeight: 900,
          rotate: "3deg",
          scale: String(stamp(frame, 20)),
          opacity: frame >= 20 ? 1 : 0,
        }}
      >
        FOR 1,000 OF YOU
      </Interactive.Div>

      <Interactive.Div
        name="Underline"
        style={{
          marginTop: 30,
          height: 12,
          background: CREAM,
          width: interpolate(frame, [26, 36], [0, 420], { ...clamp, easing: OUT }),
        }}
      />
    </AbsoluteFill>
  );
};
