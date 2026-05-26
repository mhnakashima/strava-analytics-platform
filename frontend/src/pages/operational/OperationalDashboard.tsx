import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { clusterColor, formatDistance, formatDuration, formatPace } from '../../lib/utils';
import { useActivities } from '../../hooks/useActivities';
import { useFiltersStore } from '../../store/useFiltersStore';

const PAGE_SIZE = 20;

const ACTIVITY_TYPES = [
  { value: '', label: 'Todos os tipos' },
  { value: 'Run', label: '🏃 Corrida' },
  { value: 'TrailRun', label: '⛰️ Trail' },
  { value: 'Walk', label: '🚶 Caminhada' },
  { value: 'Hike', label: '🥾 Trilha' },
  { value: 'Ride', label: '🚴 Ciclismo' },
  { value: 'Swim', label: '🏊 Natação' },
  { value: 'WeightTraining', label: '🏋️ Musculação' },
  { value: 'Workout', label: '💪 Treino' },
  { value: 'Yoga', label: '🧘 Yoga' },
  { value: 'Elliptical', label: '⚙️ Elíptico' },
];

const PACE_TYPES = new Set(['Run', 'TrailRun', 'Walk', 'Hike', 'VirtualRun', 'RaceWalk']);

const ACTIVITY_ICONS: Record<string, string> = {
  Run: '🏃', TrailRun: '⛰️', Walk: '🚶', Hike: '🥾',
  Ride: '🚴', VirtualRide: '🖥️', Swim: '🏊', WeightTraining: '🏋️',
  Workout: '💪', Yoga: '🧘', Elliptical: '⚙️', StairStepper: '🪜',
  Rowing: '🚣', Kayaking: '🛶', RockClimbing: '🧗',
};

export default function OperationalDashboard() {
  const params = useFiltersStore(useShallow((s) => s.toQueryParams()));
  const [page, setPage] = useState(0);
  const [activityType, setActivityType] = useState('');
  const [search, setSearch] = useState('');

  const queryParams = {
    ...params,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    ...(activityType ? { activity_type: activityType } : {}),
  };

  const { data: activities, isLoading } = useActivities(queryParams);

  const filtered = activities
    ? activities.filter((a) =>
        !search || (a.strava_name ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => {
    if (activities && activities.length === PAGE_SIZE) setPage((p) => p + 1);
  };

  // Reset page when filters change
  const handleTypeChange = (v: string) => { setActivityType(v); setPage(0); };
  const handleSearch = (v: string) => { setSearch(v); setPage(0); };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard Operacional</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Buscar atividade…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 w-52 focus:outline-none focus:border-orange-500"
        />
        <select
          value={activityType}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
        >
          {ACTIVITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {(activityType || search) && (
          <button
            onClick={() => { setActivityType(''); setSearch(''); setPage(0); }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Atividades Recentes
          </h2>
          <span className="text-xs text-gray-500">
            Página {page + 1}
          </span>
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
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-right">Distância</th>
                  <th className="px-4 py-3 text-right">Duração</th>
                  <th className="px-4 py-3 text-right">Pace</th>
                  <th className="px-4 py-3 text-right">FC Média</th>
                  <th className="px-4 py-3 text-center">Cluster</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">
                      Nenhuma atividade encontrada
                    </td>
                  </tr>
                ) : (
                  filtered.map((act) => (
                    <tr key={act.activity_id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-4 py-2 text-gray-400">{act.start_date?.slice(0, 10) ?? '—'}</td>
                      <td className="px-4 py-2 text-white font-medium truncate max-w-[160px]">{act.strava_name ?? '—'}</td>
                      <td className="px-4 py-2 text-gray-300 whitespace-nowrap">
                        <span title={act.activity_type ?? ''}>
                          {ACTIVITY_ICONS[act.activity_type ?? ''] ?? '•'} {act.activity_type ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-300">{formatDistance(act.distance_km)}</td>
                      <td className="px-4 py-2 text-right text-gray-300">{formatDuration(act.moving_time_sec)}</td>
                      <td className="px-4 py-2 text-right text-gray-300">
                        {act.activity_type && PACE_TYPES.has(act.activity_type) && act.avg_pace_sec_km
                          ? formatPace(act.avg_pace_sec_km)
                          : '—'}
                      </td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-xs text-gray-500">
            {filtered.length} atividades nesta página
          </span>
          <button
            onClick={handleNext}
            disabled={!activities || activities.length < PAGE_SIZE}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
          >
            Próxima →
          </button>
        </div>
      </div>
    </div>
  );
}
