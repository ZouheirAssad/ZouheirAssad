import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { LATIN } from "../theme";
import { Marquee } from "./Marquee";
import { CREAM, INK, ORANGE, OUT, clamp, shake, stamp } from "./style";

const DIGITS = [
  { ch: "1", at: 3, rot: -6 },
  { ch: ",", at: 3, rot: 0 },
  { ch: "0", at: 9, rot: 4 },
  { ch: "0", at: 15, rot: -3 },
  { ch: "0", at: 21, rot: 5 },
];

// "1,000" stamped digit by digit on the beat, framed by moving text bands.
export const DigitsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const shakeX = DIGITS.reduce((a, d) => a + shake(frame, d.at + 3, 10, 6), 0);

  const band = (at: number) =>
    interpolate(frame, [at, at + 8], ["-110% 0px", "0% 0px"], { ...clamp, easing: OUT });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: ORANGE,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: LATIN,
        overflow: "hidden",
      }}
    >
      <Interactive.Div
        name="Top band"
        style={{
          position: "absolute",
          top: 560,
          width: "130%",
          rotate: "-6deg",
          background: CREAM,
          translate: band(26),
        }}
      >
        <Marquee
          text="1K • 1K • 1K •"
          direction={-1}
          textStyle={{ fontSize: 72, fontWeight: 900, color: INK, lineHeight: 1.4 }}
        />
      </Interactive.Div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          translate: `${shakeX}px 0px`,
          scale: String(
            interpolate(frame, [30, 60], [1, 1.12], { ...clamp }),
          ),
        }}
      >
        {DIGITS.map((d, i) => (
          <div
            key={i}
            style={{
              fontSize: 330,
              fontWeight: 900,
              letterSpacing: -12,
              lineHeight: 1,
              color: INK,
              rotate: `${d.rot}deg`,
              scale: String(stamp(frame, d.at, 2.2)),
              opacity: frame >= d.at ? 1 : 0,
            }}
          >
            {d.ch}
          </div>
        ))}
      </div>

      <Interactive.Div
        name="Bottom band"
        style={{
          position: "absolute",
          top: 1230,
          width: "130%",
          rotate: "4deg",
          background: INK,
          translate: band(30),
        }}
      >
        <Marquee
          text="FOLLOWERS • FOLLOWERS •"
          textStyle={{ fontSize: 72, fontWeight: 900, color: CREAM, lineHeight: 1.4 }}
        />
      </Interactive.Div>
    </AbsoluteFill>
  );
};
