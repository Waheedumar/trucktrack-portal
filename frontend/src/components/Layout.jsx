import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Truck, LayoutDashboard, Users, LogOut, Menu } from 'lucide-react'

const NAV = {
  dispatcher: [
    { path: '/dispatcher', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/dispatcher/brokers', label: 'Brokers', icon: Users },
  ],
  broker: [
    { path: '/broker', label: 'My Shipments', icon: LayoutDashboard },
  ],
}

function SidebarContent({ onNav }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const nav = NAV[user?.role] || []

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col h-full bg-[#1a3a5c]">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
          <Truck className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-base leading-none">TruckTrack</p>
          <p className="text-white/40 text-xs mt-0.5">Broker Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              onClick={onNav}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-white/15 text-white' : 'text-white/55 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-white/40 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block w-60 flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mob-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.div
            key="mob-sidebar"
            initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="fixed left-0 top-0 bottom-0 w-60 z-40 md:hidden shadow-2xl"
          >
            <SidebarContent onNav={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#1a3a5c] border-b border-white/10 flex-shrink-0">
          <button onClick={() => setOpen(true)} className="text-white/70 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <Truck className="w-4 h-4 text-white" />
          <span className="text-white font-bold">TruckTrack</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
