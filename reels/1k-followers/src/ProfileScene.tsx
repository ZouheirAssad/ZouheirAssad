import {
  AbsoluteFill,
  Easing,
  Img,
  Interactive,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Background } from "./Background";
import { Confetti } from "./Confetti";
import { ARABIC, COLORS, HEIGHT, LATIN, WIDTH } from "./theme";

// Screenshot: public/profile.png (1008×2244). "1,000 followers" lives in this box.
const SHOT_W = 1008;
const SHOT_H = 2244;
const STAT = { x: 455, y: 395, w: 205, h: 120 };

const PHONE_W = 760;
const BEZEL = 16;
const S = PHONE_W / SHOT_W; // screenshot → screen scale
const FRAME_W = PHONE_W + BEZEL * 2;
const FRAME_H = SHOT_H * S + BEZEL * 2;
const LEFT0 = (WIDTH - FRAME_W) / 2;
const TOP0 = (HEIGHT - FRAME_H) / 2 + 40;

// Stat centre inside the phone frame (frame coordinates).
const PX = BEZEL + (STAT.x + STAT.w / 2) * S;
const PY = BEZEL + (STAT.y + STAT.h / 2) * S;
// Where the stat ends up on screen once zoomed.
const TARGET = { x: WIDTH / 2, y: 820 };
const ZOOM = 2.9;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Real profile screenshot: phone rises in, camera zooms into "1,000 followers".
export const ProfileScene: React.FC = () => {
  const frame = useCurrentFrame();

  const zoomP = interpolate(frame, [38, 68], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.65, 0, 0.2, 1),
  });
  // Final punch-in into the number before cutting to the next scene.
  const punch = interpolate(frame, [104, 120], [1, 2.2], {
    ...clamp,
    easing: Easing.bezier(0.6, 0, 0.9, 0.4),
  });
  const z = interpolate(zoomP, [0, 1], [1, ZOOM]) * punch;
  const statX = interpolate(zoomP, [0, 1], [LEFT0 + PX, TARGET.x]);
  const statY = interpolate(zoomP, [0, 1], [TOP0 + PY, TARGET.y]);
  const tx = statX - LEFT0 - z * PX;
  const ty = statY - TOP0 - z * PY;

  const highlight = interpolate(frame, [62, 78], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.33, 1, 0.68, 1),
  });
  const perimeter = 2 * (STAT.w + STAT.h) * S;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background />

      {/* Phone with the screenshot; the zoom moves this whole layer */}
      <div
        style={{
          position: "absolute",
          left: LEFT0,
          top: TOP0,
          width: FRAME_W,
          height: FRAME_H,
          transformOrigin: "0 0",
          translate: `${tx}px ${ty}px`,
          scale: String(z),
        }}
      >
        <Interactive.Div
          name="Phone"
          style={{
            width: FRAME_W,
            height: FRAME_H,
            borderRadius: 72,
            padding: BEZEL,
            background: "linear-gradient(145deg, #2A2A33, #0E0E12)",
            boxShadow: `0 40px 120px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.08), 0 0 80px ${COLORS.orange}33`,
            translate: interpolate(frame, [0, 20], ["0px 1400px", "0px 0px"], {
              ...clamp,
              easing: Easing.spring({ damping: 16 }),
            }),
            rotate: interpolate(frame, [0, 22], ["-8deg", "0deg"], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          <div
            style={{
              position: "relative",
              width: PHONE_W,
              height: SHOT_H * S,
              borderRadius: 58,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            <Img
              src={staticFile("profile.png")}
              style={{ width: PHONE_W, height: SHOT_H * S, display: "block" }}
            />
            {/* Dim everything except the follower count */}
            <svg
              width={PHONE_W}
              height={SHOT_H * S}
              style={{ position: "absolute", inset: 0 }}
            >
              <defs>
                <mask id="spot">
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x={STAT.x * S}
                    y={STAT.y * S}
                    width={STAT.w * S}
                    height={STAT.h * S}
                    rx={14}
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="#0A0A0F"
                mask="url(#spot)"
                opacity={interpolate(frame, [60, 76], [0, 0.92], clamp)}
              />
              <rect
                x={STAT.x * S}
                y={STAT.y * S}
                width={STAT.w * S}
                height={STAT.h * S}
                rx={14}
                fill="none"
                stroke={COLORS.orange}
                strokeWidth={5}
                strokeDasharray={perimeter}
                strokeDashoffset={perimeter * (1 - highlight)}
                style={{ filter: `drop-shadow(0 0 8px ${COLORS.orange})` }}
              />
            </svg>
          </div>
        </Interactive.Div>
      </div>

      <Sequence name="Sparkle burst" from={70} layout="absolute-fill">
        <Confetti count={70} originY={TARGET.y} seed="profile" />
      </Sequence>

      <AbsoluteFill
        style={{
          alignItems: "center",
          color: COLORS.text,
          opacity: interpolate(frame, [104, 112], [1, 0], clamp),
        }}
      >
        <Interactive.Div
          name="Caption"
          style={{
            position: "absolute",
            top: 330,
            fontFamily: ARABIC,
            fontSize: 130,
            fontWeight: 900,
            direction: "rtl",
            textShadow: `0 10px 40px ${COLORS.orange}AA`,
            scale: interpolate(frame, [74, 84], [0.4, 1], {
              ...clamp,
              easing: Easing.spring({ damping: 10 }),
              output: "perceptual-scale",
            }),
            opacity: interpolate(frame, [74, 78], [0, 1], clamp),
          }}
        >
          وصلنا!
        </Interactive.Div>
        <Interactive.Div
          name="Caption EN"
          style={{
            position: "absolute",
            top: 1080,
            fontFamily: LATIN,
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: 2,
            padding: "16px 36px",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.orange})`,
            color: COLORS.bg,
            opacity: interpolate(frame, [82, 88], [0, 1], clamp),
            translate: interpolate(frame, [82, 94], ["0px 40px", "0px 0px"], {
              ...clamp,
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          We made it
        </Interactive.Div>
      </AbsoluteFill>

      {/* Fade to black into the counter */}
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.bg,
          opacity: interpolate(frame, [110, 120], [0, 1], clamp),
        }}
      />
    </AbsoluteFill>
  );
};
