import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Upload, Plus, Download, AlertCircle } from 'lucide-react'
import { loadsApi } from '../lib/api'
import { uploadDocument, isStorageConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import StatusBadge from './StatusBadge'
import StatusTimeline from './StatusTimeline'

const STATUSES = ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled']

function fmtDate(d) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d + 'T00:00:00'))
}
function fmtMoney(v) {
  if (!v) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  )
}

export default function LoadDetail({ loadId, onClose, onUpdated }) {
  const { user } = useAuth()
  const isDispatcher = user?.role === 'dispatcher'

  const [load, setLoad] = useState(null)
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [statusSaving, setStatusSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgLoading, setMsgLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')

  // Reset stale state whenever the target load changes
  useEffect(() => {
    if (loadId) {
      setLoad(null)
      setFetchError(null)
      setFetching(true)
      setMsg('')
      setUploadErr('')
    }
  }, [loadId])

  const fetch = useCallback(async () => {
    setFetching(true)
    setFetchError(null)
    try {
      const res = await loadsApi.getOne(loadId)
      setLoad(res.data.load)
    } catch (err) {
      setFetchError(err.response?.data?.detail || err.response?.data?.error || 'Failed to load details')
    } finally {
      setFetching(false)
    }
  }, [loadId])

  useEffect(() => { if (loadId) fetch() }, [fetch])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function changeStatus(e) {
    const status = e.target.value
    setStatusSaving(true)
    try {
      const res = await loadsApi.update(loadId, { status })
      setLoad(l => ({ ...l, status: res.data.load.status }))
      if (onUpdated) onUpdated(res.data.load)
    } catch {} finally { setStatusSaving(false) }
  }

  async function addUpdate(e) {
    e.preventDefault()
    if (!msg.trim()) return
    setMsgLoading(true)
    try {
      const res = await loadsApi.addUpdate(loadId, msg.trim())
      setLoad(l => ({ ...l, load_updates: [...(l.load_updates || []), res.data.update] }))
      setMsg('')
    } catch {} finally { setMsgLoading(false) }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadErr('')
    setUploadLoading(true)
    try {
      const url = await uploadDocument(file, loadId)
      const res = await loadsApi.addDocument(loadId, file.name, url)
      setLoad(l => ({ ...l, load_documents: [...(l.load_documents || []), res.data.document] }))
    } catch (err) {
      setUploadErr(err.message)
    } finally {
      setUploadLoading(false)
      e.target.value = ''
    }
  }

  return (
    <>
      <AnimatePresence>
        {loadId && (
          <motion.div
            key="detail-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black cursor-pointer"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {loadId && (
          <motion.aside
            key="detail-drawer"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[520px] bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#1a3a5c] flex-shrink-0">
              <div>
                <h2 className="text-white font-semibold">Load Details</h2>
                {load && <p className="text-white/50 text-xs mt-0.5">{load.origin} → {load.destination}</p>}
              </div>
              <button onClick={onClose} className="text-white/60 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {fetching ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#1a3a5c]" />
              </div>
            ) : fetchError ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-sm text-gray-500 text-center">{fetchError}</p>
                <button
                  onClick={fetch}
                  className="text-sm text-[#1a3a5c] font-medium hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : load ? (
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">

                {/* Status row */}
                <div className="px-6 py-3 bg-gray-50 flex items-center justify-between gap-4">
                  <StatusBadge status={load.status} size="md" />
                  {isDispatcher && (
                    <div className="flex items-center gap-2">
                      {statusSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
                      <select
                        value={load.status}
                        onChange={changeStatus}
                        disabled={statusSaving}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] bg-white disabled:opacity-50"
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Route + details */}
                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <Info label="Origin" value={load.origin} />
                    <Info label="Destination" value={load.destination} />
                    <Info label="Pickup Date" value={fmtDate(load.pickup_date)} />
                    <Info label="Delivery Date" value={fmtDate(load.delivery_date)} />
                    <Info label="Carrier / Driver" value={load.carrier || '—'} />
                    <Info label="Commodity" value={load.commodity || '—'} />
                    <Info label="Weight" value={load.weight ? `${Number(load.weight).toLocaleString()} lbs` : '—'} />
                    <Info label="Rate" value={fmtMoney(load.rate)} />
                  </div>

                  {load.broker && (
                    <div className="bg-[#1a3a5c]/5 border border-[#1a3a5c]/10 rounded-xl p-4">
                      <p className="text-xs font-semibold text-[#1a3a5c] uppercase tracking-wide mb-2">Broker</p>
                      <p className="text-sm font-semibold text-gray-900">{load.broker.name}</p>
                      {load.broker.company && <p className="text-xs text-gray-500">{load.broker.company}</p>}
                      <p className="text-xs text-gray-400">{load.broker.email}</p>
                    </div>
                  )}

                  {load.notes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-gray-700">{load.notes}</p>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="px-6 py-5 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Activity Timeline</h3>
                  <StatusTimeline updates={load.load_updates || []} />

                  <form onSubmit={addUpdate} className="flex gap-2">
                    <input
                      value={msg}
                      onChange={e => setMsg(e.target.value)}
                      placeholder="Add a status update..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                    />
                    <button
                      type="submit"
                      disabled={msgLoading || !msg.trim()}
                      className="px-3 py-2 bg-[#1a3a5c] text-white rounded-lg hover:bg-[#244f7a] disabled:opacity-40 transition-colors flex items-center"
                    >
                      {msgLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </form>
                </div>

                {/* Documents */}
                <div className="px-6 py-5 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Documents & Photos</h3>

                  {(load.load_documents || []).length > 0 && (
                    <ul className="space-y-2">
                      {load.load_documents.map(doc => (
                        <li key={doc.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                            <p className="text-xs text-gray-400">
                              {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(doc.created_at))}
                            </p>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-3 flex items-center gap-1.5 text-[#1a3a5c] text-sm font-medium hover:underline flex-shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}

                  {uploadErr && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700">{uploadErr}</p>
                    </div>
                  )}

                  {isStorageConfigured() ? (
                    <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl py-4 cursor-pointer transition-colors ${
                      uploadLoading ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-gray-300 hover:border-[#1a3a5c] hover:bg-[#1a3a5c]/5'
                    }`}>
                      {uploadLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin text-gray-400" /><span className="text-sm text-gray-500">Uploading...</span></>
                        : <><Upload className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-500">Upload photo or POD document</span></>
                      }
                      <input type="file" className="sr-only" accept="image/*,.pdf" onChange={handleUpload} disabled={uploadLoading} />
                    </label>
                  ) : (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <p className="text-xs text-amber-700">
                        Add <code className="font-mono">VITE_SUPABASE_URL</code> and <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> to enable file uploads.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            ) : null}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
