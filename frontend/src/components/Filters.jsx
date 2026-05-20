import { Search, X } from 'lucide-react'

export default function Filters({ filters, setFilters, data }) {
  const clientes = [...new Set(data?.rows?.map(r => r.cliente) ?? [])].sort()
  const gerentes = [...new Set(data?.rows?.map(r => r.gerente) ?? [])].sort()
  const ccs      = [...new Set(data?.rows?.map(r => r.cc)      ?? [])].sort()

  const set = (key, val) => setFilters(f => ({ ...f, [key]: val }))
  const clear = () => setFilters({ cliente: '', gerente: '', cc: '', search: '' })
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="flex flex-wrap items-center gap-3 bg-surface-800 border border-surface-600 rounded-xl px-4 py-3">
      {/* Búsqueda global */}
      <div className="relative flex-1 min-w-48">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          className="input-dark pl-8"
          placeholder="Buscar cliente, descripción, CC…"
          value={filters.search}
          onChange={e => set('search', e.target.value)}
        />
      </div>

      {/* Filtro cliente */}
      <select
        className="input-dark w-44"
        value={filters.cliente}
        onChange={e => set('cliente', e.target.value)}
      >
        <option value="">Todos los clientes</option>
        {clientes.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* Filtro gerente */}
      <select
        className="input-dark w-44"
        value={filters.gerente}
        onChange={e => set('gerente', e.target.value)}
      >
        <option value="">Todos los gerentes</option>
        {gerentes.map(g => <option key={g} value={g}>{g}</option>)}
      </select>

      {/* Filtro CC */}
      <select
        className="input-dark w-36"
        value={filters.cc}
        onChange={e => set('cc', e.target.value)}
      >
        <option value="">Todos los CC</option>
        {ccs.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* Limpiar */}
      {hasFilters && (
        <button onClick={clear} className="btn-ghost flex items-center gap-1.5">
          <X size={13} /> Limpiar
        </button>
      )}
    </div>
  )
}
