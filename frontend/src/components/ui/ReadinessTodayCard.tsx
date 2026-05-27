import type { TrainingReadiness } from '../../types';
import { useT } from '../../hooks/useTranslation';

interface Props {
  data: TrainingReadiness;
}

/* ─────────────────────────────────────────────────────────────
   SVG Ring Gauge
   270° arc, opens at the bottom (7:30 → 4:30 o'clock clockwise).
   Left = Exhausted / Right = Peak. Needle is a coloured dot on the arc.
──────────────────────────────────────────────────────────────── */
function RingGauge({
  tsb,
  color,
  exhaustedLabel,
  peakLabel,
}: {
  tsb: number;
  color: string;
  exhaustedLabel: string;
  peakLabel: string;
}) {
  const CX = 100, CY = 100, R = 68, SW = 14;
  const START = 135;   // degrees — 7:30 o'clock in SVG coords
  const SWEEP = 270;   // degrees — clockwise arc

  const toRad = (d: number) => (d * Math.PI) / 180;
  const pt = (deg: number) => ({
    x: CX + R * Math.cos(toRad(deg)),
    y: CY + R * Math.sin(toRad(deg)),
  });

  const arc = (a: number, b: number) => {
    const s = pt(a), e = pt(b);
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${b - a > 180 ? 1 : 0} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  };

  /* five coloured zones, proportional widths */
  const ZONES = [
    { pct: 0.20, color: '#ef4444' },
    { pct: 0.18, color: '#f97316' },
    { pct: 0.17, color: '#f59e0b' },
    { pct: 0.18, color: '#84cc16' },
    { pct: 0.27, color: '#22c55e' },
  ];
  let cur = START;
  const zoneArcs = ZONES.map((z) => {
    const s = cur;
    const e = (cur += z.pct * SWEEP);
    return { ...z, s, e };
  });

  /* needle position */
  const MIN = -20, MAX = 20;
  const pct = Math.max(0, Math.min(1, (tsb - MIN) / (MAX - MIN)));
  const needleAngle = START + pct * SWEEP;
  const { x: nx, y: ny } = pt(needleAngle);

  const sign = tsb > 0 ? '+' : '';
  const tsbText = `${sign}${Math.round(tsb)}`;

  /* label positions at the arc endpoints */
  const leftPt  = pt(START);           // Exhausted end
  const rightPt = pt(START + SWEEP);   // Peak end

  return (
    <svg
      viewBox="0 0 200 185"
      aria-label={`Training Stress Balance: ${tsbText}`}
      className="w-full max-w-[210px] mx-auto"
    >
      {/* track background */}
      <path
        d={arc(START, START + SWEEP)}
        fill="none"
        stroke="var(--c-subtle)"
        strokeWidth={SW}
        strokeLinecap="round"
      />

      {/* zone colour arcs */}
      {zoneArcs.map((z, i) => (
        <path
          key={i}
          d={arc(z.s, z.e)}
          fill="none"
          stroke={z.color}
          strokeWidth={SW}
          strokeLinecap="butt"
          opacity={0.5}
        />
      ))}

      {/* rounded end caps over zone seams */}
      <path d={arc(START, START + 0.001)}  fill="none" stroke={ZONES[0].color}           strokeWidth={SW} strokeLinecap="round" opacity={0.5} />
      <path d={arc(START + SWEEP - 0.001, START + SWEEP)} fill="none" stroke={ZONES[4].color} strokeWidth={SW} strokeLinecap="round" opacity={0.5} />

      {/* needle: outer glow → filled dot → white core */}
      <circle cx={nx} cy={ny} r={11} fill={color} opacity={0.18} />
      <circle cx={nx} cy={ny} r={7}  fill={color} />
      <circle cx={nx} cy={ny} r={2.5} fill="white" />

      {/* centre: TSB value + label */}
      <text
        x={CX} y={CY - 10}
        textAnchor="middle"
        fontSize="40"
        fontWeight="900"
        fill={color}
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {tsbText}
      </text>
      <text
        x={CX} y={CY + 14}
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill="var(--c-ink3)"
        letterSpacing="2"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        TSB
      </text>

      {/* arc-end labels */}
      <text
        x={leftPt.x - 2}  y={leftPt.y + 17}
        textAnchor="middle"
        fontSize="8"
        fontWeight="600"
        fill="var(--c-ink3)"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {exhaustedLabel}
      </text>
      <text
        x={rightPt.x + 2} y={rightPt.y + 17}
        textAnchor="middle"
        fontSize="8"
        fontWeight="600"
        fill="var(--c-ink3)"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {peakLabel}
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main card
──────────────────────────────────────────────────────────────── */
export function ReadinessTodayCard({ data }: Props) {
  const t = useT();
  const r = t.readiness;

  return (
    <div
      className="card h-full flex flex-col"
      style={{ borderTop: `3px solid ${data.readiness_color}` }}
    >
      {/* Header */}
      <div className="card-header">
        <div className="flex items-center gap-2">
          <span className="text-base">{data.readiness_icon}</span>
          <h2 className="card-title">{r.title}</h2>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0"
          style={{
            backgroundColor: `${data.readiness_color}18`,
            color: data.readiness_color,
            border: `1px solid ${data.readiness_color}33`,
          }}
        >
          {data.readiness_level}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">

        {/* Ring gauge */}
        <RingGauge
          tsb={data.tsb}
          color={data.readiness_color}
          exhaustedLabel={r.exhausted}
          peakLabel={r.peak}
        />

        {/* Advice */}
        <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--c-ink2)' }}>
          {data.readiness_advice}
        </p>

        {/* CTL / ATL */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl px-3 py-2.5 text-center" style={{ backgroundColor: 'var(--c-subtle)' }}>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--c-ink3)' }}>
              {r.fitnessCtl}
            </p>
            <p className="text-2xl font-bold mt-0.5" style={{ color: 'var(--c-ink)' }}>
              {data.ctl.toFixed(0)}
            </p>
          </div>
          <div className="rounded-xl px-3 py-2.5 text-center" style={{ backgroundColor: 'var(--c-subtle)' }}>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--c-ink3)' }}>
              {r.fatigueAtl}
            </p>
            <p
              className="text-2xl font-bold mt-0.5"
              style={{ color: data.atl > data.ctl ? '#ef4444' : 'var(--c-ink)' }}
            >
              {data.atl.toFixed(0)}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
