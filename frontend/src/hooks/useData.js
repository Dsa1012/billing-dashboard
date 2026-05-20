/**
 * useData.js — Hook central de datos.
 * Conecta con el backend via REST + WebSocket.
 * Auto-refresca cuando el WS emite 'data_updated'.
 */

import { useState, useEffect, useCallback, useRef } from 'react'

const API_BASE = '/api'
const WS_URL   = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`

export function useData() {
  const [data,         setData]        = useState(null)
  const [loading,      setLoading]     = useState(true)
  const [error,        setError]       = useState(null)
  const [lastUpdated,  setLastUpdated] = useState(null)
  const [wsConnected,  setWsConnected] = useState(false)
  const [filters,      setFilters]     = useState({ cliente: '', gerente: '', cc: '', search: '' })

  const wsRef = useRef(null)

  // ── Fetch principal ────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API_BASE}/dashboard`)
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}))
        throw new Error(detail.detail || `HTTP ${res.status}`)
      }
      const json = await res.json()
      setData(json)
      setLastUpdated(json.kpis?.last_updated || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Reload manual ──────────────────────────────────────────
  const manualReload = useCallback(async () => {
    try {
      setLoading(true)
      await fetch(`${API_BASE}/reload`, { method: 'POST' })
      await fetchData()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }, [fetchData])

  // ── WebSocket ──────────────────────────────────────────────
  useEffect(() => {
    let reconnectTimer = null

    const connect = () => {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setWsConnected(true)
      }

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data)
          if (msg.event === 'data_updated') {
            fetchData()
          }
          if (msg.last_updated) {
            setLastUpdated(msg.last_updated)
          }
        } catch {}
      }

      ws.onclose = () => {
        setWsConnected(false)
        reconnectTimer = setTimeout(connect, 5000)
      }

      ws.onerror = () => ws.close()
    }

    connect()
    return () => {
      clearTimeout(reconnectTimer)
      wsRef.current?.close()
    }
  }, [fetchData])

  // ── Carga inicial ──────────────────────────────────────────
  useEffect(() => { fetchData() }, [fetchData])

  // ── Datos filtrados en cliente ─────────────────────────────
  const filteredRows = data?.rows?.filter(row => {
    const { cliente, gerente, cc, search } = filters
    if (cliente && !row.cliente.toLowerCase().includes(cliente.toLowerCase())) return false
    if (gerente && !row.gerente.toLowerCase().includes(gerente.toLowerCase())) return false
    if (cc      && !row.cc.toLowerCase().includes(cc.toLowerCase())) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        row.cliente.toLowerCase().includes(q)     ||
        row.descripcion.toLowerCase().includes(q) ||
        row.cc.toLowerCase().includes(q)          ||
        row.gerente.toLowerCase().includes(q)
      )
    }
    return true
  }) ?? []

  return {
    data,
    loading,
    error,
    lastUpdated,
    wsConnected,
    filters,
    setFilters,
    filteredRows,
    refetch: fetchData,
    manualReload,
  }
}

// ── Formateador de moneda CLP ────────────────────────────────
export const fmt = (val) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(val ?? 0)

export const fmtCompact = (val) => {
  const n = val ?? 0
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (Math.abs(n) >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export const pctColor = (pct) => {
  if (pct >= 90) return 'text-emerald-400'
  if (pct >= 60) return 'text-yellow-400'
  return 'text-red-400'
}
