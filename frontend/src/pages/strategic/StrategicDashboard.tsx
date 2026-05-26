import { useShallow } from 'zustand/react/shallow';
import { PaceProgressionChart } from '../../components/charts/PaceProgressionChart';
import { KPIStrip } from '../../components/ui/KPIStrip';
import { useActivityKPIs, useTimeline } from '../../hooks/useActivities';
import { useFiltersStore } from '../../store/useFiltersStore';

export default function StrategicDashboard() {
  const params = useFiltersStore(useShallow((s) => s.toQueryParams()));
  const { data: kpis, isLoading: loadingKPIs } = useActivityKPIs(params);
  const { data: timeline, isLoading: loadingTimeline } = useTimeline(params);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard Estratégico</h1>

      {loadingKPIs ? (
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-gray-700 animate-pulse" />
          ))}
        </div>
      ) : kpis ? (
        <KPIStrip kpis={kpis} />
      ) : null}

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">
          Evolução do Pace — histórico
        </h2>
        {loadingTimeline ? (
          <div className="h-64 bg-gray-700 animate-pulse rounded" />
        ) : timeline ? (
          <PaceProgressionChart data={timeline} />
        ) : (
          <p className="text-gray-500 text-sm">Sem dados disponíveis</p>
        )}
      </div>
    </div>
  );
}
