import { TrainingClustersScatter } from '../../components/charts/TrainingClustersScatter';
import { useClusterPoints, useTrainingProfile } from '../../hooks/useActivities';
import { clusterColor } from '../../lib/utils';
import { mlApi } from '../../services/api';

const CLUSTER_META: Record<string, { icon: string; desc: string; advice: string }> = {
  leve: {
    icon: '🟢',
    desc: 'Corridas curtas, rápidas ou com pouca carga cardiovascular. Tipicamente intervalos curtos de alta intensidade ou treinos de velocidade.',
    advice: 'Ideais para recuperação ativa ou trabalho de velocidade.',
  },
  moderado: {
    icon: '🟡',
    desc: 'Corridas de ritmo médio — o "pão com manteiga" do treinamento. Nem muito fácil, nem exaustivo.',
    advice: 'Deveria ser ~80% dos seus treinos segundo o princípio 80/20.',
  },
  intenso: {
    icon: '🔴',
    desc: 'Corridas longas, com alta carga cardíaca ou elevação significativa. Maratonas, trails longos e corridas de limiar.',
    advice: 'Máximo ~20% do volume. Exige recuperação de 48-72h.',
  },
};

export default function MLDashboard() {
  const { data: clusters, isLoading } = useClusterPoints();
  const { data: profile } = useTrainingProfile();

  const handleRetrain = async () => {
    await mlApi.retrain();
    alert('Retreinamento KMeans iniciado. Os novos labels serão visíveis após o próximo ETL.');
  };

  const dominant = profile?.dominant_cluster;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Machine Learning — Clusters de Treino</h1>
          <p className="text-sm text-gray-500 mt-0.5">KMeans k=3 aplicado apenas em corridas (Run / TrailRun)</p>
        </div>
        <button onClick={handleRetrain} className="btn-primary text-sm">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Re-treinar KMeans
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
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
                  </div>
                  {isDom && (
                    <span className="text-[10px] font-semibold text-strava-orange bg-strava-orange/10 px-2 py-0.5 rounded-full">
                      Dominante
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">
                    {profile[`${label}_pct` as keyof typeof profile]}
                  </span>
                  <span className="text-gray-500 text-lg mb-1">%</span>
                </div>
                {/* Progress bar */}
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${profile[`${label}_pct` as keyof typeof profile]}%`,
                      background: clusterColor(label),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scatter */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Scatter — Pace vs Distância (clusters KMeans)</h2>
          <span className="text-xs text-gray-500">🟢 leve · 🟡 moderado · 🔴 intenso · Apenas corridas</span>
        </div>
        <div className="p-5">
          {isLoading ? (
            <div className="h-72 bg-gray-700 animate-pulse rounded-lg" />
          ) : clusters && clusters.length > 0 ? (
            <TrainingClustersScatter data={clusters} />
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">
              Sem dados de cluster. Apenas corridas são agrupadas — execute o ETL para atualizar.
            </p>
          )}
        </div>
      </div>

      {/* Explanation section */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Como funciona o agrupamento?</h2>
        </div>
        <div className="p-5 space-y-5">
          {/* Algorithm explanation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">O algoritmo KMeans</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                O KMeans agrupa suas corridas automaticamente em 3 categorias de intensidade, sem que você precise classificar cada uma manualmente.
                Ele analisa 4 características em conjunto:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: '⏱️', label: 'Pace médio', desc: 'Quão rápido' },
                  { icon: '📏', label: 'Distância', desc: 'Quão longe' },
                  { icon: '❤️', label: 'FC média', desc: 'Esforço cardíaco' },
                  { icon: '⛰️', label: 'Elevação', desc: 'Dificuldade do terreno' },
                ].map((f) => (
                  <div key={f.label} className="bg-gray-800/60 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span>{f.icon}</span>
                      <span className="text-xs font-semibold text-white">{f.label}</span>
                    </div>
                    <p className="text-[11px] text-gray-500">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Como ler o gráfico</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-400 leading-relaxed">
                  No scatter, cada ponto é uma corrida. O eixo X mostra a distância; o eixo Y mostra o pace (invertido — mais acima = mais rápido).
                </p>
                <div className="space-y-2">
                  <div className="flex gap-3 items-start">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <p className="text-xs text-gray-400"><span className="text-emerald-400 font-medium">Leve</span> — rápido e curto: intervalos de velocidade, aquecimentos</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                    <p className="text-xs text-gray-400"><span className="text-amber-400 font-medium">Moderado</span> — ritmo sustentado: corridas de base, tempo runs</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 shrink-0" />
                    <p className="text-xs text-gray-400"><span className="text-red-400 font-medium">Intenso</span> — longo e pesado: corridas longas, trails com elevação</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Training recommendation */}
          {profile && (
            <div className="bg-strava-orange/5 border border-strava-orange/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-strava-orange">💡</span>
                <h3 className="text-sm font-semibold text-white">Análise do seu perfil de treino</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                O princípio <span className="text-white font-medium">80/20</span> de polarização diz que ~80% dos treinos devem ser fáceis e ~20% intensos.
                {profile.moderado_pct > 60 && profile.intenso_pct < 15 && (
                  <> Seu perfil atual ({profile.moderado_pct}% moderado) sugere que você pode estar correndo no "meio-termo" — nem fácil o suficiente para recuperar, nem intenso o suficiente para estimular adaptações. Considere aumentar a variação: mais corridas muito fáceis e inserir sessões de speed work semanais.</>
                )}
                {profile.intenso_pct > 30 && (
                  <> Com {profile.intenso_pct}% de treinos intensos, você corre risco de sobrecarga. Reduza a intensidade e adicione corridas de recuperação ativa.</>
                )}
                {profile.leve_pct > 50 && (
                  <> Seu perfil mostra predominância leve ({profile.leve_pct}%). Ótima base aeróbica! Considere inserir algumas corridas de tempo e long runs para ampliar as adaptações.</>
                )}
              </p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>Silhouette score ≈ 0.48 (boa separação)</span>
                <span>·</span>
                <span>Apenas corridas (Run, TrailRun, VirtualRun)</span>
              </div>
            </div>
          )}

          {/* Cluster descriptions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['leve', 'moderado', 'intenso'] as const).map((label) => {
              const meta = CLUSTER_META[label];
              return (
                <div key={label} className="bg-gray-800/40 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: clusterColor(label) }} />
                    <span className="text-xs font-bold text-white uppercase tracking-wide">{label}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{meta.desc}</p>
                  <p className="text-xs text-strava-orange/80 font-medium">{meta.advice}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
