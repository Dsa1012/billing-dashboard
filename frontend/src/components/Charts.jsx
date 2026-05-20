/**
 * Charts.jsx — Gráficos del dashboard con Recharts.
 * Incluye: barras mensuales, dona de cumplimiento, barras horizontales de ranking.
 */

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell, PieChart, Pie,
  LineChart, Line, Area, AreaChart,
} from 'recharts'
import { fmtCompact } from '../hooks/useData'

// ── Tooltip personalizado ─────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-700 border border-surface-500 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-gray-300 mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {fmtCompact(p.value)}
        </p>
      ))}
    </div>
  )
}

// ── Evolución mensual ─────────────────────────────────────────
export function MonthlyChart({ data }) {
  if (!data?.length) return null
  return (
    <div className="card animate-fade-in">
      <h3 className="text-sm font-semibold text-gray-200 mb-4">Evolución Mensual 2026</h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradFact" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="gradProy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2e3848" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false} tickLine={false}
            tickFormatter={m => m.slice(0, 3)}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false} tickLine={false}
            tickFormatter={fmtCompact}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#9ca3af', paddingTop: 8 }}
            formatter={v => v === 'facturado' ? '● Facturado' : '● Proyección'}
          />
          <Area type="monotone" dataKey="facturado"  stroke="#10b981" strokeWidth={2} fill="url(#gradFact)" name="facturado" />
          <Area type="monotone" dataKey="proyeccion" stroke="#3b82f6" strokeWidth={2} fill="url(#gradProy)" name="proyeccion" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Barras Facturado vs Proyección por mes ────────────────────
export function BarComparisonChart({ data }) {
  if (!data?.length) return null
  return (
    <div className="card animate-fade-in">
      <h3 className="text-sm font-semibold text-gray-200 mb-4">Facturado vs Proyección por Mes</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2e3848" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false} tickLine={false}
            tickFormatter={m => m.slice(0, 3)}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false} tickLine={false}
            tickFormatter={fmtCompact}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af', paddingTop: 8 }} />
          <Bar dataKey="facturado"  name="Facturado"  fill="#10b981" radius={[3,3,0,0]} maxBarSize={28} />
          <Bar dataKey="proyeccion" name="Proyección" fill="#3b82f6" radius={[3,3,0,0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Top Clientes (barras horizontales) ───────────────────────
export function TopClientesChart({ data, limit = 8 }) {
  if (!data?.length) return null
  const top = [...data]
    .sort((a, b) => b.total_facturado - a.total_facturado)
    .slice(0, limit)

  return (
    <div className="card animate-fade-in">
      <h3 className="text-sm font-semibold text-gray-200 mb-4">Top {limit} Clientes por Facturado</h3>
      <ResponsiveContainer width="100%" height={limit * 38 + 20}>
        <BarChart
          data={top}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2e3848" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtCompact} />
          <YAxis
            type="category"
            dataKey="cliente"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={false} tickLine={false}
            width={120}
            tickFormatter={v => v.length > 16 ? v.slice(0, 15) + '…' : v}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total_facturado" name="Facturado" fill="#10b981" radius={[0,4,4,0]} maxBarSize={18}>
            {top.map((_, i) => (
              <Cell key={i} fill={`hsl(${160 - i * 5}, 60%, ${50 - i * 2}%)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Top Gerentes ──────────────────────────────────────────────
export function TopGerentesChart({ data, limit = 6 }) {
  if (!data?.length) return null
  const top = [...data]
    .sort((a, b) => b.total_facturado - a.total_facturado)
    .slice(0, limit)

  return (
    <div className="card animate-fade-in">
      <h3 className="text-sm font-semibold text-gray-200 mb-4">Top {limit} Gerentes por Facturado</h3>
      <ResponsiveContainer width="100%" height={limit * 38 + 20}>
        <BarChart
          data={top}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2e3848" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtCompact} />
          <YAxis
            type="category"
            dataKey="gerente"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={false} tickLine={false}
            width={120}
            tickFormatter={v => v.length > 16 ? v.slice(0, 15) + '…' : v}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total_facturado" name="Facturado" radius={[0,4,4,0]} maxBarSize={18}>
            {top.map((_, i) => (
              <Cell key={i} fill={`hsl(${210 + i * 8}, 70%, ${55 - i * 2}%)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Dona de cumplimiento global ───────────────────────────────
export function CumplimientoDonut({ kpis }) {
  if (!kpis) return null
  const pct = Math.min(kpis.pct_cumplimiento, 100)
  const donutData = [
    { name: 'Facturado',  value: kpis.total_facturado },
    { name: 'Proyección', value: kpis.total_proyeccion },
    { name: 'Sin asignar',value: Math.max(0, kpis.diferencia) },
  ]
  const COLORS = ['#10b981', '#3b82f6', '#374151']

  return (
    <div className="card animate-fade-in flex flex-col items-center justify-center">
      <h3 className="text-sm font-semibold text-gray-200 mb-2 self-start">Distribución Total</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={donutData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {donutData.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, n) => [fmtCompact(v), n]}
            contentStyle={{ background: '#1e2536', border: '1px solid #2e3848', borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: '#9ca3af' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-1 text-xs">
        {donutData.map((d, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
            <span className="text-gray-400">{d.name}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-3xl font-bold text-white">{pct.toFixed(1)}%</p>
      <p className="text-xs text-gray-500">cumplimiento facturado</p>
    </div>
  )
}
