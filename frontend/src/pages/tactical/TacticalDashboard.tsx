import { useShallow } from 'zustand/react/shallow';
import { HRZonesPieChart } from '../../components/charts/HRZonesPieChart';
import { useHRZones } from '../../hooks/useActivities';
import { useFiltersStore } from '../../store/useFiltersStore';

export default function TacticalDashboard() {
  const params = useFiltersStore(useShallow((s) => s.toQueryParams()));
  const { data: hrZones, isLoading } = useHRZones(params);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard Tático</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">
            Distribuição de Zonas Cardíacas
          </h2>
          {isLoading ? (
            <div className="h-64 bg-gray-700 animate-pulse rounded" />
          ) : hrZones ? (
            <HRZonesPieChart data={hrZones} />
          ) : (
            <p className="text-gray-500 text-sm">Sem dados disponíveis</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 flex items-center justify-center">
          <p className="text-gray-500 text-sm">Heatmap de atividades — em breve</p>
        </div>
      </div>
    </div>
  );
}
