import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ---------- timing (30 fps, 120 BPM => 1 beat = 15 frames) ----------
export const FPS = 30;
export const BEAT = 15;
export const S1 = 0; // logo slam
export const S2 = 90; // "9 days left"
export const S3 = 210; // day by day: 10 -> 19
export const S4 = 360; // release date + call to action
export const TOTAL = 480;

export type ReelProps = {
  /** Day of the month the countdown starts (today). */
  startDay: number;
  /** Day of the month the game is released. */
  releaseDay: number;
  monthAr: string;
  year: number;
  brand: string;
  audio: "mix" | "sfx" | "none";
};

const C = {
  bg: "#0A0318",
  blue: "#3563DB",
  purple: "#8A55D6",
  pink: "#FF4DB8",
  orange: "#FF9A4D",
  yellow: "#FFB627",
  ink: "#1F0033",
  white: "#FFFFFF",
};
const GRAD = `linear-gradient(180deg, ${C.yellow} 0%, ${C.orange} 28%, ${C.pink} 62%, ${C.purple} 100%)`;
const GRAD_H = `linear-gradient(90deg, ${C.blue}, ${C.pink} 55%, ${C.yellow})`;
const AR = "'Cairo', sans-serif";
const EN = "'Inter', 'Cairo', sans-serif";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outCubic = Easing.out(Easing.cubic);

const gradText: React.CSSProperties = {
  backgroundImage: GRAD,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

// ---------- shared pieces ----------

/** Fades + zooms a scene in and out so cuts feel like a camera push. */
const SceneWrap: React.FC<{ dur: number; children: React.ReactNode }> = ({
  dur,
  children,
}) => {
  const f = useCurrentFrame();
  const inP = interpolate(f, [0, 8], [0, 1], { ...clamp, easing: outCubic });
  const outP = interpolate(f, [dur - 7, dur], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });
  const scale = 0.9 + 0.1 * inP + 0.35 * outP;
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale})`,
        opacity: Math.min(1, inP * 1.5) * (1 - outP),
        filter: outP > 0 ? `blur(${outP * 14}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Decaying camera shake that starts at frame `at`. */
const useShake = (at: number, power = 26) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > 18) return { x: 0, y: 0 };
  const d = Math.exp(-f / 4) * power;
  return { x: Math.sin(f * 2.9) * d, y: Math.cos(f * 3.7) * d };
};

const Flash: React.FC<{ at: number; color?: string; peak?: number }> = ({
  at,
  color = "#fff",
  peak = 0.85,
}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 2, at, at + 10], [0, peak, 0], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: o }} />;
};

/** Expanding neon ring, for impacts. */
const Ring: React.FC<{
  at: number;
  x: number;
  y: number;
  color?: string;
  size?: number;
}> = ({ at, x, y, color = C.pink, size = 900 }) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f > 22) return null;
  const p = interpolate(f, [0, 22], [0, 1], { easing: outCubic });
  const s = size * p;
  return (
    <div
      style={{
        position: "absolute",
        left: x - s / 2,
        top: y - s / 2,
        width: s,
        height: s,
        borderRadius: "50%",
        border: `${14 * (1 - p)}px solid ${color}`,
        opacity: 1 - p,
        boxShadow: `0 0 60px ${color}`,
      }}
    />
  );
};

/** Blurred, darkened artwork used as a full-screen backdrop. */
const Backdrop: React.FC<{ src: string; dark?: number }> = ({
  src,
  dark = 0.62,
}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          inset: -120,
          width: 1320,
          height: 2160,
          objectFit: "cover",
          filter: "blur(38px) saturate(1.35)",
          transform: `scale(${1.05 + f * 0.0008})`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(10,3,24,${dark}) 0%, rgba(40,6,70,${dark * 0.8}) 50%, rgba(10,3,24,${Math.min(1, dark + 0.25)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Scanlines + vignette on top of everything. */
const Overlay: React.FC = () => (
  <>
    <AbsoluteFill
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(0,0,0,0.13) 0px, rgba(0,0,0,0.13) 2px, transparent 2px, transparent 6px)",
        mixBlendMode: "multiply",
      }}
    />
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(5,0,15,0.6) 100%)",
      }}
    />
  </>
);

/** Arabic line whose words pop in one after another. */
const PopWords: React.FC<{
  text: string;
  at: number;
  step?: number;
  style?: React.CSSProperties;
  highlight?: number[];
}> = ({ text, at, step = 5, style, highlight = [] }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        direction: "rtl",
        fontFamily: AR,
        fontWeight: 900,
        textAlign: "center",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {text.split(" ").map((w, i) => {
        const s = spring({
          frame: f - at - i * step,
          fps,
          config: { damping: 11, stiffness: 190 },
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              margin: "0 0.13em",
              opacity: Math.min(1, s * 2),
              transform: `translateY(${(1 - s) * 70}px) scale(${0.5 + 0.5 * s}) rotate(${(1 - s) * -8}deg)`,
              ...(highlight.includes(i) ? gradText : {}),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// ---------- Scene 1: logo slam ----------

const SynthGrid: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: -600,
        right: -600,
        bottom: 0,
        height: 820,
        perspective: 520,
        overflow: "hidden",
        maskImage: "linear-gradient(180deg, transparent 0%, #000 45%)",
        WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 45%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 2400,
          transformOrigin: "50% 0%",
          transform: "rotateX(74deg)",
          backgroundImage: `linear-gradient(${C.pink} 4px, transparent 4px), linear-gradient(90deg, ${C.pink} 4px, transparent 4px)`,
          backgroundSize: "120px 120px",
          backgroundPosition: `0px ${(f * 8) % 120}px`,
          opacity: 0.95,
        }}
      />
    </div>
  );
};

const Scene1: React.FC<ReelProps> = ({ startDay, monthAr }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const HIT = 8;
  const s = spring({
    frame: f - 4,
    fps,
    config: { damping: 13, stiffness: 170, mass: 0.9 },
  });
  const scale = interpolate(s, [0, 1], [3.4, 1]) + Math.sin(f / 14) * 0.012;
  const shake = useShake(HIT, 34);
  const chip = spring({ frame: f - 56, fps, config: { damping: 14 } });
  const glow = 0.55 + 0.25 * Math.sin(f / 6);

  return (
    <SceneWrap dur={S2 - S1}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 62%, #5B1486 0%, #1D0640 45%, ${C.bg} 80%)`,
        }}
      />
      <SynthGrid />
      <AbsoluteFill
        style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}
      >
        {/* rotating light rays behind the logo */}
        <div
          style={{
            position: "absolute",
            left: 540 - 800,
            top: 700 - 800,
            width: 1600,
            height: 1600,
            borderRadius: "50%",
            background: `repeating-conic-gradient(from ${f * 0.7}deg, rgba(255,77,184,0.55) 0deg 8deg, transparent 8deg 24deg)`,
            maskImage:
              "radial-gradient(circle, #000 0%, rgba(0,0,0,0.5) 35%, transparent 68%)",
            WebkitMaskImage:
              "radial-gradient(circle, #000 0%, rgba(0,0,0,0.5) 35%, transparent 68%)",
            opacity: interpolate(f, [HIT, HIT + 10], [0, glow], clamp),
          }}
        />
        <Ring at={HIT} x={540} y={700} size={1700} />
        <Ring at={HIT + 4} x={540} y={700} size={1300} color={C.yellow} />
        <Img
          src={staticFile("logo.png")}
          style={{
            position: "absolute",
            left: 540 - 430,
            top: 700 - 327,
            width: 860,
            transform: `scale(${scale}) rotate(${(1 - s) * -10}deg)`,
            opacity: interpolate(f, [4, 8], [0, 1], clamp),
            filter: `drop-shadow(0 0 ${50 * glow}px rgba(255,77,184,0.9)) drop-shadow(0 30px 40px rgba(0,0,0,0.6))`,
          }}
        />
        <PopWords
          text="العد العكسي بدا!"
          at={30}
          step={6}
          highlight={[1]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1150,
            fontSize: 124,
            color: C.white,
            textShadow: "0 8px 40px rgba(0,0,0,0.8)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1390,
            display: "flex",
            justifyContent: "center",
            opacity: Math.min(1, chip * 1.6),
            transform: `translateY(${(1 - chip) * 80}px)`,
          }}
        >
          <div
            style={{
              direction: "rtl",
              fontFamily: AR,
              fontWeight: 800,
              fontSize: 54,
              color: C.ink,
              background: C.yellow,
              padding: "10px 46px",
              borderRadius: 999,
              boxShadow: `0 0 50px rgba(255,182,39,0.6)`,
            }}
          >
            اليوم · {startDay} {monthAr}
          </div>
        </div>
      </AbsoluteFill>
      <Flash at={HIT} />
    </SceneWrap>
  );
};

// ---------- Scene 2: "9 days left" ----------

/** Number that rolls like an odometer; `v` is a float going down. */
const RollNumber: React.FC<{ v: number; size: number }> = ({ v, size }) => {
  const n = Math.ceil(v);
  const t = n - v; // 0..1 progress towards n-1
  const h = size * 1.08;
  const cell: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    height: h,
    lineHeight: `${h}px`,
    textAlign: "center",
    ...gradText,
  };
  return (
    <div
      style={{
        position: "relative",
        height: h,
        width: size * (n >= 10 ? 1.36 : 0.78),
        overflow: "hidden",
        fontFamily: EN,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: -size * 0.04,
        filter: t > 0.02 && t < 0.98 ? "blur(3px)" : undefined,
      }}
    >
      <div style={{ ...cell, top: -t * h }}>{n}</div>
      <div style={{ ...cell, top: (1 - t) * h }}>{n - 1}</div>
    </div>
  );
};

const Scene2: React.FC<ReelProps> = ({ startDay, releaseDay }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const days = releaseDay - startDay;
  const LAND = 60; // S2 + 60 = frame 150, on the beat
  const v = interpolate(f, [14, LAND], [days + 21, days], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  const punch = spring({
    frame: f - LAND,
    fps,
    config: { damping: 8, stiffness: 200 },
  });
  const card = spring({ frame: f - 2, fps, config: { damping: 16 } });
  const shake = useShake(LAND, 30);
  const labelIn = spring({ frame: f - LAND - 2, fps, config: { damping: 11 } });
  const beat = Math.exp(-((f - LAND) % BEAT) / 5) * (f > LAND ? 1 : 0);

  return (
    <SceneWrap dur={S3 - S2}>
      <Backdrop src="a1.jpg" />
      <AbsoluteFill
        style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}
      >
        {/* artwork card */}
        <div
          style={{
            position: "absolute",
            left: 110,
            top: 190,
            width: 860,
            height: 860,
            perspective: 1400,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 56,
              padding: 8,
              background: GRAD_H,
              boxShadow: `0 40px 120px rgba(0,0,0,0.7), 0 0 ${60 + beat * 60}px rgba(255,77,184,0.55)`,
              transform: `translateY(${(1 - card) * -900}px) rotateY(${Math.sin(f / 22) * 7}deg) rotateX(${Math.cos(f / 27) * 4}deg) rotateZ(${(1 - card) * 14 - 2}deg) scale(${1 + beat * 0.02})`,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 48,
                overflow: "hidden",
              }}
            >
              <Img
                src={staticFile("a1.jpg")}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `scale(${1.08 + f * 0.0012})`,
                }}
              />
            </div>
          </div>
        </div>

        <PopWords
          text="بقاو غير"
          at={8}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1085,
            fontSize: 104,
            color: C.white,
            textShadow: "0 8px 40px rgba(0,0,0,0.8)",
          }}
        />
        <Ring at={LAND} x={540} y={1500} size={1500} />
        <Ring at={LAND + 3} x={540} y={1500} size={1100} color={C.yellow} />
        {/* number + unit, right-to-left: number on the right */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1240,
            display: "flex",
            flexDirection: "row-reverse",
            justifyContent: "center",
            alignItems: "center",
            gap: 36,
            transform: `scale(${f < LAND ? 1 : interpolate(punch, [0, 1], [1.3, 1])})`,
            filter: `drop-shadow(0 0 ${40 + beat * 50}px rgba(255,77,184,0.75))`,
          }}
        >
          <RollNumber v={v} size={430} />
          <div
            style={{
              fontFamily: AR,
              fontWeight: 900,
              fontSize: 160,
              color: C.white,
              opacity: Math.min(1, labelIn * 2),
              transform: `translateX(${(1 - labelIn) * -120}px) scale(${0.6 + 0.4 * labelIn})`,
              textShadow: "0 8px 40px rgba(0,0,0,0.8)",
            }}
          >
            أيام
          </div>
        </div>
      </AbsoluteFill>
      <Flash at={LAND} color={C.pink} peak={0.55} />
    </SceneWrap>
  );
};

// ---------- Scene 3: day by day ----------

const SHOTS = [
  { src: "a2.jpg", pos: "62% 50%" },
  { src: "a3.jpg", pos: "50% 50%" },
  { src: "a4.jpg", pos: "45% 50%" },
  { src: "a1.jpg", pos: "50% 20%" },
  { src: "a5.jpg", pos: "50% 50%" },
];

const Shot: React.FC<{ i: number; x: number; rot: number; f: number }> = ({
  i,
  x,
  rot,
  f,
}) => {
  const shot = SHOTS[i % SHOTS.length];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 56,
        padding: 8,
        background: GRAD_H,
        transform: `translateX(${x}px) rotate(${rot}deg)`,
        boxShadow: "0 40px 120px rgba(0,0,0,0.7)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 48,
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile(shot.src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: shot.pos,
            transform: `scale(${1.06 + f * 0.004})`,
          }}
        />
      </div>
    </div>
  );
};

const Scene3: React.FC<ReelProps> = ({ startDay, releaseDay, monthAr }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const days = releaseDay - startDay;
  const tick = Math.min(days, Math.floor(f / BEAT)); // 0..days
  const tf = f - tick * BEAT; // frames since this tick
  const left = days - tick;
  const pop = spring({
    frame: tf,
    fps,
    config: { damping: 9, stiffness: 220 },
  });
  const isLast = left === 0;

  // image changes every 2 beats
  const seg = Math.min(SHOTS.length - 1, Math.floor(f / (BEAT * 2)));
  const sf = f - seg * BEAT * 2;
  const dir = seg % 2 === 0 ? 1 : -1;
  const enter =
    seg === 0
      ? 1
      : spring({ frame: sf, fps, config: { damping: 18, stiffness: 160 } });
  const beat = Math.exp(-tf / 4);
  const shake = useShake(days * BEAT, 30);

  const cellW = Math.floor((920 - (days + 1 - 1) * 12) / (days + 1));

  return (
    <SceneWrap dur={S4 - S3}>
      <Backdrop src={SHOTS[seg].src} dark={0.7} />
      <AbsoluteFill
        style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}
      >
        <div
          style={{
            position: "absolute",
            left: 70,
            top: 210,
            width: 940,
            height: 720,
            transform: `scale(${1 + beat * 0.025})`,
          }}
        >
          {seg > 0 && enter < 0.995 ? (
            <Shot
              i={seg - 1}
              x={-enter * dir * 1200}
              rot={-enter * dir * 10}
              f={sf + 30}
            />
          ) : null}
          <Shot
            i={seg}
            x={(1 - enter) * dir * 1200}
            rot={(1 - enter) * dir * 10}
            f={sf}
          />
        </div>

        {/* J-9 ... J-1, then the day itself */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 985,
            height: 330,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontFamily: EN,
            fontWeight: 900,
            fontSize: isLast ? 250 : 300,
            letterSpacing: -8,
            transform: `scale(${interpolate(pop, [0, 1], [isLast ? 1.8 : 1.3, 1])}) translateY(${(1 - Math.min(1, pop * 1.4)) * 60}px)`,
            filter: `drop-shadow(0 0 ${30 + beat * 60}px rgba(255,77,184,0.8))`,
            ...gradText,
          }}
        >
          {isLast ? "JOUR J" : `J-${left}`}
        </div>

        {/* calendar strip, right-to-left */}
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            top: 1360,
            display: "flex",
            flexDirection: "row-reverse",
            gap: 12,
            justifyContent: "center",
          }}
        >
          {new Array(days + 1).fill(0).map((_, i) => {
            const done = i < tick;
            const active = i === tick;
            const final = i === days;
            return (
              <div
                key={i}
                style={{
                  width: cellW,
                  height: 124,
                  borderRadius: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: EN,
                  fontWeight: 900,
                  fontSize: 46,
                  color: active ? C.ink : done ? "rgba(255,255,255,0.5)" : C.white,
                  background: active
                    ? C.yellow
                    : done
                      ? "rgba(255,77,184,0.35)"
                      : "rgba(255,255,255,0.1)",
                  border: `3px solid ${active ? C.yellow : final ? C.pink : "rgba(255,255,255,0.22)"}`,
                  boxShadow: active
                    ? `0 0 ${30 + beat * 40}px rgba(255,182,39,0.9)`
                    : undefined,
                  transform: active
                    ? `translateY(${-18 * pop}px) scale(${1 + 0.18 * pop})`
                    : undefined,
                }}
              >
                {startDay + i}
              </div>
            );
          })}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1530,
            textAlign: "center",
            direction: "rtl",
            fontFamily: AR,
            fontWeight: 800,
            fontSize: 60,
            color: C.white,
            textShadow: "0 6px 30px rgba(0,0,0,0.8)",
          }}
        >
          {isLast ? "نهار الإطلاق!" : `${startDay + tick} ${monthAr}`}
        </div>
      </AbsoluteFill>
      <Flash at={days * BEAT} peak={0.8} />
    </SceneWrap>
  );
};

// ---------- Scene 4: release date + CTA ----------

const Scene4: React.FC<ReelProps> = ({ releaseDay, monthAr, year, brand }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const HIT = 15;
  const logo = spring({ frame: f - 2, fps, config: { damping: 13 } });
  const date = spring({
    frame: f - HIT + 3,
    fps,
    config: { damping: 10, stiffness: 190 },
  });
  const shake = useShake(HIT, 28);
  const cta = spring({ frame: f - 62, fps, config: { damping: 12 } });
  const beat = Math.exp(-((f - HIT + BEAT * 4) % BEAT) / 5);
  const sweep = interpolate(f, [70, 100], [-30, 130], clamp);

  return (
    <AbsoluteFill
      style={{
        opacity: interpolate(f, [0, 6], [0, 1], clamp),
        background: C.bg,
      }}
    >
      <AbsoluteFill
        style={{
          transform: `translate(${shake.x}px, ${shake.y}px)`,
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile("a5.jpg")}
          style={{
            position: "absolute",
            top: 300,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "52% 50%",
            transformOrigin: "50% 0%",
            transform: `scale(${interpolate(f, [0, 120], [1.22, 1.06], { easing: outCubic })}) translateY(${f * 0.15}px)`,
          }}
        />
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(180deg, rgba(10,3,24,1) 0%, rgba(10,3,24,1) 16%, rgba(10,3,24,0) 27%, rgba(10,3,24,0) 48%, rgba(10,3,24,0.86) 66%, rgba(10,3,24,0.97) 100%)",
          }}
        />
        <Img
          src={staticFile("logo.png")}
          style={{
            position: "absolute",
            left: 540 - 205,
            top: 100,
            width: 410,
            opacity: Math.min(1, logo * 2),
            transform: `translateY(${(1 - logo) * -260}px) scale(${1 + beat * 0.03})`,
            filter:
              "drop-shadow(0 0 40px rgba(255,77,184,0.8)) drop-shadow(0 20px 30px rgba(0,0,0,0.6))",
          }}
        />
        <Ring at={HIT} x={540} y={1290} size={1600} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1150,
            textAlign: "center",
            direction: "rtl",
            fontFamily: AR,
            fontWeight: 900,
            fontSize: 150,
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            opacity: Math.min(1, date * 3),
            transform: `scale(${interpolate(date, [0, 1], [2.4, 1])})`,
            filter: `drop-shadow(0 0 ${30 + beat * 40}px rgba(255,77,184,0.8))`,
            ...gradText,
          }}
        >
          {releaseDay} {monthAr} {year}
        </div>
        <PopWords
          text="واش نتا واجد؟"
          at={34}
          step={6}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1365,
            fontSize: 96,
            color: C.white,
            textShadow: "0 8px 40px rgba(0,0,0,0.9)",
          }}
        />
        {/* follow pill */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1560,
            display: "flex",
            justifyContent: "center",
            opacity: Math.min(1, cta * 2),
            transform: `translateY(${(1 - cta) * 90}px) scale(${0.8 + 0.2 * cta})`,
          }}
        >
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "row-reverse",
              alignItems: "center",
              gap: 20,
              padding: "14px 50px",
              borderRadius: 999,
              background: C.white,
              color: C.ink,
              fontFamily: AR,
              fontWeight: 900,
              fontSize: 52,
              whiteSpace: "nowrap",
              boxShadow: "0 0 60px rgba(255,77,184,0.7)",
            }}
          >
            <span style={{ direction: "rtl" }}>تابع</span>
            <span style={{ fontFamily: EN, fontWeight: 900, color: "#D6249F" }}>
              {brand}
            </span>
            <span style={{ direction: "rtl" }}>للجديد</span>
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${sweep}%`,
                width: 90,
                background:
                  "linear-gradient(90deg, transparent, rgba(255,77,184,0.45), transparent)",
                transform: "skewX(-20deg)",
              }}
            />
          </div>
        </div>
      </AbsoluteFill>
      <Flash at={HIT} color={C.pink} peak={0.5} />
    </AbsoluteFill>
  );
};

// ---------- the reel ----------

export const Reel: React.FC<ReelProps> = (props) => {
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence from={S1} durationInFrames={S2 - S1} name="Logo slam">
        <Scene1 {...props} />
      </Sequence>
      <Sequence from={S2} durationInFrames={S3 - S2} name="Days left">
        <Scene2 {...props} />
      </Sequence>
      <Sequence from={S3} durationInFrames={S4 - S3} name="Day by day">
        <Scene3 {...props} />
      </Sequence>
      <Sequence from={S4} durationInFrames={TOTAL - S4} name="Release date">
        <Scene4 {...props} />
      </Sequence>
      <Flash at={S2} color={C.pink} peak={0.45} />
      <Flash at={S3} color={C.pink} peak={0.45} />
      <Overlay />
      {props.audio !== "none" ? (
        <Audio src={staticFile(`${props.audio}.wav`)} />
      ) : null}
    </AbsoluteFill>
  );
};
