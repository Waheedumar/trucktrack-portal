import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Truck, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../lib/api'

const INPUT = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent transition-shadow bg-white'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      login(res.data.token, res.data.user)
      navigate(res.data.user.role === 'dispatcher' ? '/dispatcher' : '/broker', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] bg-[#1a3a5c] px-14 py-12 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/[0.04]" />
          <div className="absolute bottom-16 -left-24 w-80 h-80 rounded-full bg-white/[0.04]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02]" />
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-xl leading-none">TruckTrack</p>
            <p className="text-white/40 text-xs mt-0.5">Broker Portal</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative">
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-white/50 text-sm font-medium uppercase tracking-widest mb-4"
          >
            Freight Management
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="text-5xl font-bold text-white leading-[1.15] mb-6"
          >
            Move freight<br />with confidence.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/55 text-lg leading-relaxed max-w-sm"
          >
            Real-time load tracking, instant status updates, and seamless broker communication — all in one place.
          </motion.p>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex gap-10 relative"
        >
          {[['500+', 'Loads Managed'], ['98%', 'On-Time Rate'], ['24/7', 'Live Visibility']].map(([num, label]) => (
            <div key={label}>
              <p className="text-white text-2xl font-bold">{num}</p>
              <p className="text-white/40 text-sm">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-[360px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 bg-[#1a3a5c] rounded-xl flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <p className="text-[#1a3a5c] font-bold text-lg">TruckTrack</p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-400 text-sm mb-8">Sign in to your portal account</p>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="err"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required autoFocus placeholder="you@company.com" className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="••••••••" className={INPUT}
              />
            </div>

            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full bg-[#1a3a5c] hover:bg-[#244f7a] text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2 shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </motion.button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-10">
            © {new Date().getFullYear()} TruckTrack Portal
          </p>
        </motion.div>
      </div>
    </div>
  )
}
