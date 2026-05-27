import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPace } from '../../lib/utils';
import type { TimelinePoint } from '../../types';

interface Props {
  data: TimelinePoint[];
}

// 15 min/km = 900 sec/km. Anything slower is a GPS artifact or a very long walk break.
// Legitimate marathon/trail runs rarely exceed 12 min/km even for beginners.
const RUNNING_PACE_MAX = 900;

export function PaceProgressionChart({ data }: Props) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Derive available years from data
  const years = useMemo(() => {
    const set = new Set<number>();
    data.forEach((p) => {
      if (p.date) set.add(Number(p.date.slice(0, 4)));
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  // Filter data: running-only (backend already handles this, but guard on pace too)
  // Then apply year filter
  const chartData = useMemo(() => {
    return data
      .filter((p) => {
        if (!p.avg_pace_sec_km || p.avg_pace_sec_km <= 0 || p.avg_pace_sec_km > RUNNING_PACE_MAX) return false;
        if (selectedYear && p.date && Number(p.date.slice(0, 4)) !== selectedYear) return false;
        return true;
      })
      .map((p) => ({
        date: p.date,
        pace: p.avg_pace_sec_km,
        label: formatPace(p.avg_pace_sec_km),
      }));
  }, [data, selectedYear]);

  const avgPace = useMemo(() => {
    if (!chartData.length) return null;
    return chartData.reduce((s, p) => s + (p.pace ?? 0), 0) / chartData.length;
  }, [chartData]);

  return (
    <div className="space-y-4">
      {/* Year filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedYear(null)}
          className={selectedYear === null ? 'pill-active' : 'pill-inactive'}
        >
          Todos
        </button>
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setSelectedYear(y)}
            className={selectedYear === y ? 'pill-active' : 'pill-inactive'}
          >
            {y}
          </button>
        ))}
        {avgPace && (
          <span className="ml-auto text-xs text-gray-500">
            Média: <span className="text-strava-orange font-medium">{formatPace(avgPace)}</span> /km
          </span>
        )}
      </div>

      {chartData.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-gray-500 text-sm">
          Nenhuma corrida encontrada para o período selecionado
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickFormatter={(v) => v?.slice(5)}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickFormatter={(v) => formatPace(v)}
              reversed
              domain={['dataMin - 10', 'dataMax + 10']}
              width={52}
            />
            <Tooltip
              formatter={(v) => [formatPace(Number(v)), 'Pace']}
              labelFormatter={(l) => l}
              labelStyle={{ color: '#f3f4f6', fontSize: 12 }}
              contentStyle={{
                background: '#111827',
                border: '1px solid #374151',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
              }}
            />
            <Line
              type="monotone"
              dataKey="pace"
              stroke="#FC4C02"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, fill: '#FC4C02', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
