/**
 * App.jsx — Componente raíz del dashboard de facturación.
 *
 * Páginas:
 *   overview  → KPIs + dona + gráfico mensual + top clientes/gerentes
 *   mensual   → Evolución mensual detallada
 *   clientes  → Ranking de clientes
 *   gerentes  → Ranking de gerentes
 *   tabla     → Tabla detalle con filtros y exportación
 */

import { useState } from 'react'
import clsx from 'clsx'
import { AlertCircle, Loader2, Database } from 'lucide-react'

import { useData } from './hooks/useData'
import Sidebar         from './components/Sidebar'
import KPICards        from './components/KPICards'
import Filters         from './components/Filters'
import Table           from './components/Table'
import { ClienteRanking, GerenteRanking } from './components/Rankings'
import {
  MonthlyChart,
  BarComparisonChart,
  TopClientesChart,
  TopGerentesChart,
  CumplimientoDonut,
} from './components/Charts'

// ── Loader ────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
      <Loader2 size={36} className="animate-spin text-brand-500" />
      <p className="text-sm">Cargando datos del Excel…</p>
    </div>
  )
}

// ── Error ─────────────────────────────────────────────────────
function ErrorScreen({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <AlertCircle size={40} className="text-red-400" />
      <p className="text-sm text-gray-300 font-medium">No se pudieron cargar los datos</p>
      <p className="text-xs text-gray-500 max-w-sm text-center">{error}</p>
      <button onClick={onRetry} className="btn-primary mt-2">Reintentar</button>
    </div>
  )
}

// ── Sin datos ─────────────────────────────────────────────────
function EmptyScreen({ onReload }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
      <Database size={40} className="text-gray-600" />
      <p className="text-sm text-gray-300 font-medium">No se encontró archivo Excel</p>
      <p className="text-xs text-gray-500 text-center max-w-xs">
        Verifica que la carpeta configurada en <code className="text-brand-400">EXCEL_FOLDER</code> contiene
        al menos un archivo .xlsx o .xlsm.
      </p>
      <button onClick={onReload} className="btn-primary mt-2">Reintentar</button>
    </div>
  )
}

// ── Header de página ──────────────────────────────────────────
function PageHeader({ title, sub, sourceFile }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      <p className="text-xs text-gray-500 mt-0.5">
        {sub}{sourceFile && <span className="ml-2 text-gray-600">• {sourceFile}</span>}
      </p>
    </div>
  )
}

// ── Vistas ────────────────────────────────────────────────────
function OverviewPage({ data }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <KPICards kpis={data.kpis} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MonthlyChart data={data.by_month} />
        </div>
        <CumplimientoDonut kpis={data.kpis} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopClientesChart data={data.by_cliente} />
        <TopGerentesChart data={data.by_gerente} />
      </div>
    </div>
  )
}

function MensualPage({ data }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <MonthlyChart data={data.by_month} />
      <BarComparisonChart data={data.by_month} />
      {/* Tabla mensual */}
      <div className="card overflow-x-auto">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">Resumen Mensual</h3>
        <table className="w-full text-xs">
          <thead className="bg-surface-700">
            <tr>
              {['Mes', 'Facturado', 'Proyección', 'Total', '% Facturado'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-gray-400 font-semibold uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.by_month.map((m, i) => {
              const total = m.facturado + m.proyeccion
              const pct = total > 0 ? (m.facturado / total * 100) : 0
              return (
                <tr key={m.month} className={clsx(
                  'border-t border-surface-600 hover:bg-surface-700/40 transition-colors',
                  i % 2 === 0 ? 'bg-surface-800' : 'bg-surface-800/50'
                )}>
                  <td className="px-3 py-2.5 text-gray-200 font-medium">{m.month}</td>
                  <td className="px-3 py-2.5 text-emerald-400 font-mono">${m.facturado.toLocaleString('es-CL')}</td>
                  <td className="px-3 py-2.5 text-blue-400 font-mono">${m.proyeccion.toLocaleString('es-CL')}</td>
                  <td className="px-3 py-2.5 text-gray-300 font-mono">${total.toLocaleString('es-CL')}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-surface-600 rounded-full h-1.5">
                        <div
                          className={clsx('h-full rounded-full', pct >= 90 ? 'bg-emerald-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500')}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-gray-400 w-10 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ClientesPage({ data }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <TopClientesChart data={data.by_cliente} limit={12} />
      <ClienteRanking data={data.by_cliente} limit={20} />
    </div>
  )
}

function GerentesPage({ data }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <TopGerentesChart data={data.by_gerente} limit={10} />
      <GerenteRanking data={data.by_gerente} limit={20} />
    </div>
  )
}

function TablaPage({ data, filteredRows, filters, setFilters }) {
  return (
    <div className="space-y-4 animate-fade-in">
      <Filters filters={filters} setFilters={setFilters} data={data} />
      <Table rows={filteredRows} />
    </div>
  )
}

// ── App principal ─────────────────────────────────────────────
export default function App() {
  const [activePage, setActivePage] = useState('overview')
  const {
    data, loading, error,
    lastUpdated, wsConnected,
    filters, setFilters,
    filteredRows,
    refetch, manualReload,
  } = useData()

  const pageTitles = {
    overview: { title: 'Resumen Ejecutivo',       sub: 'Vista consolidada de facturación y proyección 2026' },
    mensual:  { title: 'Evolución Mensual',        sub: 'Desglose mes a mes de facturado y proyectado' },
    clientes: { title: 'Clientes',                 sub: 'Ranking y detalle por cliente' },
    gerentes: { title: 'Gerentes de Cuentas',      sub: 'Ranking y detalle por gerente' },
    tabla:    { title: 'Detalle de Registros',     sub: 'Vista completa con filtros y exportación' },
  }

  const current = pageTitles[activePage] || pageTitles.overview

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      {/* Sidebar */}
      <Sidebar
        active={activePage}
        onChange={setActivePage}
        wsConnected={wsConnected}
        lastUpdated={lastUpdated}
        onReload={manualReload}
        loading={loading}
      />

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 min-h-full">
          {/* Header de página */}
          <PageHeader
            title={current.title}
            sub={current.sub}
            sourceFile={data?.kpis?.source_file}
          />

          {/* Estados */}
          {loading && !data && <LoadingScreen />}
          {error   && !data && <ErrorScreen error={error} onRetry={refetch} />}
          {!loading && !error && !data && <EmptyScreen onReload={manualReload} />}

          {/* Vistas con datos */}
          {data && !loading && (
            <>
              {activePage === 'overview'  && <OverviewPage data={data} />}
              {activePage === 'mensual'   && <MensualPage  data={data} />}
              {activePage === 'clientes'  && <ClientesPage data={data} />}
              {activePage === 'gerentes'  && <GerentesPage data={data} />}
              {activePage === 'tabla'     && (
                <TablaPage
                  data={data}
                  filteredRows={filteredRows}
                  filters={filters}
                  setFilters={setFilters}
                />
              )}
            </>
          )}

          {/* Indicador de recarga en background */}
          {loading && data && (
            <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-surface-700 border border-surface-500 rounded-full px-3 py-1.5 text-xs text-gray-400 shadow-lg">
              <Loader2 size={12} className="animate-spin text-brand-400" />
              Actualizando…
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
