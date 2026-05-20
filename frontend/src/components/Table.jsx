/**
 * Table.jsx — Tabla de detalle con exportación a Excel y PDF.
 */

import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, ChevronUp, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { fmt, fmtCompact, pctColor } from '../hooks/useData'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Badge de tipo ─────────────────────────────────────────────
function TipoBadge({ tipo }) {
  if (tipo === 'facturado')  return <span className="badge-green">● Facturado</span>
  if (tipo === 'proyeccion') return <span className="badge-blue">● Proyección</span>
  return <span className="badge-gray">Sin color</span>
}

// ── Barra de progreso ─────────────────────────────────────────
function ProgressBar({ pct }) {
  const color = pct >= 90 ? 'bg-emerald-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-surface-600 rounded-full h-1.5 overflow-hidden">
        <div className={clsx(color, 'h-full rounded-full transition-all')} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={clsx('text-xs font-semibold w-10 text-right', pctColor(pct))}>
        {pct.toFixed(0)}%
      </span>
    </div>
  )
}

// ── Exportar Excel ────────────────────────────────────────────
function exportXLSX(rows) {
  const sheetData = rows.map(r => ({
    Cliente:           r.cliente,
    Descripción:       r.descripcion,
    CC:                r.cc,
    Gerente:           r.gerente,
    Cotización:        r.cotizacion,
    Facturado:         r.total_facturado,
    Proyección:        r.total_proyeccion,
    Diferencia:        r.diferencia,
    '% Cumplimiento':  r.pct_cumplimiento,
    ...Object.fromEntries(r.meses.map(m => [`${m.month} (${m.tipo})`, m.amount]))
  }))
  const ws = XLSX.utils.json_to_sheet(sheetData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Dashboard 2026')
  XLSX.writeFile(wb, 'billing_dashboard_2026.xlsx')
}

// ── Exportar PDF ──────────────────────────────────────────────
function exportPDF(rows) {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text('Billing Dashboard 2026', 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(`Exportado: ${new Date().toLocaleString('es-CL')}`, 14, 22)

  autoTable(doc, {
    startY: 28,
    head: [['Cliente', 'Gerente', 'CC', 'Cotización', 'Facturado', 'Proyección', '%']],
    body: rows.map(r => [
      r.cliente, r.gerente, r.cc,
      fmtCompact(r.cotizacion),
      fmtCompact(r.total_facturado),
      fmtCompact(r.total_proyeccion),
      `${r.pct_cumplimiento.toFixed(1)}%`,
    ]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [37, 45, 61], textColor: [180, 190, 210] },
    alternateRowStyles: { fillColor: [22, 27, 39] },
    bodyStyles: { textColor: [220, 220, 220], fillColor: [18, 22, 34] },
  })

  doc.save('billing_dashboard_2026.pdf')
}

// ── Componente principal ──────────────────────────────────────
export default function Table({ rows }) {
  const [sortKey,  setSortKey]  = useState('total_facturado')
  const [sortDir,  setSortDir]  = useState('desc')
  const [page,     setPage]     = useState(0)
  const pageSize = 20

  const handleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
    setPage(0)
  }

  const sorted = [...(rows ?? [])].sort((a, b) => {
    const va = a[sortKey] ?? ''
    const vb = b[sortKey] ?? ''
    if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va
    return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
  })

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize)

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return <ChevronUp size={12} className="opacity-20" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-brand-400" />
      : <ChevronDown size={12} className="text-brand-400" />
  }

  const cols = [
    { key: 'cliente',          label: 'Cliente' },
    { key: 'descripcion',      label: 'Descripción' },
    { key: 'cc',               label: 'CC' },
    { key: 'gerente',          label: 'Gerente' },
    { key: 'cotizacion',       label: 'Cotización',   num: true },
    { key: 'total_facturado',  label: 'Facturado',    num: true },
    { key: 'total_proyeccion', label: 'Proyección',   num: true },
    { key: 'diferencia',       label: 'Diferencia',   num: true },
    { key: 'pct_cumplimiento', label: '% Cump.' },
  ]

  return (
    <div className="card animate-fade-in space-y-3">
      {/* Header con exportación */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-200">Detalle de Registros</h3>
          <p className="text-xs text-gray-500">{rows?.length ?? 0} registros</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportXLSX(sorted)}
            className="btn-ghost flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300"
          >
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button
            onClick={() => exportPDF(sorted)}
            className="btn-ghost flex items-center gap-1.5 text-blue-400 hover:text-blue-300"
          >
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-surface-600">
        <table className="w-full text-xs">
          <thead className="bg-surface-700">
            <tr>
              {cols.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3 py-2.5 text-left text-gray-400 font-semibold uppercase tracking-wide cursor-pointer hover:text-gray-200 whitespace-nowrap select-none"
                >
                  <div className="flex items-center gap-1">
                    {col.label} <SortIcon k={col.key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={row.row_number}
                className={clsx(
                  'border-t border-surface-600 hover:bg-surface-700/50 transition-colors',
                  i % 2 === 0 ? 'bg-surface-800' : 'bg-surface-800/60'
                )}
              >
                <td className="px-3 py-2.5 text-gray-200 font-medium max-w-36 truncate" title={row.cliente}>{row.cliente}</td>
                <td className="px-3 py-2.5 text-gray-400 max-w-48 truncate" title={row.descripcion}>{row.descripcion || '—'}</td>
                <td className="px-3 py-2.5 text-gray-400">{row.cc}</td>
                <td className="px-3 py-2.5 text-gray-300 max-w-32 truncate" title={row.gerente}>{row.gerente}</td>
                <td className="px-3 py-2.5 text-right text-gray-300 font-mono">{fmtCompact(row.cotizacion)}</td>
                <td className="px-3 py-2.5 text-right text-emerald-400 font-mono font-semibold">{fmtCompact(row.total_facturado)}</td>
                <td className="px-3 py-2.5 text-right text-blue-400 font-mono">{fmtCompact(row.total_proyeccion)}</td>
                <td className="px-3 py-2.5 text-right font-mono">
                  <span className={row.diferencia <= 0 ? 'text-red-400' : 'text-yellow-400'}>
                    {fmtCompact(row.diferencia)}
                  </span>
                </td>
                <td className="px-3 py-2.5 min-w-28">
                  <ProgressBar pct={row.pct_cumplimiento} />
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-500">
                  No se encontraron registros con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Mostrando {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} de {sorted.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-ghost disabled:opacity-40 px-2 py-1"
            >←</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={clsx(
                    'w-7 h-7 rounded-md text-xs font-medium',
                    page === p ? 'bg-brand-600 text-white' : 'btn-ghost'
                  )}
                >{p + 1}</button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn-ghost disabled:opacity-40 px-2 py-1"
            >→</button>
          </div>
        </div>
      )}
    </div>
  )
}
