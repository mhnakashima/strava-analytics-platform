import { clusterColor, formatDistance, formatDuration, formatPace } from '../../lib/utils';
import { useActivities } from '../../hooks/useActivities';
import { useFiltersStore } from '../../store/useFiltersStore';

export default function OperationalDashboard() {
  const params = useFiltersStore((s) => s.toQueryParams());
  const { data: activities, isLoading } = useActivities({ ...params, limit: 50 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard Operacional</h1>

      <div className="rounded-lg border border-gray-700 bg-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Atividades Recentes</h2>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-700 animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-right">Distância</th>
                  <th className="px-4 py-3 text-right">Duração</th>
                  <th className="px-4 py-3 text-right">Pace</th>
                  <th className="px-4 py-3 text-right">FC Média</th>
                  <th className="px-4 py-3 text-center">Cluster</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {activities?.map((act) => (
                  <tr key={act.activity_id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-2 text-gray-400">{act.start_date?.slice(0, 10) ?? '—'}</td>
                    <td className="px-4 py-2 text-white font-medium truncate max-w-[180px]">{act.strava_name ?? '—'}</td>
                    <td className="px-4 py-2 text-right text-gray-300">{formatDistance(act.distance_km)}</td>
                    <td className="px-4 py-2 text-right text-gray-300">{formatDuration(act.moving_time_sec)}</td>
                    <td className="px-4 py-2 text-right text-gray-300">{formatPace(act.avg_pace_sec_km)}</td>
                    <td className="px-4 py-2 text-right text-gray-300">{act.avg_heartrate ? `${act.avg_heartrate.toFixed(0)} bpm` : '—'}</td>
                    <td className="px-4 py-2 text-center">
                      {act.cluster_label ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ background: clusterColor(act.cluster_label) }}
                        >
                          {act.cluster_label}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
