import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Package, Truck, CheckCircle2, Clock, SlidersHorizontal } from 'lucide-react'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import LoadForm from '../components/LoadForm'
import LoadDetail from '../components/LoadDetail'
import { loadsApi } from '../lib/api'

function fmtDate(d) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(d + 'T00:00:00'))
}

function fmtMoney(v) {
  if (!v) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
}

const STAT_KEYS = [
  { key: 'total',     label: 'Total Loads',  icon: Package,      bg: 'bg-[#1a3a5c]/8',  text: 'text-[#1a3a5c]' },
  { key: 'inTransit', label: 'In Transit',   icon: Truck,        bg: 'bg-purple-50',    text: 'text-purple-700' },
  { key: 'delivered', label: 'Delivered',    icon: CheckCircle2, bg: 'bg-green-50',     text: 'text-green-700' },
  { key: 'pending',   label: 'Pending',      icon: Clock,        bg: 'bg-amber-50',     text: 'text-amber-700' },
]

export default function DispatcherDashboard() {
  const [loads, setLoads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    loadsApi.getAll()
      .then(r => setLoads(r.data.loads))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: loads.length,
    inTransit: loads.filter(l => l.status === 'in_transit').length,
    delivered: loads.filter(l => l.status === 'delivered').length,
    pending: loads.filter(l => l.status === 'pending').length,
  }

  const filtered = loads.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !q || [l.origin, l.destination, l.broker?.name, l.broker?.company, l.carrier]
      .some(v => v?.toLowerCase().includes(q))
    const matchStatus = statusFilter === 'all' || l.status === statusFilter
    return matchSearch && matchStatus
  })

  function onCreated(load) { setLoads(p => [load, ...p]) }
  function onUpdated(load) { setLoads(p => p.map(l => l.id === load.id ? { ...l, ...load } : l)) }

  return (
    <Layout>
      <div className="px-6 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Loads</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage and dispatch all freight loads</p>
          </div>
          <motion.button
            onClick={() => setShowForm(true)}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 bg-[#1a3a5c] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#244f7a] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Load
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {STAT_KEYS.map(({ key, label, icon: Icon, bg, text }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-gray-200 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{label}</p>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
                  <Icon className={`w-4 h-4 ${text}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats[key]}</p>
            </motion.div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Search origin, destination, broker, carrier..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] bg-white"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-7 h-7 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-gray-400 gap-3">
              <Package className="w-10 h-10" />
              <p className="text-sm">{search || statusFilter !== 'all' ? 'No loads match your filters' : 'No loads yet — create one to get started'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3.5 font-medium text-gray-400 text-xs uppercase tracking-wide">Route</th>
                    <th className="text-left px-5 py-3.5 font-medium text-gray-400 text-xs uppercase tracking-wide">Broker</th>
                    <th className="text-left px-5 py-3.5 font-medium text-gray-400 text-xs uppercase tracking-wide">Carrier</th>
                    <th className="text-left px-5 py-3.5 font-medium text-gray-400 text-xs uppercase tracking-wide">Pickup</th>
                    <th className="text-left px-5 py-3.5 font-medium text-gray-400 text-xs uppercase tracking-wide">Rate</th>
                    <th className="text-left px-5 py-3.5 font-medium text-gray-400 text-xs uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((load, i) => (
                    <motion.tr
                      key={load.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.025, 0.3) }}
                      onClick={() => setActiveId(load.id)}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 group-hover:text-[#1a3a5c] transition-colors">{load.origin}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{load.destination}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-700">{load.broker?.name || '—'}</p>
                        {load.broker?.company && <p className="text-xs text-gray-400">{load.broker.company}</p>}
                      </td>
                      <td className="px-5 py-4 text-gray-600">{load.carrier || '—'}</td>
                      <td className="px-5 py-4 text-gray-600">{fmtDate(load.pickup_date)}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{fmtMoney(load.rate)}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={load.status} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                <p className="text-xs text-gray-400">
                  {filtered.length} {filtered.length === 1 ? 'load' : 'loads'}
                  {filtered.length !== loads.length && ` (filtered from ${loads.length})`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <LoadForm open={showForm} onClose={() => setShowForm(false)} onCreated={onCreated} />
      <LoadDetail loadId={activeId} onClose={() => setActiveId(null)} onUpdated={onUpdated} />
    </Layout>
  )
}
