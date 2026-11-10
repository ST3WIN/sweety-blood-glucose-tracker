import { useEffect, useState } from 'react'
import api from '../services/api'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    api
      .get('/auth/me')
      .then((res) => {
        if (active) setUser(res.data.user)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    setUser(data.user)
    return data.user
  }

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    setUser(data.user)
    return data.user
  }

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data.user)
      return res.data.user
    } catch {
      setUser(null)
      return null
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.warn('Logout request failed, clearing local state:', err)
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
