import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useHRZones, useTimeline } from '../../hooks/useActivities';
import { useFiltersStore } from '../../store/useFiltersStore';

function isoWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const year = d.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil((((d.getTime() - start.getTime()) / 86400000) + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export default function TacticalDashboard() {
  const params = useFiltersStore(useShallow((s) => s.toQueryParams()));
  const { data: hrZones, isLoading: loadingHR } = useHRZones(params);
  const { data: timeline, isLoading: loadingTimeline } = useTimeline(params);

  // Build weekly volume data from timeline
  const weeklyData = useMemo(() => {
    if (!timeline) return [];
    const byWeek: Record<string, { week: string; km: number; minutes: number; count: number }> = {};
    timeline.forEach((p) => {
      if (!p.date) return;
      const w = isoWeek(p.date);
      if (!byWeek[w]) byWeek[w] = { week: w.slice(5), km: 0, minutes: 0, count: 0 };
      byWeek[w].km += p.distance_km ?? 0;
      byWeek[w].count += 1;
    });
    return Object.values(byWeek).slice(-16); // last 16 weeks
  }, [timeline]);

  // HR zone ring chart data
  const hrRingData = hrZones
    ? [
        { name: 'Z1', value: hrZones.zone_1_pct, fill: '#22c55e' },
        { name: 'Z2', value: hrZones.zone_2_pct, fill: '#84cc16' },
        { name: 'Z3', value: hrZones.zone_3_pct, fill: '#f59e0b' },
        { name: 'Z4', value: hrZones.zone_4_pct, fill: '#f97316' },
        { name: 'Z5', value: hrZones.zone_5_pct, fill: '#ef4444' },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-c-ink">Dashboard Tático</h1>
        <p className="text-sm text-c-ink3 mt-0.5">Carga de treino, zonas cardíacas e volume semanal</p>
      </div>

      {/* Top row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* HR Zones */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Distribuição de Zonas Cardíacas</h2>
            <span className="text-xs text-c-ink3">% do tempo por zona</span>
          </div>
          <div className="p-5">
            {loadingHR ? (
              <div className="h-56 bg-c-subtle animate-pulse rounded-lg" />
            ) : hrZones ? (
              <div className="flex gap-6 items-center">
                {/* Donut */}
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={hrRingData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                      >
                        {hrRingData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => [`${(Number(v)).toFixed(1)}%`]}
                        contentStyle={{ background: 'var(--c-tooltip)', border: '1px solid var(--c-border)', borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: 'var(--c-ink)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="space-y-2 shrink-0">
                  {hrRingData.map((z) => (
                    <div key={z.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: z.fill }} />
                      <span className="text-xs text-c-ink2 w-5">{z.name}</span>
                      <span className="text-xs font-semibold text-c-ink">{z.value.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-c-ink3 text-sm py-8 text-center">Sem dados de FC disponíveis</p>
            )}
          </div>
        </div>

        {/* Zone intensity summary */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Perfil de Intensidade</h2>
          </div>
          <div className="p-5">
            {loadingHR ? (
              <div className="h-56 bg-c-subtle animate-pulse rounded-lg" />
            ) : hrZones ? (
              <div className="space-y-3 pt-2">
                {[
                  { label: 'Zona 1 — Recuperação ativo', pct: hrZones.zone_1_pct, color: '#22c55e' },
                  { label: 'Zona 2 — Base aeróbica', pct: hrZones.zone_2_pct, color: '#84cc16' },
                  { label: 'Zona 3 — Aeróbico moderado', pct: hrZones.zone_3_pct, color: '#f59e0b' },
                  { label: 'Zona 4 — Limiar anaeróbico', pct: hrZones.zone_4_pct, color: '#f97316' },
                  { label: 'Zona 5 — VO₂ Máx', pct: hrZones.zone_5_pct, color: '#ef4444' },
                ].map((z) => (
                  <div key={z.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-c-ink2">{z.label}</span>
                      <span className="font-semibold text-c-ink">{z.pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-c-subtle rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, z.pct)}%`, background: z.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-c-ink3 text-sm py-8 text-center">Sem dados disponíveis</p>
            )}
          </div>
        </div>
      </div>

      {/* Weekly volume chart */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Volume Semanal (km)</h2>
          <span className="text-xs text-c-ink3">Últimas 16 semanas</span>
        </div>
        <div className="p-5">
          {loadingTimeline ? (
            <div className="h-48 bg-c-subtle animate-pulse rounded-lg" />
          ) : weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-grid)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--c-ink3)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--c-ink3)' }} tickFormatter={(v) => `${v}km`} width={40} />
                <Tooltip
                  formatter={(v) => [`${(Number(v)).toFixed(1)} km`, 'Volume']}
                  labelFormatter={(l) => `Semana ${l}`}
                  contentStyle={{ background: 'var(--c-tooltip)', border: '1px solid var(--c-border)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--c-ink)' }}
                />
                <Bar dataKey="km" fill="#FC4C02" opacity={0.85} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-c-ink3 text-sm py-8 text-center">Sem dados de volume disponíveis</p>
          )}
        </div>
      </div>
    </div>
  );
}
