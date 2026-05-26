import { TrainingClustersScatter } from '../../components/charts/TrainingClustersScatter';
import { useClusterPoints, useTrainingProfile } from '../../hooks/useActivities';
import { clusterColor } from '../../lib/utils';
import { mlApi } from '../../services/api';

export default function MLDashboard() {
  const { data: clusters, isLoading } = useClusterPoints();
  const { data: profile } = useTrainingProfile();

  const handleRetrain = async () => {
    await mlApi.retrain();
    alert('Retreinamento KMeans iniciado.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Machine Learning — Clusters de Treino</h1>
        <button
          onClick={handleRetrain}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-strava-orange text-white hover:opacity-90 transition"
        >
          Re-treinar KMeans
        </button>
      </div>

      {profile && (
        <div className="grid grid-cols-3 gap-4">
          {(['leve', 'moderado', 'intenso'] as const).map((label) => (
            <div key={label} className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-center">
              <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ background: clusterColor(label) }} />
              <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="text-3xl font-bold text-white mt-1">
                {profile[`${label}_pct` as keyof typeof profile]}%
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
          Scatter — Pace vs Distância (clusters KMeans)
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Verde = leve &nbsp;·&nbsp; Âmbar = moderado &nbsp;·&nbsp; Vermelho = intenso
        </p>
        {isLoading ? (
          <div className="h-72 bg-gray-700 animate-pulse rounded" />
        ) : clusters ? (
          <TrainingClustersScatter data={clusters} />
        ) : (
          <p className="text-gray-500 text-sm">Sem dados de cluster. Execute o ETL primeiro.</p>
        )}
      </div>
    </div>
  );
}
