import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../../services/api'

const WebsiteCmsContext = createContext({
  companies: [],
  primaryCompany: null,
  loading: true,
  getCmsImage: (_key, fallback = '') => fallback,
})

export function WebsiteCmsProvider({ children }) {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    api
      .get('/public/cms')
      .then((res) => {
        if (!active) return
        const list = res.data?.data
        setCompanies(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (active) setCompanies([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const primaryCompany = useMemo(() => {
    if (companies.length === 0) return null
    return (
      companies.find((company) =>
        ['laxmi', 'laxmi-traders', 'lt'].includes(String(company.slug || company.code || '').toLowerCase()),
      ) || companies[0]
    )
  }, [companies])

  const getCmsImage = useCallback(
    (key, fallback = '') => {
      for (const company of companies) {
        const direct = company?.[key]
        if (direct) return direct
        const nested = company?.cms_images?.[key]
        if (nested) return nested
      }
      return fallback
    },
    [companies],
  )

  return (
    <WebsiteCmsContext.Provider value={{ companies, primaryCompany, loading, getCmsImage }}>
      {children}
    </WebsiteCmsContext.Provider>
  )
}

export function useWebsiteCms() {
  return useContext(WebsiteCmsContext)
}
