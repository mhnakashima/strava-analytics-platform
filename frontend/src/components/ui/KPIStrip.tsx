import type React from 'react';
import { formatDuration, formatPace } from '../../lib/utils';
import type { ActivityKPIs } from '../../types';
import { useT } from '../../hooks/useTranslation';

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
}

function KPICard({ label, value, sub, icon, accent = 'text-strava-orange' }: KPICardProps) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-2" style={{ backgroundColor: 'var(--c-raised)', border: '1px solid var(--c-border)' }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest leading-tight" style={{ color: 'var(--c-ink3)' }}>{label}</span>
        <span className={`${accent} opacity-60`}>{icon}</span>
      </div>
      <span className="text-xl font-bold leading-none" style={{ color: 'var(--c-ink)' }}>{value}</span>
      {sub && <span className="text-[10px]" style={{ color: 'var(--c-ink3)' }}>{sub}</span>}
    </div>
  );
}

interface Props {
  kpis: ActivityKPIs;
}

export function KPIStrip({ kpis }: Props) {
  const t = useT();

  return (
    <div className="grid grid-cols-2 gap-3">
      <KPICard
        label={t.kpis.distance}
        value={`${kpis.total_distance_km.toFixed(0)} km`}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        }
      />
      <KPICard
        label={t.kpis.activities}
        value={String(kpis.total_activities)}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      />
      <KPICard
        label={t.kpis.avgPace}
        value={formatPace(kpis.avg_pace_sec_km)}
        sub={t.common.perKmRunning}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        }
      />
      <KPICard
        label={t.kpis.avgHR}
        value={kpis.avg_heartrate ? `${kpis.avg_heartrate.toFixed(0)} ${t.common.bpm}` : '—'}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        }
        accent="text-red-400"
      />
      <KPICard
        label={t.kpis.calories}
        value={kpis.total_calories > 0 ? `${(kpis.total_calories / 1000).toFixed(1)}k` : '—'}
        sub={t.common.kcalTotal}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
          </svg>
        }
        accent="text-amber-400"
      />
      <KPICard
        label={t.kpis.avgLoad}
        value={kpis.avg_training_load != null ? kpis.avg_training_load.toFixed(0) : '—'}
        sub="TRIMP / session"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
        accent="text-purple-400"
      />
    </div>
  );
}
