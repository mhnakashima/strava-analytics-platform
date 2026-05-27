import type React from 'react';
import { formatPace } from '../../lib/utils';
import type { ActivityKPIs } from '../../types';

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
}

function KPICard({ label, value, sub, icon, accent = 'text-strava-orange' }: KPICardProps) {
  return (
    <div className="card p-4 flex flex-col gap-2 hover:border-c-ink3 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-c-ink3 uppercase tracking-widest leading-tight">{label}</span>
        <span className={`${accent} opacity-70`}>{icon}</span>
      </div>
      <span className="text-2xl font-bold text-c-ink leading-none">{value}</span>
      {sub && <span className="text-xs text-c-ink3">{sub}</span>}
    </div>
  );
}

interface Props {
  kpis: ActivityKPIs;
}

export function KPIStrip({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      <KPICard
        label="Distance"
        value={`${kpis.total_distance_km.toFixed(0)} km`}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        }
      />
      <KPICard
        label="Activities"
        value={String(kpis.total_activities)}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      />
      <KPICard
        label="Avg Pace"
        value={formatPace(kpis.avg_pace_sec_km)}
        sub="per km (running)"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        }
      />
      <KPICard
        label="Best Pace"
        value={formatPace(kpis.best_pace_sec_km)}
        sub="per km"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        }
      />
      <KPICard
        label="Avg HR"
        value={kpis.avg_heartrate ? `${kpis.avg_heartrate.toFixed(0)} bpm` : '—'}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        }
        accent="text-red-400"
      />
      <KPICard
        label="Elevation"
        value={`${kpis.total_elevation_m.toFixed(0)} m`}
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polygon points="3 17 9 3 15 12 19 8 21 17 3 17" />
          </svg>
        }
        accent="text-emerald-400"
      />
      <KPICard
        label="Calories"
        value={kpis.total_calories > 0 ? `${(kpis.total_calories / 1000).toFixed(1)}k` : '—'}
        sub="kcal total"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
          </svg>
        }
        accent="text-amber-400"
      />
    </div>
  );
}
