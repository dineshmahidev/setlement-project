import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api, { getToken, setToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [branchId, setBranchIdState] = useState(() => {
    const stored = localStorage.getItem('branch_id')
    return stored ? Number(stored) : null
  })

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const res = await api.get('/me')
      setUser(res.data.user)
      const uid = res.data.user
      if (uid && branchId == null) {
        const fallback = uid.default_branch_id || uid.branches?.[0]?.id || null
        if (fallback) {
          setBranchIdState(fallback)
          localStorage.setItem('branch_id', String(fallback))
        }
      }
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [branchId])

  useEffect(() => {
    refresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    const res = await api.post('/login', { email, password })
    setToken(res.data.token)
    setUser(res.data.user)
    const u = res.data.user
    const fallback = u.default_branch_id || u.branches?.[0]?.id || null
    if (fallback) {
      setBranchIdState(fallback)
      localStorage.setItem('branch_id', String(fallback))
    }
    return u
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } catch {
      // ignore
    }
    setToken(null)
    setUser(null)
    localStorage.removeItem('branch_id')
    setBranchIdState(null)
    window.location.href = '/login'
  }, [])

  const setBranchId = useCallback((id) => {
    setBranchIdState(id)
    if (id == null) localStorage.removeItem('branch_id')
    else localStorage.setItem('branch_id', String(id))
  }, [])

  const can = useCallback(
    (permission) => {
      if (!user) return false
      const perms = user.permissions || []
      if (perms.includes('*')) return true
      if (!permission) return true
      if (perms.includes(permission)) return true
      // wildcard: vendors.* style matching
      const [group] = permission.split('.')
      if (perms.includes(`${group}.*`)) return true
      return false
    },
    [user],
  )

  const hasBranch = useCallback(
    (id) => {
      if (!user) return false
      if (user.all_branches) return true
      if (!id) return true
      return (user.branches || []).some((b) => b.id === Number(id))
    },
    [user],
  )

  const showBranchFilter = useMemo(() => {
    if (!user) return false
    if (user.all_branches) return true
    return (user.branches || []).length > 1
  }, [user])

  const branches = useMemo(() => {
    if (!user) return []
    if (user.all_branches) return user.branches || []
    return user.branches || []
  }, [user])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      can,
      hasBranch,
      branchId,
      setBranchId,
      showBranchFilter,
      branches,
      refresh,
    }),
    [user, loading, login, logout, can, hasBranch, branchId, setBranchId, showBranchFilter, branches, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
