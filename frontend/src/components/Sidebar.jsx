import { useState } from 'react'
import { LayoutDashboard, TrendingUp, Users, Building2, BarChart3, RefreshCw, Wifi, WifiOff, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { id: 'overview',  label: 'Resumen',         icon: LayoutDashboard },
  { id: 'mensual',   label: 'Evolución Mensual',icon: TrendingUp },
  { id: 'clientes',  label: 'Clientes',         icon: Building2 },
  { id: 'gerentes',  label: 'Gerentes',         icon: Users },
  { id: 'tabla',     label: 'Detalle',          icon: BarChart3 },
]

export default function Sidebar({ active, onChange, wsConnected, lastUpdated, onReload, loading }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={clsx(
      'flex flex-col bg-surface-800 border-r border-surface-600 transition-all duration-300 shrink-0',
      collapsed ? 'w-16' : 'w-56'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-surface-600">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <BarChart3 size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white tracking-wide">BillingApp</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-surface-700 text-gray-400 hover:text-white transition-colors ml-auto"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            title={collapsed ? label : undefined}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              active === id
                ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                : 'text-gray-400 hover:bg-surface-700 hover:text-gray-200'
            )}
          >
            <Icon size={17} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-2 border-t border-surface-600 pt-3">
        {/* Estado WS */}
        <div className={clsx(
          'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs',
          collapsed ? 'justify-center' : ''
        )}>
          {wsConnected
            ? <Wifi size={14} className="text-emerald-400 shrink-0" />
            : <WifiOff size={14} className="text-red-400 shrink-0" />
          }
          {!collapsed && (
            <span className={wsConnected ? 'text-emerald-400' : 'text-red-400'}>
              {wsConnected ? 'En vivo' : 'Desconectado'}
            </span>
          )}
        </div>

        {/* Última actualización */}
        {!collapsed && lastUpdated && (
          <p className="text-xs text-gray-500 px-2 leading-tight">
            Actualizado:<br />
            <span className="text-gray-400">{lastUpdated}</span>
          </p>
        )}

        {/* Botón recargar */}
        <button
          onClick={onReload}
          disabled={loading}
          title="Recargar datos"
          className={clsx(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
            'bg-surface-700 hover:bg-surface-600 text-gray-300',
            collapsed ? 'justify-center' : ''
          )}
        >
          <RefreshCw size={13} className={clsx('shrink-0', loading && 'animate-spin')} />
          {!collapsed && 'Recargar'}
        </button>
      </div>
    </aside>
  )
}
