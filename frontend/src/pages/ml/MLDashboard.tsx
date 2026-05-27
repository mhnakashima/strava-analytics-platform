import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrainingClustersScatter } from '../../components/charts/TrainingClustersScatter';
import { useClusterPoints, useClusterStats, useClusterTrend, useTrainingProfile } from '../../hooks/useActivities';
import { clusterColor, formatPace } from '../../lib/utils';
import { mlApi } from '../../services/api';
import type { ClusterStat } from '../../types';
import { useT } from '../../hooks/useTranslation';

const CLUSTER_ICONS: Record<string, string> = {
  leve: '🟢',
  moderado: '🟡',
  intenso: '🔴',
};

/* ── Cluster Comparison Table ──────────────────────────── */
function ClusterStatsTable({ stats }: { stats: ClusterStat[] }) {
  const t = useT();
  const m = t.ml.tableMetrics;

  const rows: { key: string; label: string; fmt: (s: ClusterStat) => string }[] = [
    { key: 'count', label: m.activities,  fmt: (s) => String(s.count) },
    { key: 'pace',  label: m.avgPace,     fmt: (s) => formatPace(s.avg_pace_sec_km) },
    { key: 'dist',  label: m.avgDistance, fmt: (s) => s.avg_distance_km != null ? `${s.avg_distance_km.toFixed(1)} km` : '—' },
    { key: 'hr',    label: m.avgHR,       fmt: (s) => s.avg_heartrate != null ? `${s.avg_heartrate.toFixed(0)} bpm` : '—' },
    { key: 'elev',  label: m.avgElev,     fmt: (s) => s.avg_elevation_m != null ? `${s.avg_elevation_m.toFixed(0)} m` : '—' },
    { key: 'load',  label: m.avgTrimp,    fmt: (s) => s.avg_training_load != null ? s.avg_training_load.toFixed(0) : '—' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
            <th className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--c-ink3)' }}>
              {/* metric col header intentionally blank */}
            </th>
            {stats.map((s) => {
              const meta = t.ml.clusterMeta[s.label];
              return (
                <th key={s.label} className="text-center py-2 px-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>{CLUSTER_ICONS[s.label]}</span>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: clusterColor(s.label) }}>
                      {meta?.label}
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.key}
              style={{
                borderBottom: '1px solid var(--c-border)',
                backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--c-raised)',
              }}
            >
              <td className="py-2.5 pr-4 text-xs font-medium" style={{ color: 'var(--c-ink3)' }}>
                {row.label}
              </td>
              {stats.map((s) => (
                <td key={s.label} className="py-2.5 px-3 text-center text-sm font-semibold" style={{ color: 'var(--c-ink)' }}>
                  {row.fmt(s)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Tooltip helper ──────────────────────────────────── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 text-xs space-y-1 shadow-lg"
      style={{ backgroundColor: 'var(--c-tooltip)', border: '1px solid var(--c-border)', color: 'var(--c-ink)' }}>
      <p className="font-semibold mb-2" style={{ color: 'var(--c-ink3)' }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span style={{ color: 'var(--c-ink2)' }}>{p.name}:</span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function MLDashboard() {
  const t = useT();
  const ml = t.ml;

  const { data: clusters, isLoading: clustersLoading } = useClusterPoints();
  const { data: profile } = useTrainingProfile();
  const { data: stats } = useClusterStats();
  const { data: trend, isLoading: trendLoading } = useClusterTrend();

  const handleRetrain = async () => {
    await mlApi.retrain();
    alert('KMeans retrain queued. New labels will appear after the next ETL run.');
  };

  const dominant = profile?.dominant_cluster;
  const trendSlice = trend?.slice(-16) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--c-ink)' }}>{ml.title}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--c-ink3)' }}>{ml.subtitle}</p>
        </div>
        <button onClick={handleRetrain} className="btn-primary text-sm shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {ml.retrain}
        </button>
      </div>

      {/* Cluster % cards */}
      {profile && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(['leve', 'moderado', 'intenso'] as const).map((label) => {
            const meta = ml.clusterMeta[label];
            const isDom = dominant === label;
            const pct = profile[`${label}_pct` as keyof typeof profile] as number;
            return (
              <div key={label} className={`card p-5 space-y-3 ${isDom ? 'ring-1 ring-strava-orange/30' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CLUSTER_ICONS[label]}</span>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ink2)' }}>{meta.label}</span>
                  </div>
                  {isDom && (
                    <span className="text-[10px] font-semibold text-strava-orange bg-strava-orange/10 px-2 py-0.5 rounded-full">
                      {ml.dominant}
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold" style={{ color: 'var(--c-ink)' }}>{pct}</span>
                  <span className="text-lg mb-1" style={{ color: 'var(--c-ink3)' }}>%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--c-subtle)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: clusterColor(label) }} />
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--c-ink2)' }}>{meta.desc}</p>
                <p className="text-xs font-medium" style={{ color: clusterColor(label) }}>{meta.advice}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Cluster comparison table + scatter side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Stats table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">{ml.clusterCentroids}</h2>
            <span className="text-xs" style={{ color: 'var(--c-ink3)' }}>{ml.avgValues}</span>
          </div>
          <div className="p-5">
            {stats && stats.length > 0
              ? <ClusterStatsTable stats={stats} />
              : <p className="text-sm text-center py-6" style={{ color: 'var(--c-ink3)' }}>{ml.noClusterData}</p>}
          </div>
        </div>

        {/* Scatter plot */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">{ml.scatterTitle}</h2>
            <span className="text-xs" style={{ color: 'var(--c-ink3)' }}>🟢 {ml.clusterMeta.leve.label.toLowerCase()} · 🟡 {ml.clusterMeta.moderado.label.toLowerCase()} · 🔴 {ml.clusterMeta.intenso.label.toLowerCase()}</span>
          </div>
          <div className="p-5">
            {clustersLoading ? (
              <div className="h-64 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--c-subtle)' }} />
            ) : clusters && clusters.length > 0 ? (
              <TrainingClustersScatter data={clusters} />
            ) : (
              <p className="text-sm text-center py-8" style={{ color: 'var(--c-ink3)' }}>{ml.noScatterData}</p>
            )}
          </div>
        </div>
      </div>

      {/* Weekly cluster trend */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{ml.weeklyDist}</h2>
          <span className="text-xs" style={{ color: 'var(--c-ink3)' }}>{ml.weeklyDistSub}</span>
        </div>
        <div className="p-5">
          {trendLoading ? (
            <div className="h-56 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--c-subtle)' }} />
          ) : trendSlice.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendSlice} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
                <XAxis
                  dataKey="week"
                  tickFormatter={(v: string) => v.split('-W')[1] ? `W${v.split('-W')[1]}` : v}
                  tick={{ fill: 'var(--c-ink3)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: 'var(--c-ink3)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  formatter={(v) => <span style={{ color: 'var(--c-ink2)' }}>{v}</span>}
                />
                <Bar dataKey="easy"     name={ml.clusterMeta.leve.label}     stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="moderate" name={ml.clusterMeta.moderado.label} stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="hard"     name={ml.clusterMeta.intenso.label}  stackId="a" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: 'var(--c-ink3)' }}>{ml.noTrendData}</p>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{ml.howItWorks}</h2>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--c-ink)' }}>{ml.algorithm.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--c-ink2)' }}>
                {ml.algorithm.desc}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ml.algorithm.features.map((f) => (
                  <div key={f.label} className="rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--c-raised)' }}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span>{f.icon}</span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--c-ink)' }}>{f.label}</span>
                    </div>
                    <p className="text-[11px]" style={{ color: 'var(--c-ink3)' }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--c-ink)' }}>{ml.algorithm.chartTitle}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--c-ink2)' }}>{ml.algorithm.chartDesc}</p>
              <div className="space-y-2 mt-1">
                {([
                  { color: '#22c55e', label: ml.clusterMeta.leve.label,     desc: ml.scatter.easyDesc },
                  { color: '#f59e0b', label: ml.clusterMeta.moderado.label, desc: ml.scatter.moderateDesc },
                  { color: '#ef4444', label: ml.clusterMeta.intenso.label,  desc: ml.scatter.hardDesc },
                ] as { color: string; label: string; desc: string }[]).map((c) => (
                  <div key={c.label} className="flex gap-3 items-start">
                    <span className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: c.color }} />
                    <p className="text-xs" style={{ color: 'var(--c-ink2)' }}>
                      <span className="font-medium" style={{ color: c.color }}>{c.label}</span> — {c.desc}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg p-3 text-xs space-y-1 mt-2" style={{ backgroundColor: 'var(--c-raised)', border: '1px solid var(--c-border)' }}>
                <p className="font-semibold" style={{ color: 'var(--c-ink)' }}>{ml.algorithm.modelTitle}</p>
                {ml.algorithm.modelLines.map((line) => (
                  <p key={line} style={{ color: 'var(--c-ink3)' }}>{line}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Training analysis */}
          {profile && (
            <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: 'rgba(252,76,2,0.05)', border: '1px solid rgba(252,76,2,0.2)' }}>
              <div className="flex items-center gap-2">
                <span style={{ color: '#FC4C02' }}>💡</span>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--c-ink)' }}>{ml.profile.title}</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--c-ink2)' }}>
                <span className="font-medium" style={{ color: 'var(--c-ink)' }}>{ml.profile.principle}</span>{' '}
                {ml.profile.principleDesc}
                {profile.moderado_pct > 60 && profile.intenso_pct < 15 && ml.profile.greyZone(profile.moderado_pct)}
                {profile.intenso_pct > 30 && ml.profile.overtrain(profile.intenso_pct)}
                {profile.leve_pct > 50 && profile.intenso_pct < 20 && ml.profile.goodBase(profile.leve_pct)}
                {profile.moderado_pct <= 60 && profile.intenso_pct <= 30 && profile.leve_pct <= 50 && ml.profile.balanced}
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                {(['leve', 'moderado', 'intenso'] as const).map((k) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: clusterColor(k) }} />
                    <span className="text-xs" style={{ color: 'var(--c-ink3)' }}>
                      {ml.clusterMeta[k].label}: <span className="font-semibold" style={{ color: 'var(--c-ink)' }}>
                        {profile[`${k}_pct` as keyof typeof profile]}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
