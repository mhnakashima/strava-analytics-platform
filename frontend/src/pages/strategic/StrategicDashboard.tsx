import { useShallow } from 'zustand/react/shallow';
import { PaceProgressionChart } from '../../components/charts/PaceProgressionChart';
import { KPIStrip } from '../../components/ui/KPIStrip';
import { ReadinessTodayCard } from '../../components/ui/ReadinessTodayCard';
import { useActivityKPIs, useBestTimes, useLastActivity, useTimeline, useTrainingReadiness } from '../../hooks/useActivities';
import { useFiltersStore } from '../../store/useFiltersStore';
import { useT } from '../../hooks/useTranslation';
import { formatDistance, formatDuration, formatPace } from '../../lib/utils';

const ACTIVITY_ICONS: Record<string, string> = {
  Run: '🏃', TrailRun: '⛰️', VirtualRun: '🖥️', Walk: '🚶',
  Ride: '🚴', Swim: '🏊', WeightTraining: '🏋️', Workout: '💪',
  Yoga: '🧘', Hike: '🥾',
};

const DISTANCE_COLORS: Record<string, string> = {
  '5km':  'from-orange-500/10 to-orange-500/5 border-orange-500/20',
  '10km': 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
  '21km': 'from-purple-500/10 to-purple-500/5 border-purple-500/20',
  '42km': 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
};

const DISTANCE_ACCENT: Record<string, string> = {
  '5km':  'text-orange-400',
  '10km': 'text-blue-400',
  '21km': 'text-purple-400',
  '42km': 'text-emerald-400',
};

function formatTime(sec: number | null): string {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

const PACE_TYPES = new Set(['Run', 'TrailRun', 'Walk', 'Hike', 'VirtualRun', 'RaceWalk']);

export default function StrategicDashboard() {
  const t = useT();
  const params = useFiltersStore(useShallow((s) => s.toQueryParams()));

  const { data: kpis, isLoading: loadingKPIs } = useActivityKPIs(params);
  const { data: timeline, isLoading: loadingTimeline } = useTimeline({
    ...params,
    activity_type: 'Run',
  });
  const { data: bestTimes, isLoading: loadingBestTimes } = useBestTimes();
  const { data: lastActivity } = useLastActivity();
  const { data: readiness, isLoading: loadingReadiness } = useTrainingReadiness();

  const hasPaceLast = lastActivity?.activity_type ? PACE_TYPES.has(lastActivity.activity_type) : false;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-c-ink">{t.strategic.title}</h1>
        <p className="text-sm text-c-ink3 mt-0.5">{t.strategic.subtitle}</p>
      </div>

      {/* ── Top row: 3 / 3 / 6 in a 12-col grid ──────────────── */}
      <div className="grid grid-cols-12 gap-4 items-start">

        {/* Col 1–3: Today's Readiness */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          {loadingReadiness ? (
            <div className="h-72 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--c-raised)' }} />
          ) : readiness ? (
            <ReadinessTodayCard data={readiness} />
          ) : (
            <div className="card h-72 flex items-center justify-center text-sm" style={{ color: 'var(--c-ink3)' }}>
              {t.common.noData}
            </div>
          )}
        </div>

        {/* Col 4–6: Last Activity */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <div className="card h-full">
            <div className="card-header">
              <h2 className="card-title">{t.strategic.lastActivity}</h2>
            </div>
            <div className="p-5">
              {lastActivity ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: 'rgba(252,76,2,0.1)', border: '1px solid rgba(252,76,2,0.2)' }}
                    >
                      {ACTIVITY_ICONS[lastActivity.activity_type ?? ''] ?? '🏅'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-tight truncate" style={{ color: 'var(--c-ink)' }}>
                        {lastActivity.strava_name ?? 'Activity'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--c-ink3)' }}>
                        {lastActivity.start_date?.slice(0, 10)}
                      </p>
                      <span
                        className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(252,76,2,0.1)', color: '#FC4C02' }}
                      >
                        {lastActivity.activity_type}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: t.activityDetail.stats.distance, value: formatDistance(lastActivity.distance_km) },
                      { label: t.activityDetail.stats.movingTime, value: formatDuration(lastActivity.moving_time_sec) },
                      { label: t.activityDetail.stats.avgPace,
                        value: hasPaceLast && lastActivity.avg_pace_sec_km
                          ? formatPace(lastActivity.avg_pace_sec_km) : '—' },
                      { label: t.kpis.avgHR,
                        value: lastActivity.avg_heartrate
                          ? `${lastActivity.avg_heartrate.toFixed(0)} ${t.common.bpm}` : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--c-subtle)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--c-ink3)' }}>
                          {label}
                        </p>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--c-ink)' }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--c-ink3)' }}>
                  {t.strategic.noActivity}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Col 7–12: KPI 2×3 grid */}
        <div className="col-span-12 lg:col-span-6">
          {loadingKPIs ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--c-raised)' }} />
              ))}
            </div>
          ) : kpis ? (
            <KPIStrip kpis={kpis} />
          ) : null}
        </div>

      </div>

      {/* Best Times */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{t.strategic.bestTimes}</h2>
          <span className="text-xs text-c-ink3">{t.common.runOnly}</span>
        </div>
        <div className="p-5">
          {loadingBestTimes ? (
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--c-subtle)' }} />
              ))}
            </div>
          ) : bestTimes ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {bestTimes.efforts.map((e) => (
                <div
                  key={e.label}
                  className={`rounded-xl border bg-gradient-to-br ${DISTANCE_COLORS[e.label] ?? 'from-gray-700/10 to-gray-700/5 border-c-border'} p-4 space-y-1`}
                >
                  <p className={`text-xs font-bold uppercase tracking-widest ${DISTANCE_ACCENT[e.label] ?? 'text-c-ink2'}`}>{e.label}</p>
                  <p className="text-2xl font-bold text-c-ink">{formatTime(e.best_time_sec)}</p>
                  {e.best_pace_sec_km && (
                    <p className="text-xs text-c-ink2">{formatPace(e.best_pace_sec_km)} /km</p>
                  )}
                  {e.activity_date && (
                    <p className="text-[10px] text-c-ink3 pt-1">{e.activity_date}</p>
                  )}
                  {!e.best_pace_sec_km && (
                    <p className="text-xs text-c-ink3 italic">{t.common.noData}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-c-ink3 text-sm">{t.strategic.noBestTimes}</p>
          )}
        </div>
      </div>

      {/* Pace progression chart */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{t.strategic.paceProgression}</h2>
          <span className="flex items-center gap-1.5 text-xs text-c-ink3">
            <span className="w-2 h-2 rounded-full bg-strava-orange inline-block" />
            {t.strategic.runsMaxCap}
          </span>
        </div>
        <div className="p-5">
          {loadingTimeline ? (
            <div className="h-56 bg-c-subtle animate-pulse rounded-lg" />
          ) : timeline ? (
            <PaceProgressionChart data={timeline} />
          ) : (
            <p className="text-c-ink3 text-sm py-8 text-center">{t.strategic.noRunData}</p>
          )}
        </div>
      </div>
    </div>
  );
}
