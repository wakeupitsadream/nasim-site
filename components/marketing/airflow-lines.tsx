import { cn } from '@/lib/utils';

// The signature motif: long, thin airflow lines derived from the breeze mark. Pure SVG, drawn
// once at module load; the optional drift is a compositor-only transform under motion-safe.
const WIDTH = 1200;
const HEIGHT = 320;

type Wave = { y: number; amplitude: number; wavelength: number; phase: number };
const WAVES: Wave[] = [
  { y: 40, amplitude: 14, wavelength: 420, phase: 0 },
  { y: 86, amplitude: 22, wavelength: 520, phase: 0.35 },
  { y: 136, amplitude: 12, wavelength: 360, phase: 0.7 },
  { y: 182, amplitude: 24, wavelength: 600, phase: 0.15 },
  { y: 232, amplitude: 16, wavelength: 440, phase: 0.55 },
  { y: 282, amplitude: 10, wavelength: 380, phase: 0.9 },
];

/** A sine-like path from x=0 to x=2·WIDTH (so it can scroll by half of itself seamlessly). */
function wavePath({ y, amplitude, wavelength, phase }: Wave): string {
  const half = wavelength / 2;
  let x = -phase * wavelength;
  let d = `M${x.toFixed(1)} ${y}`;
  let up = true;
  while (x < WIDTH * 2 + wavelength) {
    const peak = up ? y - amplitude : y + amplitude;
    const c1 = (x + half / 3).toFixed(1);
    const c2 = (x + (2 * half) / 3).toFixed(1);
    const end = (x + half).toFixed(1);
    d += ` C${c1} ${peak.toFixed(1)} ${c2} ${peak.toFixed(1)} ${end} ${y}`;
    x += half;
    up = !up;
  }
  return d;
}

const PATHS = WAVES.map(wavePath);

type Props = {
  /** `sand`: turquoise lines on light bands; `deep`: white lines on the dark band. */
  tone?: 'sand' | 'deep';
  /** Slow drift along the flow direction (motion-safe only). */
  drift?: boolean;
  className?: string;
};

/** Decorative; stretches to its box. The flow runs from inline-start to inline-end (mirrors in RTL). */
export function AirflowLines({ tone = 'sand', drift = false, className }: Props) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={cn(
        'pointer-events-none block h-full w-full rtl:-scale-x-100',
        tone === 'deep' ? 'text-on-deep' : 'text-highlight',
        className,
      )}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity={tone === 'deep' ? 0.1 : 0.25}
        strokeLinecap="round"
        className={drift ? 'motion-safe:animate-airflow' : undefined}
      >
        {PATHS.map((d, i) => (
          <path key={i} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  );
}
