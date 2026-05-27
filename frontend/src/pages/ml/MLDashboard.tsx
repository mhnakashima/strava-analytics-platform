import { TrainingClustersScatter } from '../../components/charts/TrainingClustersScatter';
import { useClusterPoints, useTrainingProfile } from '../../hooks/useActivities';
import { clusterColor } from '../../lib/utils';
import { mlApi } from '../../services/api';

const CLUSTER_META: Record<string, { icon: string; label: string; desc: string; advice: string }> = {
  leve: {
    icon: '🟢',
    label: 'Easy',
    desc: 'Short or fast runs with low cardiovascular load — speed intervals, warm-ups, recovery jogs.',
    advice: 'Ideal for active recovery or speed/velocity work.',
  },
  moderado: {
    icon: '🟡',
    label: 'Moderate',
    desc: 'Steady-effort runs — the bread and butter of training. Neither too easy nor exhausting.',
    advice: 'Should be ~80% of your weekly volume (80/20 principle).',
  },
  intenso: {
    icon: '🔴',
    label: 'Hard',
    desc: 'Long runs, high cardiac load, or significant elevation — marathons, long trails, threshold workouts.',
    advice: 'Max ~20% of volume. Requires 48–72h recovery.',
  },
};

export default function MLDashboard() {
  const { data: clusters, isLoading } = useClusterPoints();
  const { data: profile } = useTrainingProfile();

  const handleRetrain = async () => {
    await mlApi.retrain();
    alert('KMeans retrain queued. New labels will appear after the next ETL run.');
  };

  const dominant = profile?.dominant_cluster;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-c-ink">Machine Learning — Training Clusters</h1>
          <p className="text-sm text-c-ink3 mt-0.5">KMeans k=3 applied to running activities only (Run / TrailRun)</p>
        </div>
        <button onClick={handleRetrain} className="btn-primary text-sm">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retrain KMeans
        </button>
      </div>

      {/* Cluster % cards */}
      {profile && (
        <div className="grid grid-cols-3 gap-4">
          {(['leve', 'moderado', 'intenso'] as const).map((label) => {
            const meta = CLUSTER_META[label];
            const isDom = dominant === label;
            return (
              <div key={label} className={`card p-5 space-y-3 ${isDom ? 'ring-1 ring-strava-orange/30' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.icon}</span>
                    <span className="text-xs font-bold text-c-ink2 uppercase tracking-widest">{meta.label}</span>
                  </div>
                  {isDom && (
                    <span className="text-[10px] font-semibold text-strava-orange bg-strava-orange/10 px-2 py-0.5 rounded-full">
                      Dominant
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-c-ink">
                    {profile[`${label}_pct` as keyof typeof profile]}
                  </span>
                  <span className="text-c-ink3 text-lg mb-1">%</span>
                </div>
                <div className="h-1 bg-c-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${profile[`${label}_pct` as keyof typeof profile]}%`,
                      background: clusterColor(label),
                    }}
                  />
                </div>
                <p className="text-xs text-c-ink2 leading-relaxed">{meta.desc}</p>
                <p className="text-xs font-medium" style={{ color: clusterColor(label) }}>{meta.advice}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Scatter plot */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Scatter — Pace vs Distance (KMeans clusters)</h2>
          <span className="text-xs text-c-ink3">🟢 easy · 🟡 moderate · 🔴 hard · Running activities only</span>
        </div>
        <div className="p-5">
          {isLoading ? (
            <div className="h-72 bg-c-subtle animate-pulse rounded-lg" />
          ) : clusters && clusters.length > 0 ? (
            <TrainingClustersScatter data={clusters} />
          ) : (
            <p className="text-c-ink3 text-sm text-center py-8">
              No cluster data. Only runs are clustered — run the ETL to update.
            </p>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">How does the clustering work?</h2>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-c-ink">The KMeans algorithm</h3>
              <p className="text-sm text-c-ink2 leading-relaxed">
                KMeans automatically groups your runs into 3 intensity categories — no manual labelling needed.
                It analyses 4 features simultaneously:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: '⏱️', label: 'Avg Pace',     desc: 'How fast' },
                  { icon: '📏', label: 'Distance',     desc: 'How far' },
                  { icon: '❤️', label: 'Avg HR',       desc: 'Cardiac effort' },
                  { icon: '⛰️', label: 'Elevation',    desc: 'Terrain difficulty' },
                ].map((f) => (
                  <div key={f.label} className="bg-c-raised/70 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span>{f.icon}</span>
                      <span className="text-xs font-semibold text-c-ink">{f.label}</span>
                    </div>
                    <p className="text-[11px] text-c-ink3">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-c-ink">How to read the chart</h3>
              <div className="space-y-2">
                <p className="text-sm text-c-ink2 leading-relaxed">
                  Each dot is one run. X-axis = distance; Y-axis = pace (inverted — higher = faster).
                  Colour shows the cluster the model assigned.
                </p>
                <div className="space-y-2 mt-1">
                  {[
                    { color: '#22c55e', label: 'Easy',     desc: 'Fast and short — speed intervals, warm-ups' },
                    { color: '#f59e0b', label: 'Moderate', desc: 'Sustained pace — base runs, tempo efforts' },
                    { color: '#ef4444', label: 'Hard',     desc: 'Long and heavy — long runs, trails with elevation' },
                  ].map((c) => (
                    <div key={c.label} className="flex gap-3 items-start">
                      <span className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: c.color }} />
                      <p className="text-xs text-c-ink2">
                        <span className="font-medium" style={{ color: c.color }}>{c.label}</span> — {c.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Training analysis */}
          {profile && (
            <div className="bg-strava-orange/5 border border-strava-orange/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-strava-orange">💡</span>
                <h3 className="text-sm font-semibold text-c-ink">Your training profile analysis</h3>
              </div>
              <p className="text-sm text-c-ink2 leading-relaxed">
                The <span className="text-c-ink font-medium">80/20 polarisation principle</span> says ~80% of training should be easy and ~20% hard.
                {profile.moderado_pct > 60 && profile.intenso_pct < 15 && (
                  <> Your current profile ({profile.moderado_pct}% moderate) suggests you may be stuck in the "grey zone" — not easy enough to recover, not hard enough to trigger adaptations. Try adding more truly easy runs and one weekly speed session.</>
                )}
                {profile.intenso_pct > 30 && (
                  <> With {profile.intenso_pct}% hard sessions, you risk overtraining. Cut intensity and add recovery jogs.</>
                )}
                {profile.leve_pct > 50 && (
                  <> Your profile shows {profile.leve_pct}% easy runs — great aerobic base! Consider adding some tempo runs and long runs to widen adaptations.</>
                )}
                {profile.moderado_pct <= 60 && profile.intenso_pct <= 30 && profile.leve_pct <= 50 && (
                  <> Your distribution looks balanced. Keep monitoring to maintain the 80/20 ratio as your volume grows.</>
                )}
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-c-ink3">
                <span>Silhouette score ≈ 0.48 (good separation)</span>
                <span>·</span>
                <span>Runs only (Run, TrailRun, VirtualRun)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
