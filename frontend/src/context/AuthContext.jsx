import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('tt_token'))
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tt_user') || 'null') } catch { return null }
  })

  function login(tokenValue, userData) {
    localStorage.setItem('tt_token', tokenValue)
    localStorage.setItem('tt_user', JSON.stringify(userData))
    setToken(tokenValue)
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('tt_token')
    localStorage.removeItem('tt_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
