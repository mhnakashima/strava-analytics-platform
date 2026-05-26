import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import { clusterColor, formatPace } from '../../lib/utils';
import type { ClusterPoint } from '../../types';

interface Props {
  data: ClusterPoint[];
}

const CLUSTERS = ['leve', 'moderado', 'intenso'];

export function TrainingClustersScatter({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="distance_km"
          name="Distância"
          unit=" km"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          label={{ value: 'Distância (km)', position: 'insideBottom', offset: -4, fill: '#9ca3af', fontSize: 11 }}
        />
        <YAxis
          dataKey="avg_pace_sec_km"
          name="Pace"
          tickFormatter={(v) => formatPace(v)}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          reversed
        />
        <ZAxis range={[40, 40]} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 6 }}
          formatter={(value, name) => {
            const n = Number(value);
            if (name === 'Pace') return [formatPace(n), name as string];
            return [`${n}`, name as string];
          }}
        />
        {CLUSTERS.map((cluster) => (
          <Scatter
            key={cluster}
            name={cluster}
            data={data.filter((d) => d.cluster_label === cluster)}
            fill={clusterColor(cluster)}
            opacity={0.75}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
