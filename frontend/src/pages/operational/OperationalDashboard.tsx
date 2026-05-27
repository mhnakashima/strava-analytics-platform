import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { formatDistance, formatDuration, formatPace } from '../../lib/utils';
import { useActivities } from '../../hooks/useActivities';
import { useFiltersStore } from '../../store/useFiltersStore';
import { activitiesApi } from '../../services/api';
import type { ActivityDetail } from '../../types';

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

const PACE_TYPES = new Set(['Run', 'TrailRun', 'Walk', 'Hike', 'VirtualRun', 'RaceWalk']);

const ACTIVITY_ICONS: Record<string, string> = {
  Run: '🏃', TrailRun: '⛰️', VirtualRun: '🖥️', Walk: '🚶', RaceWalk: '🚶',
  Hike: '🥾', Ride: '🚴', VirtualRide: '🖥️', Swim: '🏊',
  WeightTraining: '🏋️', Workout: '💪', Yoga: '🧘',
  Elliptical: '⚙️', StairStepper: '🪜', Rowing: '🚣', Kayaking: '🛶',
};

const CLUSTER_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  leve:     { label: 'Leve',    bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  moderado: { label: 'Moderado', bg: 'bg-amber-500/15',  text: 'text-amber-400' },
  intenso:  { label: 'Intenso', bg: 'bg-red-500/15',     text: 'text-red-400' },
};

function Pagination({ page, hasMore, onPage }: { page: number; hasMore: boolean; onPage: (p: number) => void }) {
  const current = page + 1;
  const maxKnown = hasMore ? current + 1 : current;
  const pages: (number | '...')[] = [];
  const range = new Set<number>();
  range.add(1);
  for (let i = Math.max(1, current - 2); i <= Math.min(maxKnown, current + 2); i++) range.add(i);
  if (hasMore) range.add(current + 1);
  const sorted = [...range].sort((a, b) => a - b);
  sorted.forEach((p, i) => {
    if (i > 0 && p - (sorted[i - 1] as number) > 1) pages.push('...');
    pages.push(p);
  });
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onPage(page - 1)} disabled={page === 0}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-c-ink2 hover:text-c-ink hover:bg-c-subtle disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        ‹
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-c-ink3 text-sm">…</span>
        ) : (
          <button key={p} onClick={() => onPage((p as number) - 1)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${p === current ? 'bg-strava-orange text-c-ink' : 'text-c-ink2 hover:text-c-ink hover:bg-c-subtle'}`}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onPage(page + 1)} disabled={!hasMore}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-c-ink2 hover:text-c-ink hover:bg-c-subtle disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        ›
      </button>
    </div>
  );
}

function ActivityDetailDrawer({ activityId, onClose }: { activityId: number; onClose: () => void }) {
  const [detail, setDetail] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    activitiesApi.detail(activityId).then((d) => { setDetail(d); setLoading(false); });
  }, [activityId]);

  const hasPace = detail?.activity_type && PACE_TYPES.has(detail.activity_type);
  const cluster = detail?.cluster_label ? CLUSTER_LABELS[detail.cluster_label] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative z-10 w-full sm:max-w-lg bg-c-card border border-c-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-c-border">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{ACTIVITY_ICONS[detail?.activity_type ?? ''] ?? '•'}</span>
            <div>
              <p className="font-semibold text-c-ink text-sm">
                {loading ? '…' : detail?.strava_name ?? 'Atividade'}
              </p>
              <p className="text-xs text-c-ink3">
                {detail?.start_date?.slice(0, 10)} · {detail?.activity_type}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-c-subtle text-c-ink2 hover:text-c-ink transition-colors">
            ✕
          </button>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-c-raised animate-pulse rounded-lg" />)}
          </div>
        ) : detail ? (
          <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
            {/* Primary stats grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Distância',  value: formatDistance(detail.distance_km) },
                { label: 'Duração',    value: formatDuration(detail.moving_time_sec) },
                { label: 'Pace',       value: hasPace && detail.avg_pace_sec_km ? formatPace(detail.avg_pace_sec_km) : '—' },
                { label: 'FC Média',   value: detail.avg_heartrate ? `${detail.avg_heartrate.toFixed(0)} bpm` : '—' },
                { label: 'FC Máx',     value: detail.max_heartrate ? `${detail.max_heartrate.toFixed(0)} bpm` : '—' },
                { label: 'Elevação',   value: detail.elevation_gain_m ? `${detail.elevation_gain_m.toFixed(0)} m` : '—' },
                { label: 'Calorias',   value: detail.calories ? `${detail.calories.toFixed(0)} kcal` : '—' },
                { label: 'Carga TRIMP',value: detail.training_load ? `${detail.training_load.toFixed(0)}` : '—' },
                { label: 'Kudos',      value: String(detail.kudos_count ?? 0) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-c-raised/70 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-c-ink3 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-c-ink mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* HR zones if available */}
            {detail.hr_zone_1_pct != null && (
              <div>
                <p className="text-xs font-semibold text-c-ink3 uppercase tracking-widest mb-2">Zonas Cardíacas</p>
                <div className="space-y-1.5">
                  {[
                    { z: 1, label: 'Zona 1', color: '#22c55e', pct: detail.hr_zone_1_pct },
                    { z: 2, label: 'Zona 2', color: '#84cc16', pct: detail.hr_zone_2_pct },
                    { z: 3, label: 'Zona 3', color: '#f59e0b', pct: detail.hr_zone_3_pct },
                    { z: 4, label: 'Zona 4', color: '#f97316', pct: detail.hr_zone_4_pct },
                    { z: 5, label: 'Zona 5', color: '#ef4444', pct: detail.hr_zone_5_pct },
                  ].map(({ z, label, color, pct }) => pct != null && (
                    <div key={z} className="flex items-center gap-2">
                      <span className="text-xs text-c-ink2 w-12">{label}</span>
                      <div className="flex-1 h-1.5 bg-c-subtle rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct ?? 0)}%`, background: color }} />
                      </div>
                      <span className="text-xs font-medium text-c-ink w-10 text-right">{pct?.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cluster badge */}
            {cluster && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-c-ink3">Cluster de intensidade:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cluster.bg} ${cluster.text}`}>
                  {cluster.label}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 text-center text-c-ink3 text-sm">Erro ao carregar detalhes</div>
        )}
      </div>
    </div>
  );
}

export default function OperationalDashboard() {
  const params = useFiltersStore(useShallow((s) => s.toQueryParams()));
  const [page, setPage] = useState(0);
  const [activityType, setActivityType] = useState('');
  const [search, setSearch] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);

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
      <div>
        <h1 className="text-xl font-bold text-c-ink">Dashboard Operacional</h1>
        <p className="text-sm text-c-ink3 mt-0.5">Histórico detalhado de atividades · clique para ver detalhes</p>
      </div>

      {/* Filter row */}
      <div className="card px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-c-ink3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Buscar atividade…" value={search}
            onChange={(e) => handleSearch(e.target.value)} className="input-field pl-8 w-48" />
        </div>
        <div className="w-px h-6 bg-c-subtle" />
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_TYPES.map((t) => (
            <button key={t.value} onClick={() => handleTypeChange(t.value)}
              className={activityType === t.value ? 'pill-active' : 'pill-inactive'}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
        {(activityType || search) && (
          <button onClick={() => { setActivityType(''); setSearch(''); setPage(0); }}
            className="ml-auto text-xs text-c-ink3 hover:text-c-ink flex items-center gap-1 transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Limpar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="card-title">Atividades Recentes</h2>
          {!isLoading && (
            <span className="text-xs text-c-ink3">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''} nesta página</span>
          )}
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-c-subtle/50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-c-card/80 border-b border-c-border">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-c-ink3 uppercase tracking-widest">Data</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-c-ink3 uppercase tracking-widest">Nome</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-c-ink3 uppercase tracking-widest">Tipo</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-c-ink3 uppercase tracking-widest">Distância</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-c-ink3 uppercase tracking-widest">Duração</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-c-ink3 uppercase tracking-widest">Pace</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-c-ink3 uppercase tracking-widest">FC Média</th>
                  <th className="px-5 py-3 text-center text-[11px] font-semibold text-c-ink3 uppercase tracking-widest">Intensidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-c-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-c-ink3 text-sm">
                      <div className="space-y-2"><div className="text-2xl">🔍</div><div>Nenhuma atividade encontrada</div></div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((act) => {
                    const hasPace = act.activity_type != null && PACE_TYPES.has(act.activity_type);
                    const cluster = act.cluster_label ? CLUSTER_LABELS[act.cluster_label] : null;
                    return (
                      <tr key={act.activity_id}
                        onClick={() => setSelectedActivityId(act.activity_id)}
                        className="hover:bg-c-subtle/50 transition-colors cursor-pointer group">
                        <td className="px-5 py-3 text-c-ink3 text-xs whitespace-nowrap">{act.start_date?.slice(0, 10) ?? '—'}</td>
                        <td className="px-5 py-3">
                          <span className="text-c-ink font-medium truncate max-w-[180px] block group-hover:text-strava-orange transition-colors">
                            {act.strava_name ?? '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 text-c-ink whitespace-nowrap">
                            <span>{ACTIVITY_ICONS[act.activity_type ?? ''] ?? '•'}</span>
                            <span className="text-xs text-c-ink2">{act.activity_type ?? '—'}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right"><span className="text-c-ink">{formatDistance(act.distance_km)}</span></td>
                        <td className="px-5 py-3 text-right"><span className="text-c-ink">{formatDuration(act.moving_time_sec)}</span></td>
                        <td className="px-5 py-3 text-right">
                          {hasPace && act.avg_pace_sec_km ? (
                            <span className="text-strava-orange font-medium">{formatPace(act.avg_pace_sec_km)}</span>
                          ) : <span className="text-c-ink3">—</span>}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {act.avg_heartrate ? (
                            <span className="text-c-ink">{act.avg_heartrate.toFixed(0)} <span className="text-c-ink3 text-xs">bpm</span></span>
                          ) : <span className="text-c-ink3">—</span>}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {cluster ? (
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${cluster.bg} ${cluster.text}`}>
                              {cluster.label}
                            </span>
                          ) : <span className="text-c-ink3">—</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3 border-t border-c-border flex items-center justify-between bg-c-card/80">
          <span className="text-xs text-c-ink3">Página {page + 1}</span>
          <Pagination page={page} hasMore={hasMore} onPage={(p) => setPage(p)} />
        </div>
      </div>

      {/* Activity detail drawer */}
      {selectedActivityId !== null && (
        <ActivityDetailDrawer
          activityId={selectedActivityId}
          onClose={() => setSelectedActivityId(null)}
        />
      )}
    </div>
  );
}
