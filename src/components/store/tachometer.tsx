import { cn } from "@/lib/cn";

const CX = 150;
const CY = 150;
const R = 120;
const START = 135;
const SWEEP = 270;
const REDLINE = START + SWEEP * 0.78;
const NEEDLE = START + SWEEP * 0.86;

function point(angle: number, radius: number) {
  const rad = (angle * Math.PI) / 180;
  return [CX + radius * Math.cos(rad), CY + radius * Math.sin(rad)] as const;
}

function arc(from: number, to: number, radius: number) {
  const [x1, y1] = point(from, radius);
  const [x2, y2] = point(to, radius);
  const large = to - from > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
}

/** Halo de neón para la zona roja y la aguja. */
function NeonFilter({ id }: { id: string }) {
  return (
    <defs>
      <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

function RedlineArc({ filter }: { filter?: string }) {
  return (
    <path
      d={arc(REDLINE, START + SWEEP, R)}
      fill="none"
      stroke="#ff2a2a"
      strokeWidth="6"
      strokeLinecap="round"
      filter={filter}
    />
  );
}

function Needle({ filter }: { filter?: string }) {
  const [nx, ny] = point(NEEDLE, R - 22);
  return (
    <>
      <line x1={CX} y1={CY} x2={nx} y2={ny} stroke="#ff3020" strokeWidth="4" strokeLinecap="round" filter={filter} />
      <circle cx={CX} cy={CY} r="12" fill="#18181b" stroke="#ff3020" strokeWidth="3" />
    </>
  );
}

/** Esfera: arco, marcas, números y la leyenda. */
function Dial({ withRedline }: { withRedline: boolean }) {
  return (
    <>
      <path d={arc(START, START + SWEEP, R)} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="2" />
      {withRedline && <RedlineArc />}
      {Array.from({ length: 41 }, (_, i) => {
        const angle = START + (SWEEP / 40) * i;
        const major = i % 5 === 0;
        const [x1, y1] = point(angle, R - (major ? 18 : 10));
        const [x2, y2] = point(angle, R - 2);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={angle >= REDLINE ? "#e10600" : "rgb(255 255 255 / 0.45)"}
            strokeWidth={major ? 3 : 1.5}
            strokeLinecap="round"
          />
        );
      })}
      {Array.from({ length: 9 }, (_, i) => {
        const [x, y] = point(START + (SWEEP / 8) * i, R - 34);
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
      <text
        x={CX}
        y={CY + 52}
        fill="rgb(255 255 255 / 0.5)"
        fontSize="11"
        letterSpacing="3"
        textAnchor="middle"
        fontWeight="600"
      >
        RPM × 1000
      </text>
    </>
  );
}

/**
 * Tacómetro decorativo para la portada. Con `animated`, la zona roja y la aguja van en capas propias
 * que solo cambian opacidad o giran: las anima la GPU y el dibujo SVG nunca se vuelve a pintar.
 */
export function Tachometer({ className, animated = false }: { className?: string; animated?: boolean }) {
  if (!animated) {
    return (
      <svg viewBox="0 0 300 300" aria-hidden="true" className={className}>
        <Dial withRedline />
        <Needle />
      </svg>
    );
  }
  return (
    <div aria-hidden="true" className={cn("relative", className)}>
      <svg viewBox="0 0 300 300" className="block h-auto w-full">
        <Dial withRedline={false} />
      </svg>
      <div className="absolute inset-0 animate-redline">
        <svg viewBox="0 0 300 300" className="size-full">
          <NeonFilter id="tachometer-neon-redline" />
          <RedlineArc filter="url(#tachometer-neon-redline)" />
        </svg>
      </div>
      <div className="absolute inset-0 animate-needle">
        <svg viewBox="0 0 300 300" className="size-full">
          <NeonFilter id="tachometer-neon-needle" />
          <Needle filter="url(#tachometer-neon-needle)" />
        </svg>
      </div>
    </div>
  );
}
