import { useShallow } from 'zustand/react/shallow';
import { PaceProgressionChart } from '../../components/charts/PaceProgressionChart';
import { KPIStrip } from '../../components/ui/KPIStrip';
import { useActivityKPIs, useBestTimes, useLastActivity, useTimeline } from '../../hooks/useActivities';
import { useFiltersStore } from '../../store/useFiltersStore';
import { formatDistance, formatDuration, formatPace } from '../../lib/utils';

const ACTIVITY_ICONS: Record<string, string> = {
  Run: '🏃', TrailRun: '⛰️', VirtualRun: '🖥️', Walk: '🚶',
  Ride: '🚴', Swim: '🏊', WeightTraining: '🏋️', Workout: '💪',
  Yoga: '🧘', Hike: '🥾',
};

const DISTANCE_COLORS: Record<string, string> = {
  '5km': 'from-orange-500/10 to-orange-500/5 border-orange-500/20',
  '10km': 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
  '21km': 'from-purple-500/10 to-purple-500/5 border-purple-500/20',
  '42km': 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
};

const DISTANCE_ACCENT: Record<string, string> = {
  '5km': 'text-orange-400',
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

export default function StrategicDashboard() {
  const params = useFiltersStore(useShallow((s) => s.toQueryParams()));

  const { data: kpis, isLoading: loadingKPIs } = useActivityKPIs(params);
  const { data: timeline, isLoading: loadingTimeline } = useTimeline({
    ...params,
    activity_type: 'Run',
  });
  const { data: bestTimes, isLoading: loadingBestTimes } = useBestTimes();
  const { data: lastActivity } = useLastActivity();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-c-ink">Dashboard Estratégico</h1>
        <p className="text-sm text-c-ink3 mt-0.5">Visão geral da performance ao longo do tempo</p>
      </div>

      {/* KPIs */}
      {loadingKPIs ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-c-raised animate-pulse" />
          ))}
        </div>
      ) : kpis ? (
        <KPIStrip kpis={kpis} />
      ) : null}

      {/* Best times + last activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Best times — 2/3 width */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h2 className="card-title">Melhores Tempos</h2>
            <span className="text-xs text-c-ink3">Em atividades de corrida</span>
          </div>
          <div className="p-5">
            {loadingBestTimes ? (
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-c-subtle animate-pulse" />
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
                      <p className="text-xs text-c-ink3 italic">Sem dados</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-c-ink3 text-sm">Sem dados disponíveis</p>
            )}
          </div>
        </div>

        {/* Last activity — 1/3 width */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Última Atividade</h2>
          </div>
          <div className="p-5">
            {lastActivity ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-strava-orange/10 border border-strava-orange/20 flex items-center justify-center text-xl shrink-0">
                    {ACTIVITY_ICONS[lastActivity.activity_type ?? ''] ?? '•'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-c-ink text-sm leading-tight truncate">
                      {lastActivity.strava_name ?? 'Atividade'}
                    </p>
                    <p className="text-xs text-c-ink3 mt-0.5">
                      {lastActivity.start_date?.slice(0, 10)} · {lastActivity.activity_type}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Distância', value: formatDistance(lastActivity.distance_km) },
                    { label: 'Duração',   value: formatDuration(lastActivity.moving_time_sec) },
                    { label: 'Pace',      value: lastActivity.avg_pace_sec_km ? formatPace(lastActivity.avg_pace_sec_km) : '—' },
                    { label: 'FC Média',  value: lastActivity.avg_heartrate ? `${lastActivity.avg_heartrate.toFixed(0)} bpm` : '—' },
                  ].map(({ label, value }) => (
                    <div                   key={label} className="bg-c-page rounded-lg px-3 py-2">
                      <p className="text-[10px] text-c-ink3 uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-semibold text-c-ink mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-c-ink3 text-sm">
                Sem atividades
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pace chart */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Evolução do Pace — Corridas</h2>
          <span className="flex items-center gap-1.5 text-xs text-c-ink3">
            <span className="w-2 h-2 rounded-full bg-strava-orange inline-block" />
            Apenas corridas (Run) · máx 15 min/km
          </span>
        </div>
        <div className="p-5">
          {loadingTimeline ? (
            <div className="h-56 bg-c-subtle animate-pulse rounded-lg" />
          ) : timeline ? (
            <PaceProgressionChart data={timeline} />
          ) : (
            <p className="text-c-ink3 text-sm py-8 text-center">Sem dados de corrida disponíveis</p>
          )}
        </div>
      </div>
    </div>
  );
}
