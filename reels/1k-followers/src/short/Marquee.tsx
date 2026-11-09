import { useCurrentFrame } from "remotion";

// Endless horizontal text band; direction 1 = left, -1 = right.
export const Marquee: React.FC<{
  text: string;
  speed?: number;
  direction?: 1 | -1;
  style?: React.CSSProperties;
  textStyle?: React.CSSProperties;
}> = ({ text, speed = 14, direction = 1, style, textStyle }) => {
  const frame = useCurrentFrame();
  const offset = -((frame * speed) % 1200) * direction - (direction < 0 ? 1200 : 0);
  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap", ...style }}>
      <div style={{ display: "inline-block", translate: `${offset}px 0px` }}>
        {new Array(8).fill(0).map((_, i) => (
          <span key={i} style={{ paddingRight: 40, ...textStyle }}>
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};
