/** Tacómetro decorativo (SVG puro) para la portada; con `animated`, la aguja acelera y queda en ralentí. */
export function Tachometer({ className, animated = false }: { className?: string; animated?: boolean }) {
  const cx = 150;
  const cy = 150;
  const r = 120;
  const start = 135;
  const sweep = 270;
  const ticks = Array.from({ length: 41 }, (_, i) => i);

  const point = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)] as const;
  };

  const arc = (from: number, to: number, radius: number) => {
    const [x1, y1] = point(from, radius);
    const [x2, y2] = point(to, radius);
    const large = to - from > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };

  const redline = start + sweep * 0.78;
  const needle = start + sweep * 0.86;
  const [nx, ny] = point(needle, r - 22);

  return (
    <svg viewBox="0 0 300 300" aria-hidden="true" className={className}>
      <defs>
        <filter id="tachometer-neon" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={arc(start, start + sweep, r)} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="2" />
      <path
        d={arc(redline, start + sweep, r)}
        fill="none"
        stroke="#ff2a2a"
        strokeWidth="6"
        strokeLinecap="round"
        filter={animated ? "url(#tachometer-neon)" : undefined}
        className={animated ? "animate-redline" : undefined}
      />
      {ticks.map((i) => {
        const angle = start + (sweep / 40) * i;
        const major = i % 5 === 0;
        const [x1, y1] = point(angle, r - (major ? 18 : 10));
        const [x2, y2] = point(angle, r - 2);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={angle >= redline ? "#e10600" : "rgb(255 255 255 / 0.45)"}
            strokeWidth={major ? 3 : 1.5}
            strokeLinecap="round"
          />
        );
      })}
      {Array.from({ length: 9 }, (_, i) => {
        const [x, y] = point(start + (sweep / 8) * i, r - 34);
        return (
          <text
            key={i}
            x={x}
            y={y}
            fill={i >= 7 ? "#ff3020" : "rgb(255 255 255 / 0.6)"}
            fontSize="14"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
            fontStyle="italic"
          >
            {i}
          </text>
        );
      })}
      <g
        className={animated ? "animate-needle" : undefined}
        filter={animated ? "url(#tachometer-neon)" : undefined}
        style={{ transformBox: "view-box", transformOrigin: `${cx}px ${cy}px` }}
      >
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#ff3020" strokeWidth="4" strokeLinecap="round" />
      </g>
      <circle cx={cx} cy={cy} r="12" fill="#18181b" stroke="#ff3020" strokeWidth="3" />
      <text
        x={cx}
        y={cy + 52}
        fill="rgb(255 255 255 / 0.5)"
        fontSize="11"
        letterSpacing="3"
        textAnchor="middle"
        fontWeight="600"
      >
        RPM × 1000
      </text>
    </svg>
  );
}
