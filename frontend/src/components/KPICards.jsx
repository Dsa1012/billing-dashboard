import { TrendingUp, DollarSign, Target, Users, Briefcase, FileText } from 'lucide-react'
import clsx from 'clsx'
import { fmtCompact, pctColor } from '../hooks/useData'

function KPICard({ icon: Icon, label, value, sub, accent = 'blue', animate = false }) {
  const accents = {
    green:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue:   'text-blue-400   bg-blue-500/10   border-blue-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    red:    'text-red-400    bg-red-500/10    border-red-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    gray:   'text-gray-400   bg-gray-500/10   border-gray-500/20',
  }
  const iconClass = accents[accent] || accents.blue

  return (
    <div className="card animate-slide-up hover:shadow-xl group cursor-default">
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('p-2 rounded-lg border', iconClass)}>
          <Icon size={18} />
        </div>
        {animate && (
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5 font-medium uppercase tracking-wide">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function KPICards({ kpis }) {
  if (!kpis) return null

  const pct = kpis.pct_cumplimiento
  const pctAcc = pct >= 90 ? 'green' : pct >= 60 ? 'yellow' : 'red'

  const sinAsignar = kpis.sin_asignar ?? kpis.diferencia ?? 0

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <KPICard
        icon={DollarSign}
        label="Total a Facturar 2026"
        value={fmtCompact(kpis.total_a_facturar ?? kpis.total_cotizacion)}
        sub="Plan anual BJ–BU"
        accent="gray"
      />
      <KPICard
        icon={TrendingUp}
        label="Facturado"
        value={fmtCompact(kpis.total_facturado)}
        sub="Verde en Excel"
        accent="green"
        animate
      />
      <KPICard
        icon={Target}
        label="Proyección"
        value={fmtCompact(kpis.total_proyeccion)}
        sub="Azul en Excel"
        accent="blue"
      />
      <KPICard
        icon={FileText}
        label="Sin Asignar"
        value={fmtCompact(sinAsignar)}
        sub="Sin color en Excel"
        accent={sinAsignar > 0 ? 'yellow' : 'gray'}
      />
      <KPICard
        icon={Briefcase}
        label="% Cumplimiento"
        value={`${pct.toFixed(1)}%`}
        sub={`${kpis.num_registros} registros`}
        accent={pctAcc}
      />
      <KPICard
        icon={Users}
        label="Clientes"
        value={kpis.num_clientes}
        sub={`${kpis.num_gerentes} gerentes`}
        accent="purple"
      />
    </div>
  )
}
