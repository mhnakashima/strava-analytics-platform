import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { HRZoneDistribution } from '../../types';

const ZONE_COLORS = ['#22c55e', '#84cc16', '#f59e0b', '#f97316', '#ef4444'];
const ZONE_LABELS = ['Zona 1 (50–60%)', 'Zona 2 (60–70%)', 'Zona 3 (70–80%)', 'Zona 4 (80–90%)', 'Zona 5 (90–100%)'];

interface Props {
  data: HRZoneDistribution;
}

export function HRZonesPieChart({ data }: Props) {
  const chartData = [
    { name: ZONE_LABELS[0], value: data.zone_1_pct },
    { name: ZONE_LABELS[1], value: data.zone_2_pct },
    { name: ZONE_LABELS[2], value: data.zone_3_pct },
    { name: ZONE_LABELS[3], value: data.zone_4_pct },
    { name: ZONE_LABELS[4], value: data.zone_5_pct },
  ].filter((d) => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
          label={({ value }) => `${(value as number).toFixed(1)}%`} labelLine={false}>
          {chartData.map((_, i) => <Cell key={i} fill={ZONE_COLORS[i % ZONE_COLORS.length]} />)}
        </Pie>
        <Tooltip
          formatter={(v) => [`${(Number(v)).toFixed(1)}%`]}
          contentStyle={{ background: 'var(--c-tooltip)', border: '1px solid var(--c-border)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'var(--c-ink)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
