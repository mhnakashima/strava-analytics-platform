import type { TrainingReadiness } from '../../types';
import { useT } from '../../hooks/useTranslation';

interface Props {
  data: TrainingReadiness;
}

function TSBGauge({ tsb, color }: { tsb: number; color: string }) {
  const t = useT();
  const r = t.readiness;
  const MIN = -20, MAX = 20;
  const pct = Math.max(0, Math.min(100, ((tsb - MIN) / (MAX - MIN)) * 100));

  return (
    <div className="space-y-1.5">
      <div className="relative h-2 rounded-full overflow-hidden flex">
        {[
          { c: '#ef4444', w: 20 },
          { c: '#f97316', w: 18 },
          { c: '#f59e0b', w: 17 },
          { c: '#84cc16', w: 18 },
          { c: '#22c55e', w: 27 },
        ].map((s, i) => (
          <div key={i} style={{ width: `${s.w}%`, backgroundColor: s.c, opacity: 0.35 }} />
        ))}
        {/* needle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 rounded-full shadow"
          style={{ left: `${pct}%`, transform: 'translateX(-50%)', backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ink3)' }}>
        <span>{r.exhausted}</span>
        <span>{r.tired}</span>
        <span>{r.moderate}</span>
        <span>{r.fresh}</span>
        <span>{r.peak}</span>
      </div>
    </div>
  );
}

export function ReadinessTodayCard({ data }: Props) {
  const t = useT();
  const r = t.readiness;
  const tsbSign = data.tsb > 0 ? '+' : '';

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
          className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest"
          style={{
            backgroundColor: `${data.readiness_color}18`,
            color: data.readiness_color,
            border: `1px solid ${data.readiness_color}33`,
          }}
        >
          {data.readiness_level}
        </span>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4">

        {/* TSB big number */}
        <div className="text-center">
          <p
            className="text-6xl font-black leading-none tabular-nums"
            style={{ color: data.readiness_color }}
          >
            {tsbSign}{data.tsb.toFixed(0)}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-widest mt-1" style={{ color: 'var(--c-ink3)' }}>
            {r.tsb}
          </p>
        </div>

        {/* Gauge */}
        <TSBGauge tsb={data.tsb} color={data.readiness_color} />

        {/* Advice — the "what to do today" core */}
        <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--c-ink2)' }}>
          {data.readiness_advice}
        </p>

        {/* CTL / ATL bottom row */}
        <div className="grid grid-cols-2 gap-2">
          <div
            className="rounded-xl px-3 py-2 text-center"
            style={{ backgroundColor: 'var(--c-subtle)' }}
          >
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--c-ink3)' }}>
              {r.fitnessCtl}
            </p>
            <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--c-ink)' }}>
              {data.ctl.toFixed(0)}
            </p>
          </div>
          <div
            className="rounded-xl px-3 py-2 text-center"
            style={{ backgroundColor: 'var(--c-subtle)' }}
          >
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--c-ink3)' }}>
              {r.fatigueAtl}
            </p>
            <p
              className="text-xl font-bold mt-0.5"
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
