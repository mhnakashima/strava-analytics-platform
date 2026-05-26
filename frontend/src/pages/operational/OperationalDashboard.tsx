import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { formatDistance, formatDuration, formatPace } from '../../lib/utils';
import { useActivities } from '../../hooks/useActivities';
import { useFiltersStore } from '../../store/useFiltersStore';

const PAGE_SIZE = 15;

interface ActivityType {
  value: string;
  label: string;
  emoji: string;
}

const ACTIVITY_TYPES: ActivityType[] = [
  { value: '', label: 'Todos', emoji: '📋' },
  { value: 'Run', label: 'Corrida', emoji: '🏃' },
  { value: 'TrailRun', label: 'Trail', emoji: '⛰️' },
  { value: 'Walk', label: 'Caminhada', emoji: '🚶' },
  { value: 'Hike', label: 'Trilha', emoji: '🥾' },
  { value: 'Ride', label: 'Ciclismo', emoji: '🚴' },
  { value: 'Swim', label: 'Natação', emoji: '🏊' },
  { value: 'WeightTraining', label: 'Musculação', emoji: '🏋️' },
  { value: 'Workout', label: 'Treino', emoji: '💪' },
  { value: 'Yoga', label: 'Yoga', emoji: '🧘' },
];

// Activities where pace (min/km) makes sense
const PACE_TYPES = new Set(['Run', 'TrailRun', 'Walk', 'Hike', 'VirtualRun', 'RaceWalk']);

const ACTIVITY_ICONS: Record<string, string> = {
  Run: '🏃', TrailRun: '⛰️', VirtualRun: '🖥️', Walk: '🚶', RaceWalk: '🚶',
  Hike: '🥾', Ride: '🚴', VirtualRide: '🖥️', Swim: '🏊',
  WeightTraining: '🏋️', Workout: '💪', Yoga: '🧘',
  Elliptical: '⚙️', StairStepper: '🪜', Rowing: '🚣', Kayaking: '🛶',
  RockClimbing: '🧗', Soccer: '⚽', Tennis: '🎾', Basketball: '🏀',
};

const CLUSTER_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  leve:     { label: 'Leve',    bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  moderado: { label: 'Moderado', bg: 'bg-amber-500/15',  text: 'text-amber-400' },
  intenso:  { label: 'Intenso', bg: 'bg-red-500/15',     text: 'text-red-400' },
};

function Pagination({
  page,
  hasMore,
  onPage,
}: {
  page: number;
  hasMore: boolean;
  onPage: (p: number) => void;
}) {
  const current = page + 1; // 1-indexed

  // Build visible page set: always show first, last-known, and a window around current
  const maxKnown = hasMore ? current + 1 : current;
  const pages: (number | '...')[] = [];

  const range = new Set<number>();
  range.add(1);
  for (let i = Math.max(1, current - 2); i <= Math.min(maxKnown, current + 2); i++) {
    range.add(i);
  }
  if (hasMore) range.add(current + 1);

  const sorted = [...range].sort((a, b) => a - b);
  sorted.forEach((p, i) => {
    if (i > 0 && p - (sorted[i - 1] as number) > 1) pages.push('...');
    pages.push(p);
  });

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 0}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        title="Anterior"
      >
        ‹
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-600 text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage((p as number) - 1)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
              p === current
                ? 'bg-strava-orange text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPage(page + 1)}
        disabled={!hasMore}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        title="Próxima"
      >
        ›
      </button>
    </div>
  );
}

export default function OperationalDashboard() {
  const params = useFiltersStore(useShallow((s) => s.toQueryParams()));
  const [page, setPage] = useState(0);
  const [activityType, setActivityType] = useState('');
  const [search, setSearch] = useState('');

  const queryParams = useMemo(
    () => ({
      ...params,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      ...(activityType ? { activity_type: activityType } : {}),
    }),
    [params, page, activityType]
  );

  const { data: activities, isLoading } = useActivities(queryParams);

  const filtered = useMemo(
    () =>
      activities
        ? activities.filter(
            (a) => !search || (a.strava_name ?? '').toLowerCase().includes(search.toLowerCase())
          )
        : [],
    [activities, search]
  );

  const hasMore = !!activities && activities.length >= PAGE_SIZE;

  const handleTypeChange = (v: string) => { setActivityType(v); setPage(0); };
  const handleSearch = (v: string) => { setSearch(v); setPage(0); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard Operacional</h1>
        <p className="text-sm text-gray-500 mt-0.5">Histórico detalhado de atividades</p>
      </div>

      {/* Filter row */}
      <div className="card px-4 py-3 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar atividade…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field pl-8 w-48"
          />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-700" />

        {/* Activity type pills */}
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTypeChange(t.value)}
              className={activityType === t.value ? 'pill-active' : 'pill-inactive'}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* Clear */}
        {(activityType || search) && (
          <button
            onClick={() => { setActivityType(''); setSearch(''); setPage(0); }}
            className="ml-auto text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Limpar
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="card-title">Atividades Recentes</h2>
          <div className="flex items-center gap-3">
            {!isLoading && (
              <span className="text-xs text-gray-600">
                {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} nesta página
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-700/50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900/60 border-b border-gray-700/60">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Data</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Nome</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Tipo</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Distância</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Duração</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Pace</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-widest">FC Média</th>
                  <th className="px-5 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Intensidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/40">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-gray-500 text-sm">
                      <div className="space-y-2">
                        <div className="text-2xl">🔍</div>
                        <div>Nenhuma atividade encontrada</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((act) => {
                    const hasPace = act.activity_type != null && PACE_TYPES.has(act.activity_type);
                    const cluster = act.cluster_label ? CLUSTER_LABELS[act.cluster_label] : null;
                    return (
                      <tr key={act.activity_id} className="hover:bg-gray-700/20 transition-colors group">
                        <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {act.start_date?.slice(0, 10) ?? '—'}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-white font-medium truncate max-w-[180px] block">
                            {act.strava_name ?? '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 text-gray-300 whitespace-nowrap">
                            <span>{ACTIVITY_ICONS[act.activity_type ?? ''] ?? '•'}</span>
                            <span className="text-xs text-gray-400">{act.activity_type ?? '—'}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-gray-300">{formatDistance(act.distance_km)}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-gray-300">{formatDuration(act.moving_time_sec)}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {hasPace && act.avg_pace_sec_km ? (
                            <span className="text-strava-orange font-medium">
                              {formatPace(act.avg_pace_sec_km)}
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {act.avg_heartrate ? (
                            <span className="text-gray-300">{act.avg_heartrate.toFixed(0)} <span className="text-gray-500 text-xs">bpm</span></span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {cluster ? (
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${cluster.bg} ${cluster.text}`}>
                              {cluster.label}
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        <div className="px-5 py-3 border-t border-gray-700/60 flex items-center justify-between bg-gray-900/30">
          <span className="text-xs text-gray-600">
            Página {page + 1}
          </span>
          <Pagination page={page} hasMore={hasMore} onPage={(p) => setPage(p)} />
        </div>
      </div>
    </div>
  );
}
