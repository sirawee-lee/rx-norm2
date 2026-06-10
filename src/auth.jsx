import React, { createContext, useContext, useState } from 'react'

// Hardcoded accounts for demo
// In production: POST /auth/login → real JWT from FastAPI backend
const ACCOUNTS = {
  'admin':  { password: 'admin123',  role: 'admin',   name: 'System Admin',       institution: 'NHI / TFDA' },
  'staff':  { password: 'staff123',  role: 'staff',   name: 'Hospital Staff Demo', institution: 'NTHU Medical Center' },
  'doctor': { password: 'doctor123', role: 'staff',   name: 'Dr. Chen Wei',        institution: 'Hsinchu Regional Hospital' },
  'user':   { password: 'user123',   role: 'patient', name: 'Lin Mei-Ling 林美玲', institution: 'Hsinchu · NHI Card 0921-xxxx' },
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)  // null = guest / public
  const [error, setError] = useState('')

  function login(username, password) {
    const account = ACCOUNTS[username.toLowerCase()]
    if (!account || account.password !== password) {
      setError('Incorrect username or password.')
      return false
    }
    setError('')
    setUser({ username, role: account.role, name: account.name, institution: account.institution })
    return true
  }

  function logout() {
    setUser(null)
    setError('')
  }

  // Permission helpers
  const isAdmin   = user?.role === 'admin'
  const isStaff   = user?.role === 'admin' || user?.role === 'staff'
  const isPatient = user?.role === 'patient'
  const isGuest   = !user

  return (
    <AuthContext.Provider value={{ user, login, logout, error, setError, isAdmin, isStaff, isPatient, isGuest }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
