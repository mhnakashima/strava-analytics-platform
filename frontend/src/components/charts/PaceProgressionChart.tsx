import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPace } from '../../lib/utils';
import type { TimelinePoint } from '../../types';

interface Props {
  data: TimelinePoint[];
}

const RUNNING_PACE_MAX = 900; // 15 min/km cap — anything slower is GPS drift or walking

export function PaceProgressionChart({ data }: Props) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const years = useMemo(() => {
    const set = new Set<number>();
    data.forEach((p) => { if (p.date) set.add(Number(p.date.slice(0, 4))); });
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const chartData = useMemo(() => {
    return data
      .filter((p) => {
        if (!p.avg_pace_sec_km || p.avg_pace_sec_km <= 0 || p.avg_pace_sec_km > RUNNING_PACE_MAX) return false;
        if (selectedYear && p.date && Number(p.date.slice(0, 4)) !== selectedYear) return false;
        return true;
      })
      .map((p) => ({ date: p.date, pace: p.avg_pace_sec_km }));
  }, [data, selectedYear]);

  const avgPace = useMemo(() => {
    if (!chartData.length) return null;
    return chartData.reduce((s, p) => s + (p.pace ?? 0), 0) / chartData.length;
  }, [chartData]);

  return (
    <div className="space-y-4">
      {/* Year filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setSelectedYear(null)} className={selectedYear === null ? 'pill-active' : 'pill-inactive'}>
          All
        </button>
        {years.map((y) => (
          <button key={y} onClick={() => setSelectedYear(y)} className={selectedYear === y ? 'pill-active' : 'pill-inactive'}>
            {y}
          </button>
        ))}
        {avgPace && (
          <span className="ml-auto text-xs text-c-ink3">
            Avg: <span className="text-strava-orange font-semibold">{formatPace(avgPace)}</span> /km
          </span>
        )}
      </div>

      {chartData.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-c-ink3 text-sm">
          No runs found for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c-grid)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--c-ink3)' }} tickFormatter={(v) => v?.slice(5)} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: 'var(--c-ink3)' }} tickFormatter={(v) => formatPace(v)} reversed domain={['dataMin - 10', 'dataMax + 10']} width={52} />
            <Tooltip
              formatter={(v) => [formatPace(Number(v)), 'Pace']}
              labelFormatter={(l) => l}
              labelStyle={{ color: 'var(--c-ink)', fontSize: 12 }}
              contentStyle={{ background: 'var(--c-tooltip)', border: '1px solid var(--c-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}
            />
            <Line type="monotone" dataKey="pace" stroke="#FC4C02" strokeWidth={1.5} dot={false} activeDot={{ r: 4, fill: '#FC4C02', strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
