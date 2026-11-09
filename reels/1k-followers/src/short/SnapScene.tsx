import {
  AbsoluteFill,
  Img,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { ARABIC, HEIGHT, WIDTH } from "../theme";
import { CREAM, INK, ORANGE, OUT, SNAP, clamp, shake, stamp } from "./style";

// Same screenshot/stat geometry as ProfileScene (public/profile.png, 1008×2244).
const SHOT_W = 1008;
const SHOT_H = 2244;
const STAT = { x: 455, y: 395, w: 205, h: 120 };
const PHONE_W = 680;
const BEZEL = 14;
const S = PHONE_W / SHOT_W;
const FRAME_W = PHONE_W + BEZEL * 2;
const FRAME_H = SHOT_H * S + BEZEL * 2;
const LEFT0 = (WIDTH - FRAME_W) / 2;
const TOP0 = (HEIGHT - FRAME_H) / 2;
const PX = BEZEL + (STAT.x + STAT.w / 2) * S;
const PY = BEZEL + (STAT.y + STAT.h / 2) * S;
const TARGET = { x: WIDTH / 2, y: 1020 };

// Phone slams in, then two hard zoom cuts onto "1,000 followers".
export const SnapScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Two stepped zooms with a hold between them.
  const steps = [12, 18, 26, 32];
  const z = interpolate(frame, steps, [1, 1.9, 1.9, 3.6], {
    ...clamp,
    easing: [SNAP, (x) => x, SNAP],
  });
  const p = interpolate(frame, steps, [0, 0.45, 0.45, 1], {
    ...clamp,
    easing: [SNAP, (x) => x, SNAP],
  });
  const jitter = shake(frame, 18, 16) + shake(frame, 32, 22);
  const sx = interpolate(p, [0, 1], [LEFT0 + PX, TARGET.x]) + jitter;
  const sy = interpolate(p, [0, 1], [TOP0 + PY, TARGET.y]) - jitter * 0.6;

  const marker = interpolate(frame, [36, 44], [0, 1], { ...clamp, easing: OUT });

  return (
    <AbsoluteFill style={{ backgroundColor: CREAM, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: LEFT0,
          top: TOP0,
          width: FRAME_W,
          height: FRAME_H,
          transformOrigin: "0 0",
          translate: `${sx - LEFT0 - z * PX}px ${sy - TOP0 - z * PY}px`,
          scale: String(z),
        }}
      >
        <Interactive.Div
          name="Phone"
          style={{
            width: FRAME_W,
            height: FRAME_H,
            padding: BEZEL,
            borderRadius: 60,
            background: INK,
            boxShadow: `22px 22px 0 ${ORANGE}`,
            translate: interpolate(frame, [0, 10], ["1200px 0px", "0px 0px"], {
              ...clamp,
              easing: OUT,
            }),
            rotate: interpolate(frame, [0, 10, 26, 32], ["14deg", "-3deg", "-3deg", "0deg"], {
              ...clamp,
              easing: [OUT, (x) => x, SNAP],
            }),
          }}
        >
          <div
            style={{
              position: "relative",
              width: PHONE_W,
              height: SHOT_H * S,
              borderRadius: 48,
              overflow: "hidden",
            }}
          >
            <Img
              src={staticFile("profile.png")}
              style={{ width: PHONE_W, height: SHOT_H * S, display: "block" }}
            />
            {/* Highlighter swipe over the follower count */}
            <div
              style={{
                position: "absolute",
                left: (STAT.x - 6) * S,
                top: (STAT.y + 6) * S,
                width: (STAT.w + 12) * S * marker,
                height: (STAT.h - 12) * S,
                background: ORANGE,
                mixBlendMode: "multiply",
                borderRadius: 6,
              }}
            />
          </div>
        </Interactive.Div>
      </div>

      <Interactive.Div
        name="Sticker"
        style={{
          position: "absolute",
          top: 330,
          left: 0,
          right: 0,
          margin: "0 auto",
          width: "fit-content",
          padding: "10px 56px 24px",
          background: INK,
          color: CREAM,
          fontFamily: ARABIC,
          fontSize: 150,
          fontWeight: 900,
          direction: "rtl",
          rotate: "-5deg",
          boxShadow: `14px 14px 0 ${ORANGE}`,
          scale: String(stamp(frame, 42)),
          opacity: frame >= 42 ? 1 : 0,
        }}
      >
        وصلنا!
      </Interactive.Div>
    </AbsoluteFill>
  );
};
