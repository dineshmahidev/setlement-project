import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import api, { getToken, setCompanyId, setToken } from '../services/api'
import { extractList } from '../utils/helpers'

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
    // "All godowns" is stored as an explicit 'all' sentinel — state stays null.
    if (stored === 'all') return null
    return stored ? Number(stored) : null
  })
  // Monotonic sequence so a slow/stale /me response can never overwrite a newer company switch.
  const refreshSeq = useRef(0)
  const retryRef = useRef(0)
  // refresh() is memoised with [] deps — read live session state through refs
  // instead of the (always stale) closure values.
  const userRef = useRef(null)

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
      userRef.current = userData
      retryRef.current = 0

      const fetchedCompanies = Array.isArray(userData?.companies) ? userData.companies : []
      setCompanies(fetchedCompanies)

      const fetchedBranches = extractList(branchRes)
      setAllBranches(fetchedBranches)

      const storedCompId = readStoredCompanyId()
      const currentCompany =
        (storedCompId ? fetchedCompanies.find((c) => Number(c.id) === Number(storedCompId)) : null) ||
        fetchedCompanies.find((c) => Number(c.id) === Number(userData?.active_company?.id)) ||
        userData?.active_company ||
        fetchedCompanies[0] ||
        null

      setActiveCompanyState(currentCompany)
      if (currentCompany?.id) {
        setCompanyIdState(Number(currentCompany.id))
        setCompanyId(currentCompany.id)
      }

      // Explicit "All godowns" selection must survive reloads — skip the
      // default-branch fallback while the 'all' sentinel is stored.
      if (localStorage.getItem('branch_id') === 'all') {
        setBranchIdState(null)
        return
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
    } catch (err) {
      // A superseded refresh must never kill the session (StrictMode mounts
      // refresh() twice; the older one would otherwise nuke auth state and
      // bounce a valid session to the login page).
      if (seq === refreshSeq.current) {
        const status = err?.response?.status
        // Only an actual auth failure may end the session. A 500 / network blip
        // must NOT log the user out — keep the existing user and retry once.
        if (status === 401 || status === 419) {
          setToken(null)
          setUser(null)
          userRef.current = null
        } else if (userRef.current === null) {
          // First load with no user yet → retry so a transient server error
          // doesn't leave the app stuck on the login screen.
          retryRef.current += 1
          if (retryRef.current <= 2) {
            setTimeout(() => refresh(), 1500)
          }
        }
      }
    } finally {
      // Only the latest in-flight refresh may clear the loading gate;
      // otherwise the stale one flips loading=false with user still null and
      // <Protected> navigates to /panel/login before /me resolves.
      if (seq === refreshSeq.current) setLoading(false)
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
    userRef.current = userData
    retryRef.current = 0

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
    userRef.current = null
    setCompanyId(null)
    localStorage.removeItem('branch_id')
    setBranchIdState(null)
    window.location.href = '/login'
  }, [])

  const setBranchId = useCallback((id) => {
    setBranchIdState(id)
    // null = "All godowns" → persist an explicit sentinel so refresh() keeps it.
    if (id == null) localStorage.setItem('branch_id', 'all')
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

  const isSuperAdmin = useMemo(() => {
    if (!user) return false
    const roleName = (user.role?.name || user.role?.label || '').toUpperCase()
    return Boolean(
      user.is_super_admin ||
      roleName.includes('SUPER') ||
      roleName.includes('MASTER') ||
      user.role?.name === 'super_admin' ||
      user.email === 'admin@laxmitraders.com'
    )
  }, [user])

  const isAdmin = useMemo(() => {
    if (!user || isSuperAdmin) return false
    const roleName = (user.role?.name || user.role?.label || '').toUpperCase()
    return Boolean(
      roleName.includes('ADMIN') ||
      user.role?.name === 'admin'
    )
  }, [user, isSuperAdmin])

  const isBranchManagerOrStaff = useMemo(() => {
    if (!user || isSuperAdmin || isAdmin) return false
    const roleName = (user.role?.name || user.role?.label || '').toUpperCase()
    return Boolean(
      roleName.includes('MANAGER') ||
      roleName.includes('STAFF') ||
      roleName.includes('OPERATOR') ||
      user.role?.name === 'branch_manager' ||
      user.role?.name === 'staff'
    )
  }, [user, isSuperAdmin, isAdmin])

  const can = useCallback(
    (permission) => {
      if (!user) return false
      if (isSuperAdmin) return true

      // Branch Manager / Staff: ONLY Inventory is accessible
      if (isBranchManagerOrStaff) {
        if (!permission) return true
        return permission.startsWith('inventory')
      }

      // Admin role can access Settlement, Inventory, and User Management
      if (isAdmin) {
        if (
          permission &&
          (permission === 'super_admin' ||
            permission.startsWith('branches.') ||
            permission.startsWith('companies.') ||
            permission.startsWith('settings.') ||
            permission.startsWith('audit.') ||
            permission.startsWith('cms.'))
        ) {
          return false
        }
        return true
      }

      // Confidential modules restricted ONLY to Super Admin / Master Admin
      if (
        permission &&
        (permission === 'super_admin' ||
          permission.startsWith('branches.') ||
          permission.startsWith('companies.') ||
          permission.startsWith('settings.') ||
          permission.startsWith('audit.') ||
          permission.startsWith('cms.'))
      ) {
        return false
      }

      const roleName = (user.role?.name || '').toUpperCase()
      if (roleName.includes('ADMIN')) return true
      const perms = user.permissions || []
      if (perms.includes('*')) return true
      if (!permission) return true
      if (perms.includes(permission)) return true
      const [group] = permission.split('.')
      if (perms.includes(`${group}.manage`) || perms.includes(`${group}.*`)) return true
      if (permission.startsWith('inventory') && perms.some((p) => p.startsWith('inventory'))) return true
      return false
    },
    [user, isSuperAdmin, isAdmin, isBranchManagerOrStaff],
  )

  const branches = useMemo(() => {
    if (!user) return []
    const activeId = activeCompany?.id ? Number(activeCompany.id) : null

    // Super Admin: always show all godowns belonging to the active company
    if (isSuperAdmin) {
      const companyBranches = allBranches.filter(
        (b) => !activeId || Number(b.company_id ?? b.company?.id ?? 0) === activeId,
      )
      if (companyBranches.length > 0) return companyBranches
      if (Array.isArray(activeCompany?.branches) && activeCompany.branches.length > 0) {
        return activeCompany.branches
      }
      if (allBranches.length > 0) return allBranches
      return user.branches || []
    }

    // Standard user: assigned branches for this company
    const scoped = (user.branches || []).filter(
      (b) => !activeId || Number(b.company_id ?? b.company?.id ?? 0) === activeId,
    )
    if (scoped.length > 0) return scoped

    if (Array.isArray(activeCompany?.branches) && activeCompany.branches.length > 0) {
      return activeCompany.branches
    }

    const companyBranches = allBranches.filter(
      (b) => !activeId || Number(b.company_id ?? b.company?.id ?? 0) === activeId,
    )
    if (companyBranches.length > 0) return companyBranches

    return allBranches
  }, [user, isSuperAdmin, allBranches, activeCompany])

  const showBranchFilter = useMemo(() => {
    return isSuperAdmin || branches.length > 1
  }, [isSuperAdmin, branches])

  const showCompanySwitcher = useMemo(() => isSuperAdmin || companies.length > 1, [isSuperAdmin, companies])

  const value = useMemo(
    () => ({
      user,
      isSuperAdmin,
      isAdmin,
      isBranchManagerOrStaff,
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
      isSuperAdmin,
      isAdmin,
      isBranchManagerOrStaff,
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
