import { useShallow } from 'zustand/react/shallow';
import { PaceProgressionChart } from '../../components/charts/PaceProgressionChart';
import { KPIStrip } from '../../components/ui/KPIStrip';
import { useActivityKPIs, useTimeline } from '../../hooks/useActivities';
import { useFiltersStore } from '../../store/useFiltersStore';

export default function StrategicDashboard() {
  const params = useFiltersStore(useShallow((s) => s.toQueryParams()));

  const { data: kpis, isLoading: loadingKPIs } = useActivityKPIs(params);
  // Timeline is always filtered to running activities for the pace chart
  const { data: timeline, isLoading: loadingTimeline } = useTimeline({
    ...params,
    activity_type: 'Run',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard Estratégico</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral da performance ao longo do tempo</p>
      </div>

      {/* KPIs */}
      {loadingKPIs ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : kpis ? (
        <KPIStrip kpis={kpis} />
      ) : null}

      {/* Pace chart */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Evolução do Pace — Corridas</h2>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-strava-orange inline-block" />
            Apenas corridas (Run)
          </span>
        </div>
        <div className="p-5">
          {loadingTimeline ? (
            <div className="h-56 bg-gray-700 animate-pulse rounded-lg" />
          ) : timeline ? (
            <PaceProgressionChart data={timeline} />
          ) : (
            <p className="text-gray-500 text-sm py-8 text-center">Sem dados de corrida disponíveis</p>
          )}
        </div>
      </div>
    </div>
  );
}
