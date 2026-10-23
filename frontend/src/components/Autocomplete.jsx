import React, { useState, useEffect, useRef } from 'react'
import { Search, Check, ChevronDown, Loader2, X } from 'lucide-react'

export default function Autocomplete({
  label,
  placeholder = 'Type to search...',
  items = [],
  onSearch,
  value,
  onChange,
  onSelect,
  displayKey = 'vendor_name',
  secondaryKey = 'vendor_code',
  extraInfoKey = 'gstin',
  required = false,
  error = '',
  disabled = false,
  clearable = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [filteredItems, setFilteredItems] = useState([])
  const wrapperRef = useRef(null)

  const safeItems = Array.isArray(items) ? items : []

  // Find selected item
  const selectedItem = safeItems.find((item) => String(item.id) === String(value))

  useEffect(() => {
    if (selectedItem) {
      setSearchTerm(selectedItem[displayKey] || '')
    } else if (!value) {
      setSearchTerm('')
    }
  }, [value, selectedItem, displayKey])

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
        if (selectedItem) {
          setSearchTerm(selectedItem[displayKey] || '')
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedItem, displayKey])

  const handleInputChange = async (e) => {
    const query = e.target.value
    setSearchTerm(query)
    setIsOpen(true)

    if (onSearch) {
      setLoading(true)
      try {
        const results = await onSearch(query)
        setFilteredItems(Array.isArray(results) ? results : [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    } else {
      const filtered = safeItems.filter((item) => {
        const text = `${item[displayKey] || ''} ${item[secondaryKey] || ''} ${item[extraInfoKey] || ''}`.toLowerCase()
        return text.includes(query.toLowerCase())
      })
      setFilteredItems(filtered)
    }
  }

  const handleSelectItem = (item) => {
    onChange && onChange(item.id)
    onSelect && onSelect(item)
    setSearchTerm(item[displayKey])
    setIsOpen(false)
  }

  const displayedList = onSearch ? filteredItems : (searchTerm ? filteredItems : safeItems)

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true)
            if (!onSearch) {
              setFilteredItems(safeItems)
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-800 shadow-xs transition-colors focus:border-[#0b3558] focus:outline-none focus:ring-2 focus:ring-[#0b3558]/20 ${clearable && value ? 'pr-16' : 'pr-9'} ${
            error ? 'border-red-400 bg-red-50/20' : 'border-slate-300 hover:border-slate-400'
          } ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}`}
        />
        {clearable && value ? (
          <button
            type="button"
            aria-label="Clear selection"
            onClick={() => {
              onChange && onChange('')
              onSelect && onSelect(null)
              setSearchTerm('')
              setIsOpen(false)
            }}
            className="absolute right-8 top-1.5 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <div className="absolute right-3 top-2.5 text-slate-400 pointer-events-none">
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-[#0b3558]" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {displayedList.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-500 text-center">
              {loading ? 'Searching...' : 'No matching records found'}
            </div>
          ) : (
            displayedList.map((item) => {
              const isSelected = String(item.id) === String(value)
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`flex items-center justify-between px-3.5 py-2 text-sm cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#fbf5ea] text-[#0b3558] font-semibold border-l-2 border-[#b37d14]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate">{item[displayKey]}</span>
                      {item[secondaryKey] && (
                        <span className="inline-block rounded bg-[#0b3558]/10 px-1.5 py-0.5 text-[10px] font-mono text-[#0b3558]">
                          {item[secondaryKey]}
                        </span>
                      )}
                    </div>
                    {item[extraInfoKey] && (
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        GSTIN: {item[extraInfoKey]} {item.city ? `• ${item.city}` : ''}
                      </div>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#b37d14] shrink-0" />}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
