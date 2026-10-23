import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * Two-way sync between a screen's godown <Select> and the top-navbar godown picker.
 *
 *  - Navbar change  → the screen selector follows automatically
 *  - Screen change  → the navbar (and X-Branch-Id header scope) follows too
 *
 * @param {*} screenValue    current value of the screen selector ('' = All Godowns)
 * @param {Function} setScreenValue  accepts the new raw string value
 * @param {boolean} enabled  pass false while editing a stored record so its
 *                           branch value is not stomped by the navbar
 * @returns onChange handler for <Select> (also callable with a raw string)
 */
export function useGodownSync(screenValue, setScreenValue, enabled = true) {
  const { branchId, setBranchId } = useAuth()

  const navValue = branchId == null ? '' : String(branchId)
  const current = screenValue == null ? '' : String(screenValue)

  // Navbar → screen
  useEffect(() => {
    if (!enabled) return
    if (current !== navValue) setScreenValue(navValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navValue, enabled])

  // Screen → navbar
  return (eventOrValue) => {
    const raw = eventOrValue?.target !== undefined ? eventOrValue.target.value : eventOrValue
    const value = raw == null ? '' : String(raw)
    setScreenValue(value)
    if (enabled) {
      const next = value === '' ? null : Number(value)
      if (next !== branchId) setBranchId(next)
    }
  }
}
