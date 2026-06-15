import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, ArrowRight, ChevronDown, Download, Truck, Loader2 } from 'lucide-react'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import StatusTimeline from '../components/StatusTimeline'
import { loadsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const FILTERS = [
  { value: 'all',        label: 'All' },
  { value: 'pending',    label: 'Pending' },
  { value: 'assigned',   label: 'Assigned' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered',  label: 'Delivered' },
]

function shortDate(d) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d + 'T00:00:00'))
}

function ShipmentCard({ load }) {
  const [expanded, setExpanded] = useState(false)
  const [detail, setDetail] = useState(null)
  const [fetching, setFetching] = useState(false)

  async function toggle() {
    if (expanded) { setExpanded(false); return }
    setExpanded(true)
    if (!detail) {
      setFetching(true)
      try {
        const res = await loadsApi.getOne(load.id)
        setDetail(res.data.load)
      } catch {} finally { setFetching(false) }
    }
  }

  const docs = detail?.load_documents || []
  const updates = detail?.load_updates || []

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <button onClick={toggle} className="w-full text-left p-5 hover:bg-gray-50/60 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <StatusBadge status={load.status} size="sm" />
              <span className="text-xs text-gray-400">
                Pickup {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(load.pickup_date + 'T00:00:00'))}
              </span>
            </div>
            <div className="flex items-center gap-2 font-semibold text-gray-900 text-base">
              <span className="truncate">{load.origin}</span>
              <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{load.destination}</span>
            </div>
            {load.carrier && (
              <div className="flex items-center gap-1.5 mt-1.5 text-gray-500 text-sm">
                <Truck className="w-3.5 h-3.5" />
                <span>{load.carrier}</span>
              </div>
            )}
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0 mt-1">
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </motion.div>
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 px-5 pt-4 pb-5 space-y-5">
              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                {[
                  ['Pickup Date', shortDate(load.pickup_date)],
                  ['Delivery Date', shortDate(load.delivery_date)],
                  ['Commodity', load.commodity || '—'],
                  ['Weight', load.weight ? `${Number(load.weight).toLocaleString()} lbs` : '—'],
                  ['Carrier', load.carrier || '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
                    <p className="text-sm text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              {fetching && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-[#1a3a5c]" />
                </div>
              )}

              {detail && (
                <>
                  {/* Status timeline */}
                  {updates.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Status Updates</h4>
                      <StatusTimeline updates={updates} />
                    </div>
                  )}

                  {/* Documents / POD */}
                  {docs.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Documents & POD</h4>
                      <div className="space-y-2">
                        {docs.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Uploaded {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(doc.created_at))}
                              </p>
                            </div>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="ml-4 flex items-center gap-1.5 bg-[#1a3a5c] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#244f7a] transition-colors flex-shrink-0"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {updates.length === 0 && docs.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">No updates or documents yet.</p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function BrokerPortal() {
  const { user } = useAuth()
  const [loads, setLoads] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadsApi.getAll()
      .then(r => setLoads(r.data.loads))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: loads.length,
    active: loads.filter(l => ['assigned', 'in_transit'].includes(l.status)).length,
    delivered: loads.filter(l => l.status === 'delivered').length,
    pending: loads.filter(l => l.status === 'pending').length,
  }

  const filtered = filter === 'all' ? loads : loads.filter(l => l.status === filter)

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-6">

        {/* Welcome header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-[#1a3a5c] uppercase tracking-widest mb-1">
            {user?.company || 'Broker Portal'}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">My Shipments</h1>
          <p className="text-sm text-gray-400 mt-1">Track the real-time status of your freight</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            { label: 'Total', value: stats.total, accent: 'border-l-[#1a3a5c]' },
            { label: 'Active', value: stats.active, accent: 'border-l-purple-500' },
            { label: 'Delivered', value: stats.delivered, accent: 'border-l-green-500' },
            { label: 'Pending', value: stats.pending, accent: 'border-l-amber-500' },
          ].map(({ label, value, accent }) => (
            <div key={label} className={`bg-white border border-gray-200 border-l-4 ${accent} rounded-xl p-4`}>
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap mb-5">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === value
                  ? 'bg-[#1a3a5c] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Shipments */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400 gap-3">
            <Package className="w-10 h-10" />
            <p className="text-sm">No shipments found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((load, i) => (
              <motion.div
                key={load.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.4) }}
              >
                <ShipmentCard load={load} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
