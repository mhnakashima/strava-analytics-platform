import React, { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { useMonthlyBreakdown, useYearlyStats } from '../../hooks/useActivities';
import type { MonthlyPoint, YearlyStat } from '../../types';
import { useT } from '../../hooks/useTranslation';

/* ── helpers ──────────────────────────────────────────────────────────── */
function fmtPace(sec: number | null): string {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function fmtDist(km: number): string {
  return km >= 1000 ? `${(km / 1000).toFixed(1)}k` : `${km.toFixed(0)}`;
}

function fmtElev(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)}k m` : `${Math.round(m)} m`;
}

function fmtCal(cal: number): string {
  return cal >= 1000 ? `${(cal / 1000).toFixed(1)}k` : `${Math.round(cal)}`;
}

type DeltaInfo = { pct: number; positive: boolean; up: boolean } | null;

function calcDelta(cur: number | null, prev: number | null, lowerIsBetter = false): DeltaInfo {
  if (cur == null || prev == null || prev === 0) return null;
  const raw = ((cur - prev) / Math.abs(prev)) * 100;
  const up = raw > 0;
  const positive = lowerIsBetter ? raw < 0 : raw > 0;
  return { pct: Math.abs(raw), positive, up };
}

const YEAR_COLORS = ['#FC4C02', '#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ec4899'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ── sub-components ───────────────────────────────────────────────────── */
function DeltaBadge({ delta }: { delta: DeltaInfo }) {
  if (!delta) return <span style={{ color: 'var(--c-ink3)' }}>—</span>;
  const color = delta.positive ? '#22c55e' : '#ef4444';
  const arrow = delta.up ? '↑' : '↓';
  return (
    <span className="text-xs font-semibold tabular-nums" style={{ color }}>
      {arrow} {delta.pct.toFixed(1)}%
    </span>
  );
}

function YearPill({
  year,
  active,
  color,
  onClick,
}: {
  year: number;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-full text-sm font-semibold transition-all"
      style={{
        background: active ? color : 'var(--c-card)',
        color: active ? '#fff' : 'var(--c-ink2)',
        border: `1.5px solid ${active ? color : 'var(--c-border)'}`,
      }}
    >
      {year}
    </button>
  );
}

/* ── KPI comparison table ─────────────────────────────────────────────── */
interface KpiRow {
  key: string;
  label: string;
  icon: React.ReactNode;
  getValue: (s: YearlyStat) => number | null;
  fmt: (v: number) => string;
  lowerIsBetter?: boolean;
  unit?: string;
}

function ComparisonTable({
  stats,
  selectedYears,
  yearColors,
  rows,
}: {
  stats: YearlyStat[];
  selectedYears: number[];
  yearColors: Record<number, string>;
  rows: KpiRow[];
}) {
  const lastTwo = selectedYears.slice(-2);
  const hasTwo = lastTwo.length === 2;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--c-border)' }}>
      <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth: `${140 + selectedYears.length * 110 + (hasTwo ? 130 : 0)}px` }}>
        <thead>
          <tr style={{ background: 'var(--c-page)', borderBottom: '1px solid var(--c-border)' }}>
            <th
              className="text-left px-4 py-3 font-semibold sticky left-0 z-10"
              style={{ color: 'var(--c-ink2)', minWidth: 140, backgroundColor: 'var(--c-page)' }}
            >
              Metric
            </th>
            {selectedYears.map((y) => (
              <th
                key={y}
                className="text-right px-4 py-3 font-bold tabular-nums"
                style={{ color: yearColors[y] }}
              >
                {y}
              </th>
            ))}
            {hasTwo && (
              <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--c-ink2)' }}>
                Δ {lastTwo[0]} → {lastTwo[1]}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const bg = i % 2 === 0 ? 'var(--c-card)' : 'var(--c-page)';
            const prevStat = hasTwo ? stats.find((s) => s.year === lastTwo[0]) ?? null : null;
            const curStat = hasTwo ? stats.find((s) => s.year === lastTwo[1]) ?? null : null;
            const delta = hasTwo ? calcDelta(
              curStat ? row.getValue(curStat) : null,
              prevStat ? row.getValue(prevStat) : null,
              row.lowerIsBetter,
            ) : null;

            return (
              <tr key={row.key} style={{ background: bg, borderBottom: '1px solid var(--c-border)' }}>
                <td
                  className="px-4 py-3 sticky left-0 z-10"
                  style={{ backgroundColor: bg }}
                >
                  <div className="flex items-center gap-2">
                    <span className="opacity-70">{row.icon}</span>
                    <span className="font-medium" style={{ color: 'var(--c-ink)' }}>
                      {row.label}
                    </span>
                  </div>
                </td>
                {selectedYears.map((y) => {
                  const stat = stats.find((s) => s.year === y);
                  const val = stat ? row.getValue(stat) : null;
                  return (
                    <td key={y} className="text-right px-4 py-3 tabular-nums font-medium" style={{ color: 'var(--c-ink)' }}>
                      {val != null ? row.fmt(val) : '—'}
                      {row.unit && val != null && (
                        <span className="text-xs ml-1" style={{ color: 'var(--c-ink3)' }}>{row.unit}</span>
                      )}
                    </td>
                  );
                })}
                {hasTwo && (
                  <td className="text-right px-4 py-3">
                    <DeltaBadge delta={delta} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}

/* ── monthly volume chart ─────────────────────────────────────────────── */
function MonthlyChart({
  data,
  selectedYears,
  yearColors,
  distLabel,
}: {
  data: MonthlyPoint[];
  selectedYears: number[];
  yearColors: Record<number, string>;
  distLabel: string;
}) {
  const chartData = useMemo(() => {
    return MONTHS.map((label, i) => {
      const month = i + 1;
      const point: Record<string, string | number> = { month: label };
      for (const year of selectedYears) {
        const entry = data.find((d) => d.year === year && d.month === month);
        point[String(year)] = entry?.distance_km ?? 0;
      }
      return point;
    });
  }, [data, selectedYears]);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--c-ink3)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--c-ink3)' }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `${v}`} />
        <Tooltip
          contentStyle={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'var(--c-ink)', fontWeight: 600 }}
          formatter={(v: number, name: string) => [`${v} ${distLabel}`, name]}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {selectedYears.map((y) => (
          <Line
            key={y}
            type="monotone"
            dataKey={String(y)}
            stroke={yearColors[y]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── activity mix chart ───────────────────────────────────────────────── */
function MixChart({
  stats,
  selectedYears,
  yearColors,
  runLabel,
  rideLabel,
  otherLabel,
}: {
  stats: YearlyStat[];
  selectedYears: number[];
  yearColors: Record<number, string>;
  runLabel: string;
  rideLabel: string;
  otherLabel: string;
}) {
  const chartData = useMemo(
    () =>
      selectedYears.map((y) => {
        const s = stats.find((x) => x.year === y);
        return {
          year: String(y),
          [runLabel]: s?.run_count ?? 0,
          [rideLabel]: s?.ride_count ?? 0,
          [otherLabel]: s?.other_count ?? 0,
          color: yearColors[y],
        };
      }),
    [stats, selectedYears, yearColors, runLabel, rideLabel, otherLabel],
  );

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
        <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--c-ink3)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--c-ink3)' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'var(--c-ink)', fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey={runLabel} stackId="a" fill="#FC4C02" radius={[0, 0, 0, 0]} />
        <Bar dataKey={rideLabel} stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
        <Bar dataKey={otherLabel} stackId="a" fill="#6b7280" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── card wrapper ─────────────────────────────────────────────────────── */
function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}
    >
      <div className="mb-4">
        <h3 className="font-semibold text-base" style={{ color: 'var(--c-ink)' }}>{title}</h3>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--c-ink3)' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/* ── skeleton ─────────────────────────────────────────────────────────── */
function Skeleton({ h = 'h-48' }: { h?: string }) {
  return (
    <div className={`${h} rounded-xl animate-pulse`} style={{ background: 'var(--c-border)' }} />
  );
}

/* ── summary stat strip ───────────────────────────────────────────────── */
function SummaryStrip({
  stats,
  selectedYears,
  yearColors,
  t,
}: {
  stats: YearlyStat[];
  selectedYears: number[];
  yearColors: Record<number, string>;
  t: ReturnType<typeof useT>;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {selectedYears.map((y) => {
        const s = stats.find((x) => x.year === y);
        if (!s) return null;
        return (
          <div
            key={y}
            className="rounded-xl p-3 text-center"
            style={{
              background: 'var(--c-card)',
              border: `1.5px solid ${yearColors[y]}33`,
            }}
          >
            <div className="text-xs font-bold mb-2" style={{ color: yearColors[y] }}>
              {y}
            </div>
            <div className="text-xl font-black tabular-nums" style={{ color: 'var(--c-ink)' }}>
              {fmtDist(s.total_distance_km)}
            </div>
            <div className="text-xs" style={{ color: 'var(--c-ink3)' }}>km</div>
            <div className="text-sm font-bold tabular-nums mt-1" style={{ color: 'var(--c-ink2)' }}>
              {s.total_activities}
            </div>
            <div className="text-xs" style={{ color: 'var(--c-ink3)' }}>{t.yoy.activities}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── main page ────────────────────────────────────────────────────────── */
export default function YoYDashboard() {
  const t = useT();
  const { data: yearlyData, isLoading: loadingYearly } = useYearlyStats();
  const { data: monthlyData, isLoading: loadingMonthly } = useMonthlyBreakdown();

  const availableYears = useMemo(
    () => (yearlyData ?? []).map((s) => s.year),
    [yearlyData],
  );

  const defaultSelected = useMemo(
    () => availableYears.slice(-3),
    [availableYears],
  );

  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  const activeYears = useMemo(
    () => (selectedYears.length > 0 ? selectedYears : defaultSelected),
    [selectedYears, defaultSelected],
  );

  const yearColors: Record<number, string> = useMemo(
    () =>
      Object.fromEntries(
        availableYears.map((y, i) => [y, YEAR_COLORS[i % YEAR_COLORS.length]]),
      ),
    [availableYears],
  );

  function toggleYear(y: number) {
    const base = selectedYears.length > 0 ? selectedYears : defaultSelected;
    if (base.includes(y)) {
      if (base.length === 1) return;
      setSelectedYears(base.filter((x) => x !== y));
    } else {
      setSelectedYears([...base, y].sort());
    }
  }

  const kpiRows: KpiRow[] = [
    {
      key: 'distance',
      label: t.yoy.totalDistance,
      icon: <span>📏</span>,
      getValue: (s) => s.total_distance_km,
      fmt: (v) => `${fmtDist(v)} km`,
    },
    {
      key: 'activities',
      label: t.yoy.activities,
      icon: <span>⚡</span>,
      getValue: (s) => s.total_activities,
      fmt: (v) => `${v}`,
    },
    {
      key: 'pace',
      label: t.yoy.avgPace,
      icon: <span>⏱️</span>,
      getValue: (s) => s.avg_pace_sec_km,
      fmt: (v) => `${fmtPace(v)} /km`,
      lowerIsBetter: true,
    },
    {
      key: 'calories',
      label: t.yoy.calories,
      icon: <span>🔥</span>,
      getValue: (s) => s.total_calories,
      fmt: (v) => `${fmtCal(v)} kcal`,
    },
    {
      key: 'elevation',
      label: t.yoy.elevation,
      icon: <span>⛰️</span>,
      getValue: (s) => s.total_elevation_m,
      fmt: (v) => fmtElev(v),
    },
    {
      key: 'load',
      label: t.yoy.avgLoad,
      icon: <span>📊</span>,
      getValue: (s) => s.avg_training_load,
      fmt: (v) => `${v.toFixed(1)}`,
      unit: 'TRIMP',
    },
  ];

  const filteredStats: YearlyStat[] = useMemo(
    () => (yearlyData ?? []).filter((s) => activeYears.includes(s.year)),
    [yearlyData, activeYears],
  );

  const isLoading = loadingYearly || loadingMonthly;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--c-ink)' }}>
          {t.yoy.title}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-ink3)' }}>
          {t.yoy.subtitle}
        </p>
      </div>

      {/* Year selector */}
      {!loadingYearly && availableYears.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold mr-1" style={{ color: 'var(--c-ink3)' }}>
            {t.yoy.selectYears}:
          </span>
          {availableYears.map((y) => (
            <YearPill
              key={y}
              year={y}
              active={activeYears.includes(y)}
              color={yearColors[y]}
              onClick={() => toggleYear(y)}
            />
          ))}
        </div>
      )}

      {/* Summary strip */}
      {isLoading ? (
        <Skeleton h="h-24" />
      ) : (
        <SummaryStrip stats={filteredStats} selectedYears={activeYears} yearColors={yearColors} t={t} />
      )}

      {/* KPI comparison table */}
      <Card title={t.yoy.kpiComparison} subtitle={t.yoy.kpiSubtitle}>
        {isLoading ? (
          <Skeleton h="h-56" />
        ) : (
          <ComparisonTable
            stats={filteredStats}
            selectedYears={activeYears}
            yearColors={yearColors}
            rows={kpiRows}
          />
        )}
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={t.yoy.monthlyVolume} subtitle={t.yoy.monthlySubtitle}>
          {isLoading ? (
            <Skeleton />
          ) : (
            <MonthlyChart
              data={monthlyData ?? []}
              selectedYears={activeYears}
              yearColors={yearColors}
              distLabel="km"
            />
          )}
        </Card>

        <Card title={t.yoy.activityMix} subtitle={t.yoy.mixSubtitle}>
          {isLoading ? (
            <Skeleton />
          ) : (
            <MixChart
              stats={filteredStats}
              selectedYears={activeYears}
              yearColors={yearColors}
              runLabel={t.yoy.run}
              rideLabel={t.yoy.ride}
              otherLabel={t.yoy.other}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
