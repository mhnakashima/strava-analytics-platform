import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPace } from '../../lib/utils';
import type { TimelinePoint } from '../../types';

interface Props {
  data: TimelinePoint[];
}

export function PaceProgressionChart({ data }: Props) {
  const chartData = data
    .filter((p) => p.avg_pace_sec_km)
    .map((p) => ({
      date: p.date,
      pace: p.avg_pace_sec_km,
      label: formatPace(p.avg_pace_sec_km),
    }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickFormatter={(v) => v?.slice(5)}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickFormatter={(v) => formatPace(v)}
          reversed
          domain={['dataMin - 10', 'dataMax + 10']}
        />
        <Tooltip
          formatter={(v) => [formatPace(Number(v)), 'Pace']}
          labelStyle={{ color: '#f3f4f6' }}
          contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 6 }}
        />
        <Line
          type="monotone"
          dataKey="pace"
          stroke="#FC4C02"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
