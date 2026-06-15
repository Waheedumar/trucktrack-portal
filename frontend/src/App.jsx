import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import DispatcherDashboard from './pages/DispatcherDashboard'
import BrokerPortal from './pages/BrokerPortal'

function Protected({ children, role }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (role && user?.role !== role) {
    return <Navigate to={user?.role === 'dispatcher' ? '/dispatcher' : '/broker'} replace />
  }
  return children
}

function RootRedirect() {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <Navigate to={user?.role === 'dispatcher' ? '/dispatcher' : '/broker'} replace />
}

export default function App() {
  const { token, user } = useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={token
            ? <Navigate to={user?.role === 'dispatcher' ? '/dispatcher' : '/broker'} replace />
            : <Login />}
        />
        <Route path="/dispatcher" element={
          <Protected role="dispatcher"><DispatcherDashboard /></Protected>
        } />
        <Route path="/broker" element={
          <Protected role="broker"><BrokerPortal /></Protected>
        } />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
