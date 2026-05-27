import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { formatDistance, formatDuration, formatPace } from '../../lib/utils';
import { useActivities } from '../../hooks/useActivities';
import { useFiltersStore } from '../../store/useFiltersStore';
import { useT } from '../../hooks/useTranslation';

const PAGE_SIZE = 15;

const PACE_TYPES = new Set(['Run', 'TrailRun', 'Walk', 'Hike', 'VirtualRun', 'RaceWalk']);

const ACTIVITY_ICONS: Record<string, string> = {
  Run: '🏃', TrailRun: '⛰️', VirtualRun: '🖥️', Walk: '🚶', RaceWalk: '🚶',
  Hike: '🥾', Ride: '🚴', VirtualRide: '🖥️', Swim: '🏊',
  WeightTraining: '🏋️', Workout: '💪', Yoga: '🧘',
  Elliptical: '⚙️', StairStepper: '🪜', Rowing: '🚣', Kayaking: '🛶',
};

const CLUSTER_COLORS: Record<string, { bg: string; text: string }> = {
  leve:     { bg: 'rgba(34,197,94,0.12)',  text: '#22c55e' },
  moderado: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  intenso:  { bg: 'rgba(239,68,68,0.12)',  text: '#ef4444' },
};

const ACTIVITY_TYPE_VALUES = ['', 'Run', 'TrailRun', 'Walk', 'Hike', 'Ride', 'Swim', 'WeightTraining', 'Workout', 'Yoga'];
const ACTIVITY_TYPE_EMOJIS: Record<string, string> = {
  '': '📋', Run: '🏃', TrailRun: '⛰️', Walk: '🚶', Hike: '🥾',
  Ride: '🚴', Swim: '🏊', WeightTraining: '🏋️', Workout: '💪', Yoga: '🧘',
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

  const btnBase = 'w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all';

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 0}
        className={`${btnBase} disabled:opacity-30 disabled:cursor-not-allowed`}
        style={{ color: 'var(--c-ink2)' }}
      >‹</button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e-${i}`} className={`${btnBase}`} style={{ color: 'var(--c-ink3)' }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage((p as number) - 1)}
            className={btnBase}
            style={
              p === current
                ? { background: '#FC4C02', color: '#fff' }
                : { color: 'var(--c-ink2)' }
            }
            onMouseEnter={e => { if (p !== current) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--c-subtle)'; }}
            onMouseLeave={e => { if (p !== current) (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={!hasMore}
        className={`${btnBase} disabled:opacity-30 disabled:cursor-not-allowed`}
        style={{ color: 'var(--c-ink2)' }}
      >›</button>
    </div>
  );
}

export default function OperationalDashboard() {
  const t = useT();
  const navigate = useNavigate();
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

  const tableHeaders = [
    t.operational.columns.date,
    t.operational.columns.name,
    t.operational.columns.type,
    t.operational.columns.distance,
    t.operational.columns.duration,
    t.operational.columns.pace,
    t.operational.columns.hr,
    t.operational.columns.intensity,
    '',
  ];

  const resultCount = filtered.length;
  const resultWord = resultCount === 1 ? t.common.result : t.common.results;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--c-ink)' }}>{t.operational.title}</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--c-ink3)' }}>{t.operational.subtitle}</p>
      </div>

      {/* Filters */}
      <div className="card px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--c-ink3)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder={t.operational.searchPlaceholder}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field pl-8 w-48"
          />
        </div>
        <div className="w-px h-6" style={{ backgroundColor: 'var(--c-subtle)' }} />
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_TYPE_VALUES.map((value) => (
            <button
              key={value}
              onClick={() => handleTypeChange(value)}
              className={activityType === value ? 'pill-active' : 'pill-inactive'}
            >
              {ACTIVITY_TYPE_EMOJIS[value]} {t.operational.activityTypeLabels[value] ?? value}
            </button>
          ))}
        </div>
        {(activityType || search) && (
          <button
            onClick={() => { setActivityType(''); setSearch(''); setPage(0); }}
            className="ml-auto flex items-center gap-1 text-xs transition-colors"
            style={{ color: 'var(--c-ink3)' }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            {t.common.clear}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="card-title">{t.operational.recentActivities}</h2>
          {!isLoading && (
            <span className="text-xs" style={{ color: 'var(--c-ink3)' }}>
              {resultCount} {resultWord} {t.common.onThisPage}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg" style={{ backgroundColor: 'var(--c-subtle)', opacity: 0.5 }} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--c-card)', borderBottom: '1px solid var(--c-border)' }}>
                  {tableHeaders.map((h, i) => (
                    <th
                      key={i}
                      className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-widest ${
                        i >= 3 && i <= 6 ? 'text-right' : i === 7 ? 'text-center' : 'text-left'
                      }`}
                      style={{ color: 'var(--c-ink3)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--c-ink3)' }}>
                      <div className="space-y-2">
                        <div className="text-2xl">🔍</div>
                        <div>{t.operational.noResults}</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((act) => {
                    const hasPace = act.activity_type != null && PACE_TYPES.has(act.activity_type);
                    const clusterKey = act.cluster_label ?? '';
                    const clusterColors = CLUSTER_COLORS[clusterKey];
                    const clusterLabel = clusterKey ? (t.operational.clusterLabels[clusterKey] ?? clusterKey) : null;
                    return (
                      <tr
                        key={act.activity_id}
                        onClick={() => navigate(`/activities/${act.activity_id}`)}
                        className="cursor-pointer transition-colors group"
                        style={{ borderBottom: '1px solid var(--c-border)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--c-subtle)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
                      >
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--c-ink3)' }}>
                          {act.start_date?.slice(0, 10) ?? '—'}
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <span className="font-medium truncate block" style={{ color: 'var(--c-ink)' }}>
                            {act.strava_name ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <span>{ACTIVITY_ICONS[act.activity_type ?? ''] ?? '•'}</span>
                            <span className="text-xs" style={{ color: 'var(--c-ink2)' }}>{act.activity_type ?? '—'}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--c-ink)' }}>
                          {formatDistance(act.distance_km)}
                        </td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--c-ink)' }}>
                          {formatDuration(act.moving_time_sec)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {hasPace && act.avg_pace_sec_km
                            ? <span className="font-medium" style={{ color: '#FC4C02' }}>{formatPace(act.avg_pace_sec_km)}</span>
                            : <span style={{ color: 'var(--c-ink3)' }}>—</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {act.avg_heartrate
                            ? <span style={{ color: 'var(--c-ink)' }}>{act.avg_heartrate.toFixed(0)} <span style={{ color: 'var(--c-ink3)', fontSize: '11px' }}>{t.common.bpm}</span></span>
                            : <span style={{ color: 'var(--c-ink3)' }}>—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {clusterColors && clusterLabel
                            ? <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: clusterColors.bg, color: clusterColors.text }}>{clusterLabel}</span>
                            : <span style={{ color: 'var(--c-ink3)' }}>—</span>}
                        </td>
                        <td className="px-3 py-3">
                          <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--c-ink3)' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--c-border)', backgroundColor: 'var(--c-card)' }}>
          <span className="text-xs" style={{ color: 'var(--c-ink3)' }}>{t.common.page} {page + 1}</span>
          <Pagination page={page} hasMore={hasMore} onPage={(p) => setPage(p)} />
        </div>
      </div>
    </div>
  );
}
