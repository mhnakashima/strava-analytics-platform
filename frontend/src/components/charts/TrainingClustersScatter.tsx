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
        <CartesianGrid strokeDasharray="3 3" stroke="var(--c-grid)" />
        <XAxis
          dataKey="distance_km"
          name="Distance"
          unit=" km"
          tick={{ fontSize: 11, fill: 'var(--c-ink3)' }}
          label={{ value: 'Distance (km)', position: 'insideBottom', offset: -4, fill: 'var(--c-ink3)', fontSize: 11 }}
        />
        <YAxis
          dataKey="avg_pace_sec_km"
          name="Pace"
          tickFormatter={(v) => formatPace(v)}
          tick={{ fontSize: 11, fill: 'var(--c-ink3)' }}
          reversed
        />
        <ZAxis range={[40, 40]} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{ background: 'var(--c-tooltip)', border: '1px solid var(--c-border)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'var(--c-ink)' }}
          formatter={(value, name) => {
            const n = Number(value);
            if (name === 'Pace' || name === 'Distance') return [name === 'Pace' ? formatPace(n) : `${n} km`, name as string];
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
