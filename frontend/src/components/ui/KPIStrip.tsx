import { formatDistance, formatDuration, formatPace } from '../../lib/utils';
import type { ActivityKPIs } from '../../types';

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
}

function KPICard({ label, value, sub }: KPICardProps) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-white">{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  );
}

interface Props {
  kpis: ActivityKPIs;
}

export function KPIStrip({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <KPICard label="Distância Total" value={`${kpis.total_distance_km.toFixed(0)} km`} />
      <KPICard label="Atividades" value={String(kpis.total_activities)} />
      <KPICard label="Pace Médio" value={formatPace(kpis.avg_pace_sec_km)} />
      <KPICard label="Melhor Pace" value={formatPace(kpis.best_pace_sec_km)} />
      <KPICard label="FC Média" value={kpis.avg_heartrate ? `${kpis.avg_heartrate.toFixed(0)} bpm` : '—'} />
      <KPICard label="Elevação Total" value={`${kpis.total_elevation_m.toFixed(0)} m`} />
    </div>
  );
}
