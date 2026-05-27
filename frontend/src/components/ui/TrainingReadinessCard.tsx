import type { TrainingReadiness } from '../../types';
import { useT } from '../../hooks/useTranslation';

interface Props {
  data: TrainingReadiness;
}

/* ── Gauge bar ─────────────────────────────────────────── */
function TSBGauge({ tsb }: { tsb: number }) {
  const t = useT();
  const r = t.readiness;
  const MIN = -20, MAX = 20;
  const pct = Math.max(0, Math.min(100, ((tsb - MIN) / (MAX - MIN)) * 100));

  return (
    <div className="space-y-1">
      <div className="relative h-2.5 rounded-full overflow-hidden flex">
        {[
          { color: '#ef4444', w: 20 },
          { color: '#f97316', w: 18 },
          { color: '#f59e0b', w: 17 },
          { color: '#84cc16', w: 18 },
          { color: '#22c55e', w: 27 },
        ].map((s, i) => (
          <div key={i} style={{ width: `${s.w}%`, backgroundColor: s.color, opacity: 0.4 }} />
        ))}
        <div
          className="absolute top-0 bottom-0 w-0.5 rounded-full"
          style={{
            left: `${pct}%`,
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--c-ink)',
            boxShadow: '0 0 4px rgba(0,0,0,0.5)',
          }}
        />
      </div>
      <div className="flex justify-between text-[9px] font-medium uppercase tracking-wider" style={{ color: 'var(--c-ink3)' }}>
        <span>{r.exhausted}</span>
        <span>{r.tired}</span>
        <span>{r.moderate}</span>
        <span>{r.fresh}</span>
        <span>{r.peak}</span>
      </div>
    </div>
  );
}

/* ── Mini metric cell (for the 2×3 grid) ──────────────── */
function MetricCell({
  icon, label, value, sub, accent,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      className="flex flex-col justify-center px-3 py-2.5 rounded-xl"
      style={{ backgroundColor: 'var(--c-subtle)' }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--c-ink3)' }}>
          {label}
        </span>
      </div>
      <span
        className="text-xl font-bold leading-tight"
        style={{ color: accent ?? 'var(--c-ink)' }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[10px] mt-0.5" style={{ color: 'var(--c-ink3)' }}>
          {sub}
        </span>
      )}
    </div>
  );
}

/* ── Main card ─────────────────────────────────────────── */
export function TrainingReadinessCard({ data }: Props) {
  const t = useT();
  const r = t.readiness;
  const tsbSign = data.tsb > 0 ? '+' : '';

  const rampStatus =
    data.atl > data.ctl + 15
      ? { label: r.highRamp,     color: '#ef4444' }
      : data.atl > data.ctl + 5
      ? { label: r.moderateRamp, color: '#f59e0b' }
      : data.ctl > data.atl + 10
      ? { label: r.detrained,    color: '#6b7280' }
      : { label: r.balanced,     color: '#22c55e' };

  const restSub =
    data.days_since_last === 0
      ? r.trainedToday
      : data.days_since_last === 1
      ? r.sinceLastActivity
      : r.daysWithoutTraining;

  return (
    <div
      className="card overflow-hidden"
      style={{ borderLeft: `3px solid ${data.readiness_color}` }}
    >
      <div className="flex flex-col lg:flex-row">

        {/* ── LEFT: metrics 2×3 grid ─────────────────── */}
        <div
          className="lg:w-[38%] shrink-0 p-5 space-y-3"
          style={{ borderRight: '1px solid var(--c-border)' }}
        >
          {/* header */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{
                backgroundColor: `${data.readiness_color}18`,
                border: `1px solid ${data.readiness_color}33`,
              }}
            >
              {data.readiness_icon}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--c-ink3)' }}>
                {r.title}
              </p>
              <p className="text-sm font-bold leading-tight" style={{ color: data.readiness_color }}>
                {data.readiness_title}
              </p>
            </div>
          </div>

          {/* 2 col × 3 row metrics grid */}
          <div className="grid grid-cols-2 gap-2">
            <MetricCell
              icon="💪"
              label={r.fitnessCtl}
              value={data.ctl.toFixed(0)}
              sub="42-day avg TRIMP"
              accent="var(--c-ink)"
            />
            <MetricCell
              icon="🔥"
              label={r.fatigueAtl}
              value={data.atl.toFixed(0)}
              sub="7-day avg TRIMP"
              accent={data.atl > data.ctl ? '#ef4444' : 'var(--c-ink)'}
            />
            <MetricCell
              icon="📅"
              label={r.thisWeek}
              value={data.weekly_trimp.toFixed(0)}
              sub="TRIMP load"
            />
            <MetricCell
              icon="😴"
              label={r.restDays}
              value={data.days_since_last != null ? String(data.days_since_last) : '—'}
              sub={restSub}
            />
            <MetricCell
              icon="📆"
              label={r.monthly}
              value={data.monthly_trimp.toFixed(0)}
              sub="28-day TRIMP"
            />
            <MetricCell
              icon="⚖️"
              label={r.loadRamp}
              value={rampStatus.label}
              sub={`ATL ${data.atl > data.ctl ? '>' : '≤'} CTL`}
              accent={rampStatus.color}
            />
          </div>
        </div>

        {/* ── RIGHT: TSB + gauge + advice ────────────── */}
        <div className="flex-1 p-5 flex flex-col justify-between gap-4">

          {/* TSB score + gauge */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--c-ink3)' }}>
                  {r.tsb}
                </p>
                <p
                  className="text-5xl font-black leading-tight"
                  style={{ color: data.tsb >= 0 ? '#22c55e' : '#ef4444' }}
                >
                  {tsbSign}{data.tsb.toFixed(0)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--c-ink3)' }}>
                  CTL − ATL = {data.ctl.toFixed(0)} − {data.atl.toFixed(0)}
                </p>
              </div>
              <div
                className="px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
                style={{
                  backgroundColor: `${data.readiness_color}18`,
                  color: data.readiness_color,
                  border: `1px solid ${data.readiness_color}33`,
                }}
              >
                {data.readiness_level.toUpperCase()}
              </div>
            </div>

            <TSBGauge tsb={data.tsb} />
          </div>

          {/* Advice */}
          <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--c-ink2)' }}>
            {data.readiness_advice}
          </p>

          {/* Footnote */}
          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--c-ink3)' }}>
            {r.footnote}
          </p>
        </div>
      </div>
    </div>
  );
}
