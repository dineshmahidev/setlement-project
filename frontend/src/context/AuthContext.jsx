import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import api, { getToken, setCompanyId, setToken } from '../services/api'

const AuthContext = createContext(null)

function readStoredCompanyId() {
  const stored = localStorage.getItem('company_id')
  return stored ? Number(stored) : null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [allBranches, setAllBranches] = useState([])
  const [companies, setCompanies] = useState([])
  const [activeCompany, setActiveCompanyState] = useState(null)
  const [companyId, setCompanyIdState] = useState(readStoredCompanyId)
  const [branchId, setBranchIdState] = useState(() => {
    const stored = localStorage.getItem('branch_id')
    return stored ? Number(stored) : null
  })
  // Monotonic sequence so a slow/stale /me response can never overwrite a newer company switch.
  const refreshSeq = useRef(0)

  const applyCompany = useCallback((company, { keepBranch = false } = {}) => {
    setActiveCompanyState(company || null)
    if (company?.id) {
      setCompanyIdState(Number(company.id))
      setCompanyId(company.id)
    }
    if (!keepBranch) {
      // companyPayload has no nested branches: clear the stale branch header
      // immediately; refresh() reconciles it with the new company's branches.
      const firstBranch = company?.branches?.[0]?.id || null
      if (firstBranch) {
        setBranchIdState(Number(firstBranch))
        localStorage.setItem('branch_id', String(firstBranch))
      } else {
        setBranchIdState(null)
        localStorage.removeItem('branch_id')
      }
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    const seq = ++refreshSeq.current
    try {
      const [userRes, branchRes] = await Promise.all([
        api.get('/me'),
        api.get('/branches?per_page=100').catch(() => ({ data: { data: [] } })),
      ])
      // A newer refresh/company-switch started while this one was in flight:
      // discard this stale response instead of overwriting the active company.
      if (seq !== refreshSeq.current) return

      const userData = userRes.data.data || userRes.data.user || userRes.data
      setUser(userData)

      const fetchedCompanies = Array.isArray(userData?.companies) ? userData.companies : []
      setCompanies(fetchedCompanies)

      const fetchedBranches =
        branchRes.data?.data?.branches ||
        (Array.isArray(branchRes.data?.data) ? branchRes.data.data : Array.isArray(branchRes.data) ? branchRes.data : [])
      setAllBranches(fetchedBranches)

      const currentCompany =
        fetchedCompanies.find((c) => Number(c.id) === Number(userData?.active_company?.id)) ||
        userData?.active_company ||
        fetchedCompanies[0] ||
        null

      setActiveCompanyState(currentCompany)
      if (currentCompany?.id) {
        setCompanyIdState(Number(currentCompany.id))
        setCompanyId(currentCompany.id)
      }

      const allowedBranchIds = (userData?.branches || []).map((b) => Number(b.id))
      setBranchIdState((prev) => {
        const stillValid = prev != null && (allowedBranchIds.length === 0 || allowedBranchIds.includes(Number(prev)))
        // Only fall back to default_branch when it belongs to the ACTIVE company.
        const defaultId = Number(userData?.default_branch?.id)
        const next = stillValid
          ? prev
          : allowedBranchIds.includes(defaultId)
          ? defaultId
          : allowedBranchIds[0] || null
        if (next == null) localStorage.removeItem('branch_id')
        else localStorage.setItem('branch_id', String(next))
        return next
      })
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password, companyIdHint) => {
    const payload = { email, password }
    if (companyIdHint) payload.company_id = companyIdHint
    const res = await api.post('/login', payload)
    const token = res.data.data?.token || res.data.token
    const userData = res.data.data?.user || res.data.user
    setToken(token)
    setUser(userData)

    const fetchedCompanies = Array.isArray(userData?.companies) ? userData.companies : []
    setCompanies(fetchedCompanies)
    const company = userData?.active_company || fetchedCompanies[0] || null
    setActiveCompanyState(company)
    if (company?.id) {
      setCompanyIdState(Number(company.id))
      setCompanyId(company.id)
    }

    const fallback = userData?.default_branch?.id || userData?.branches?.[0]?.id || null
    if (fallback) {
      setBranchIdState(fallback)
      localStorage.setItem('branch_id', String(fallback))
    }
    return userData
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } catch {
      // ignore
    }
    setToken(null)
    setUser(null)
    setCompanyId(null)
    localStorage.removeItem('branch_id')
    setBranchIdState(null)
    window.location.href = '/login'
  }, [])

  const setBranchId = useCallback((id) => {
    setBranchIdState(id)
    if (id == null) localStorage.removeItem('branch_id')
    else localStorage.setItem('branch_id', String(id))
  }, [])

  const setCompany = useCallback(
    (company) => {
      applyCompany(company, { keepBranch: false })
      refresh()
    },
    [applyCompany, refresh],
  )

  const setCompanyById = useCallback(
    (id) => {
      const company = companies.find((c) => Number(c.id) === Number(id))
      if (company) {
        applyCompany(company, { keepBranch: false })
        refresh()
      }
    },
    [companies, applyCompany, refresh],
  )

  const setCompanyBySlug = useCallback(
    (slug) => {
      if (!slug) return
      const company = companies.find((c) => c.slug === slug || c.code === slug)
      if (company && Number(company.id) !== Number(companyId)) {
        applyCompany(company, { keepBranch: false })
        refresh()
      }
    },
    [companies, companyId, applyCompany, refresh],
  )

  const can = useCallback(
    (permission) => {
      if (!user) return false
      const roleName = (user.role?.name || '').toUpperCase()
      if (user.is_super_admin || roleName.includes('ADMIN') || roleName.includes('MANAGER')) return true
      const perms = user.permissions || []
      if (perms.includes('*')) return true
      if (!permission) return true
      if (perms.includes(permission)) return true
      const [group] = permission.split('.')
      if (perms.includes(`${group}.manage`) || perms.includes(`${group}.*`)) return true
      if (permission.startsWith('inventory') && perms.some((p) => p.startsWith('inventory'))) return true
      return false
    },
    [user],
  )

  const branches = useMemo(() => {
    if (!user) return []
    const scoped = (user.branches || []).filter(
      (b) => !activeCompany?.id || Number(b.company_id ?? b.company?.id ?? 0) === Number(activeCompany.id) || !b.company_id,
    )
    if (scoped.length > 0) return scoped
    if (user.is_super_admin || user.role?.name === 'SUPER ADMIN') return allBranches
    const userBranchIds = (user.branches || []).map((b) => Number(b.id))
    if (user.default_branch_id) userBranchIds.push(Number(user.default_branch_id))
    if (userBranchIds.length === 0) return allBranches
    return allBranches.filter((b) => userBranchIds.includes(Number(b.id)))
  }, [user, allBranches, activeCompany])

  const showBranchFilter = useMemo(() => {
    return user?.is_super_admin || user?.role?.name === 'SUPER ADMIN' || branches.length > 1
  }, [user, branches])

  const showCompanySwitcher = useMemo(() => companies.length > 1, [companies])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      can,
      branchId,
      setBranchId,
      showBranchFilter,
      branches,
      refresh,
      companies,
      activeCompany,
      companyId,
      setCompany,
      setCompanyById,
      setCompanyBySlug,
      showCompanySwitcher,
    }),
    [
      user,
      loading,
      login,
      logout,
      can,
      branchId,
      setBranchId,
      showBranchFilter,
      branches,
      refresh,
      companies,
      activeCompany,
      companyId,
      setCompany,
      setCompanyById,
      setCompanyBySlug,
      showCompanySwitcher,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
