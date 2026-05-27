import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { activitiesApi } from '../../services/api';
import { formatDistance, formatDuration, formatPace } from '../../lib/utils';
import type { ActivityDetail } from '../../types';

const PACE_TYPES = new Set(['Run', 'TrailRun', 'Walk', 'Hike', 'VirtualRun', 'RaceWalk']);

const ACTIVITY_ICONS: Record<string, string> = {
  Run: '🏃', TrailRun: '⛰️', VirtualRun: '🖥️', Walk: '🚶', RaceWalk: '🚶',
  Hike: '🥾', Ride: '🚴', VirtualRide: '🖥️', Swim: '🏊',
  WeightTraining: '🏋️', Workout: '💪', Yoga: '🧘',
  Elliptical: '⚙️', StairStepper: '🪜', Rowing: '🚣', Kayaking: '🛶',
};

const CLUSTER_META: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  leve:     { label: 'Easy',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)',    desc: 'Low intensity — aerobic base, recovery' },
  moderado: { label: 'Moderate', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   desc: 'Threshold zone — aerobic development' },
  intenso:  { label: 'Hard',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    desc: 'High intensity — VO2max, race pace' },
};

const HR_ZONES = [
  { key: 'hr_zone_1_pct' as const, label: 'Zone 1', sublabel: 'Recovery',  color: '#22c55e' },
  { key: 'hr_zone_2_pct' as const, label: 'Zone 2', sublabel: 'Aerobic',   color: '#84cc16' },
  { key: 'hr_zone_3_pct' as const, label: 'Zone 3', sublabel: 'Tempo',     color: '#f59e0b' },
  { key: 'hr_zone_4_pct' as const, label: 'Zone 4', sublabel: 'Threshold', color: '#f97316' },
  { key: 'hr_zone_5_pct' as const, label: 'Zone 5', sublabel: 'Max',       color: '#ef4444' },
];

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--c-raised)', border: '1px solid var(--c-border)' }}>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--c-ink3)' }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: 'var(--c-ink)' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--c-ink3)' }}>{sub}</p>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 rounded-2xl" style={{ backgroundColor: 'var(--c-raised)' }} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl" style={{ backgroundColor: 'var(--c-raised)' }} />
        ))}
      </div>
    </div>
  );
}

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    activitiesApi.detail(Number(id))
      .then(setDetail)
      .catch(() => setError('Could not load activity details.'))
      .finally(() => setLoading(false));
  }, [id]);

  const hasPace = detail?.activity_type ? PACE_TYPES.has(detail.activity_type) : false;
  const cluster = detail?.cluster_label ? CLUSTER_META[detail.cluster_label] : null;
  const hasHR = detail && (detail.hr_zone_1_pct != null || detail.hr_zone_2_pct != null);
  const dateStr = detail?.start_date
    ? new Date(detail.start_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const timeStr = detail?.start_date
    ? new Date(detail.start_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-medium transition-all"
        style={{ color: 'var(--c-ink2)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-ink)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--c-ink2)')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to activities
      </button>

      {loading && <Skeleton />}

      {error && (
        <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-red-400 font-medium">{error}</p>
          <button onClick={() => navigate(-1)} className="mt-3 text-sm" style={{ color: 'var(--c-ink2)' }}>← Go back</button>
        </div>
      )}

      {!loading && !error && detail && (
        <>
          {/* Hero header */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="text-4xl leading-none mt-0.5">
                  {ACTIVITY_ICONS[detail.activity_type ?? ''] ?? '🏅'}
                </span>
                <div>
                  <h1 className="text-xl font-bold" style={{ color: 'var(--c-ink)' }}>
                    {detail.strava_name ?? 'Activity'}
                  </h1>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--c-ink2)' }}>{dateStr}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--c-ink3)' }}>{timeStr}</p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {/* Activity type badge */}
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: 'rgba(252,76,2,0.12)', color: '#FC4C02' }}
                    >
                      {detail.activity_type}
                    </span>
                    {/* Cluster badge */}
                    {cluster && (
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: cluster.bg, color: cluster.color }}
                        title={cluster.desc}
                      >
                        {cluster.label}
                      </span>
                    )}
                    {/* Kudos */}
                    {(detail.kudos_count ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--c-ink3)' }}>
                        👏 {detail.kudos_count} kudos
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Strava link */}
              <a
                href={`https://www.strava.com/activities/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white shrink-0 transition-all hover:opacity-90"
                style={{ background: '#FC4C02' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066z"/>
                  <path d="M10.232 13.828L7.648 8.818H5L10.232 19 12.8 13.828z"/>
                </svg>
                View on Strava
              </a>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <StatCard label="Distance"      value={formatDistance(detail.distance_km)} />
            <StatCard label="Moving time"   value={formatDuration(detail.moving_time_sec)} />
            <StatCard
              label="Avg pace"
              value={hasPace && detail.avg_pace_sec_km ? formatPace(detail.avg_pace_sec_km) : '—'}
              sub={hasPace ? 'min/km' : 'N/A for this type'}
            />
            <StatCard
              label="Best pace"
              value={hasPace && detail.best_pace_sec_km ? formatPace(detail.best_pace_sec_km) : '—'}
              sub={hasPace ? 'min/km' : undefined}
            />
            <StatCard label="Avg heart rate"  value={detail.avg_heartrate ? `${Math.round(detail.avg_heartrate)} bpm` : '—'} />
            <StatCard label="Max heart rate"  value={detail.max_heartrate ? `${detail.max_heartrate} bpm` : '—'} />
            <StatCard label="Elevation gain"  value={detail.elevation_gain_m ? `${Math.round(detail.elevation_gain_m)} m` : '—'} />
            <StatCard label="Calories"        value={detail.calories ? `${Math.round(detail.calories)} kcal` : '—'} />
            <StatCard
              label="TRIMP load"
              value={detail.training_load ? `${Math.round(detail.training_load)}` : '—'}
              sub="Training impulse"
            />
            <StatCard label="Elapsed time"    value={formatDuration(detail.elapsed_time_sec)} />
          </div>

          {/* HR Zones */}
          {hasHR && (
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--c-ink3)' }}>
                Heart Rate Zones
              </h2>
              <div className="space-y-3">
                {HR_ZONES.map(({ key, label, sublabel, color }) => {
                  const pct = detail[key];
                  if (pct == null) return null;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-20 shrink-0">
                        <p className="text-xs font-semibold" style={{ color: 'var(--c-ink)' }}>{label}</p>
                        <p className="text-[10px]" style={{ color: 'var(--c-ink3)' }}>{sublabel}</p>
                      </div>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--c-subtle)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="text-sm font-bold w-12 text-right" style={{ color: 'var(--c-ink)' }}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cluster explanation */}
          {cluster && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--c-ink3)' }}>
                ML Intensity Cluster
              </h2>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: cluster.bg }}
                >
                  {detail.cluster_label === 'intenso' ? '🔥' : detail.cluster_label === 'moderado' ? '⚡' : '💚'}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: cluster.color }}>{cluster.label} intensity</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--c-ink2)' }}>{cluster.desc}</p>
                </div>
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--c-ink3)' }}>
                Classified by a KMeans model trained on pace, heart rate, and distance. 
                See the <button onClick={() => navigate('/ml')} className="underline hover:opacity-80">ML dashboard</button> for your full cluster distribution.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
