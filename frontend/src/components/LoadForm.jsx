import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { brokersApi, loadsApi } from '../lib/api'

const FIELD = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent'

export default function LoadForm({ open, onClose, onCreated }) {
  const [brokers, setBrokers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    broker_id: '', origin: '', destination: '',
    pickup_date: '', delivery_date: '', carrier: '',
    commodity: '', weight: '', rate: '', notes: '',
  })

  useEffect(() => {
    if (open) brokersApi.getAll().then(r => setBrokers(r.data.brokers)).catch(() => {})
  }, [open])

  function set(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { ...form }
      if (!payload.delivery_date) delete payload.delivery_date
      if (!payload.carrier) delete payload.carrier
      if (!payload.commodity) delete payload.commodity
      if (!payload.notes) delete payload.notes
      if (payload.weight) payload.weight = Number(payload.weight); else delete payload.weight
      if (payload.rate) payload.rate = Number(payload.rate); else delete payload.rate

      const res = await loadsApi.create(payload)
      onCreated(res.data.load)
      onClose()
      setForm({ broker_id: '', origin: '', destination: '', pickup_date: '', delivery_date: '', carrier: '', commodity: '', weight: '', rate: '', notes: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create load')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="form-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50" onClick={onClose}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.div
            key="form-modal"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Create New Load</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Fill in the freight details below</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={submit} className="px-6 py-5 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Broker *</label>
                  <select name="broker_id" value={form.broker_id} onChange={set} required className={FIELD}>
                    <option value="">Select a broker...</option>
                    {brokers.map(b => (
                      <option key={b.id} value={b.id}>{b.name}{b.company ? ` — ${b.company}` : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'origin', label: 'Origin *', placeholder: 'Chicago, IL', required: true },
                    { name: 'destination', label: 'Destination *', placeholder: 'Dallas, TX', required: true },
                  ].map(({ name, label, placeholder, required }) => (
                    <div key={name}>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                      <input type="text" name={name} value={form[name]} onChange={set} required={required} placeholder={placeholder} className={FIELD} />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Pickup Date *</label>
                    <input type="date" name="pickup_date" value={form.pickup_date} onChange={set} required className={FIELD} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Delivery Date</label>
                    <input type="date" name="delivery_date" value={form.delivery_date} onChange={set} className={FIELD} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Carrier / Driver</label>
                    <input type="text" name="carrier" value={form.carrier} onChange={set} placeholder="ABC Trucking" className={FIELD} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Commodity</label>
                    <input type="text" name="commodity" value={form.commodity} onChange={set} placeholder="Electronics, Furniture..." className={FIELD} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Weight (lbs)</label>
                    <input type="number" name="weight" value={form.weight} onChange={set} placeholder="42000" min="0" className={FIELD} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Rate ($)</label>
                    <input type="number" name="rate" value={form.rate} onChange={set} placeholder="2500.00" min="0" step="0.01" className={FIELD} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes</label>
                  <textarea name="notes" value={form.notes} onChange={set} rows={3} placeholder="Special instructions, hazmat info..." className={`${FIELD} resize-none`} />
                </div>

                <div className="flex gap-3 pt-1 pb-1">
                  <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-[#1a3a5c] text-white rounded-xl text-sm font-medium hover:bg-[#244f7a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Create Load
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
