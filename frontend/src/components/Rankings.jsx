import clsx from 'clsx'
import { fmtCompact, pctColor } from '../hooks/useData'

function RankRow({ rank, name, facturado, proyeccion, pct, sub }) {
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-surface-600 last:border-0 hover:bg-surface-700/30 rounded-lg px-2 transition-colors">
      <span className="text-sm w-6 shrink-0 text-center">
        {rank <= 3 ? medals[rank - 1] : <span className="text-gray-500 font-mono text-xs">{rank}</span>}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200 font-medium truncate" title={name}>{name}</p>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-emerald-400">{fmtCompact(facturado)}</p>
        <p className="text-xs text-blue-400">{fmtCompact(proyeccion)}</p>
      </div>
      <div className="w-10 text-right">
        <span className={clsx('text-xs font-bold', pctColor(pct))}>{pct.toFixed(0)}%</span>
      </div>
    </div>
  )
}

export function ClienteRanking({ data, limit = 10 }) {
  const top = [...(data ?? [])].sort((a, b) => b.total_facturado - a.total_facturado).slice(0, limit)
  return (
    <div className="card animate-slide-up">
      <h3 className="text-sm font-semibold text-gray-200 mb-3">Ranking Clientes</h3>
      <div className="flex gap-4 text-xs text-gray-500 px-2 mb-1">
        <span className="flex-1">Cliente</span>
        <span>Facturado / Proy.</span>
        <span className="w-10 text-right">%</span>
      </div>
      {top.map((c, i) => (
        <RankRow
          key={c.cliente}
          rank={i + 1}
          name={c.cliente}
          facturado={c.total_facturado}
          proyeccion={c.total_proyeccion}
          pct={c.pct_cumplimiento}
          sub={c.gerentes?.join(', ')}
        />
      ))}
    </div>
  )
}

export function GerenteRanking({ data, limit = 8 }) {
  const top = [...(data ?? [])].sort((a, b) => b.total_facturado - a.total_facturado).slice(0, limit)
  return (
    <div className="card animate-slide-up">
      <h3 className="text-sm font-semibold text-gray-200 mb-3">Ranking Gerentes</h3>
      <div className="flex gap-4 text-xs text-gray-500 px-2 mb-1">
        <span className="flex-1">Gerente</span>
        <span>Facturado / Proy.</span>
        <span className="w-10 text-right">%</span>
      </div>
      {top.map((g, i) => (
        <RankRow
          key={g.gerente}
          rank={i + 1}
          name={g.gerente}
          facturado={g.total_facturado}
          proyeccion={g.total_proyeccion}
          pct={g.pct_cumplimiento}
          sub={`${g.num_clientes} cliente${g.num_clientes !== 1 ? 's' : ''}`}
        />
      ))}
    </div>
  )
}
