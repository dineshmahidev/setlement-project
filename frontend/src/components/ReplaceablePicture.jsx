import React, { useRef, useState } from 'react'
import {
  Upload,
  Image as ImageIcon,
  X,
  Check,
  CheckCircle2,
} from 'lucide-react'

/**
 * ReplaceablePicture
 *
 * An interactive, visual image manager that replaces plain-text URLs with:
 * - A click-to-replace / drag-and-drop picture viewport
 * - Instant FileReader base64 preview
 * - Remove picture button
 * - One-click company presets
 * - Dark background option for transparent logos & digital signatures
 */
export default function ReplaceablePicture({
  label,
  sublabel,
  value,
  onChange,
  presets = [],
  darkBg = false,
  aspectRatio = 'standard', // 'signature' | 'logo' | 'banner' | 'standard'
  badgeText = null,
  required = false,
  className = '',
}) {
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [imgError, setImgError] = useState(false)

  const isBase64 = typeof value === 'string' && value.startsWith('data:image/')
  const hasValue = Boolean(value && value.trim())

  // Normalize image source path
  const imgSrc = hasValue
    ? isBase64 || value.startsWith('http') || value.startsWith('/')
      ? value
      : `/${value}`
    : ''

  const handleFileSelect = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP, or SVG)')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setImgError(false)
      if (onChange) {
        onChange(e.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    setImgError(false)
    if (onChange) {
      onChange('')
    }
  }

  // Viewport height & container styles depending on aspect ratio
  const getFrameHeight = () => {
    switch (aspectRatio) {
      case 'banner':
        return 'h-36 sm:h-40'
      case 'signature':
        return 'h-28 sm:h-32'
      case 'logo':
        return 'h-32 sm:h-36'
      default:
        return 'h-32 sm:h-36'
    }
  }

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Header Info */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <label className="text-xs font-black uppercase tracking-wide text-[#071426] flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-[#b37d14]" />
            {label}
            {required && <span className="text-rose-500">*</span>}
          </label>
          {sublabel && <p className="text-[11px] text-slate-500 mt-0.5">{sublabel}</p>}
        </div>

        {badgeText && (
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#fbf5ea] text-[#8a5f0a] border border-[#e2d6bd] shrink-0">
            {badgeText}
          </span>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Interactive Picture Container */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`group relative ${getFrameHeight()} w-full rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex items-center justify-center select-none shadow-xs ${
          isDragging
            ? 'border-[#b37d14] bg-[#fbf5ea] ring-4 ring-[#C9A227]/20 scale-[1.01]'
            : hasValue
            ? 'border-[#e2d6bd] hover:border-[#b37d14]'
            : 'border-dashed border-[#d9c9a3] hover:border-[#b37d14] hover:bg-[#fbf5ea]/40'
        } ${
          darkBg
            ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
            : 'bg-white'
        }`}
      >
        {/* Subtle dot grid for dark backgrounds to show transparency */}
        {darkBg && (
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:10px_10px]" />
        )}

        {/* Current Image Preview */}
        {hasValue && !imgError ? (
          <div className="relative w-full h-full flex items-center justify-center p-3 z-10">
            <img
              src={imgSrc}
              alt={label}
              onError={() => setImgError(true)}
              className={`max-h-full max-w-full transition-transform duration-200 group-hover:scale-102 ${
                aspectRatio === 'banner'
                  ? 'w-full h-full object-cover rounded-lg'
                  : 'object-contain drop-shadow-sm'
              }`}
            />

            {/* Hover overlay instructing user to click & replace */}
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white p-3 z-20">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b3558] text-white border border-[#C9A227]/40 shadow-lg mb-1">
                <Upload className="w-4 h-4" />
              </div>
              <span className="text-xs font-black tracking-wide text-white">
                Click to Replace Picture
              </span>
              <span className="text-[10px] text-[#E0BD55] mt-0.5">
                or drag and drop a new picture here
              </span>
            </div>
          </div>
        ) : (
          /* Empty / Placeholder State */
          <div className="text-center p-4 z-10 space-y-1">
            <div
              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl transition ${
                darkBg
                  ? 'bg-slate-800 text-slate-300 group-hover:bg-[#C9A227] group-hover:text-slate-950'
                  : 'bg-[#fbf5ea] text-[#8a5f0a] group-hover:bg-[#0b3558] group-hover:text-white'
              }`}
            >
              <Upload className="w-5 h-5" />
            </div>
            <p className={`text-xs font-bold ${darkBg ? 'text-slate-200' : 'text-slate-700'}`}>
              Click to Choose Picture
            </p>
            <p className={`text-[10px] ${darkBg ? 'text-slate-400' : 'text-slate-500'}`}>
              Drag & drop PNG, JPG, WEBP, or SVG
            </p>
          </div>
        )}

        {/* Status Pills */}
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5">
          {isBase64 ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#0b3558] px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
              <CheckCircle2 className="w-3 h-3" /> New Picture Ready (Unsaved)
            </span>
          ) : hasValue ? (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                darkBg
                  ? 'bg-slate-800/90 text-[#E0BD55] border border-[#C9A227]/30'
                  : 'bg-[#fbf5ea] text-[#5f4a1f] border border-[#e2d6bd]'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-[#C9A227]" /> Active Picture
            </span>
          ) : null}
        </div>
      </div>

      {/* Control Buttons: Replace & Remove */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b3558] hover:bg-[#07233b] text-white border border-[#b37d14]/40 text-xs font-black shadow-xs transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            {hasValue ? 'Replace Picture' : 'Upload Picture'}
          </button>

          {hasValue && (
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#e7ddc8] bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-xs font-semibold transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>

        {/* Small source info (without exposing long ugly link unless requested) */}
        {hasValue && (
          <span className="text-[10px] font-mono text-slate-500 truncate max-w-[200px]" title={value}>
            {isBase64 ? 'Local file uploaded' : value.replace(/^\//, '')}
          </span>
        )}
      </div>

      {/* Preset Quick Selection */}
      {Array.isArray(presets) && presets.length > 0 && (
        <div className="pt-2 border-t border-[#eee5d3]">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
            Quick Company Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => {
              const isSelected = value === preset.value
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    setImgError(false)
                    if (onChange) onChange(preset.value)
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer ${
                    isSelected
                      ? 'border-[#b37d14] bg-[#fbf5ea] text-[#5f4a1f] font-black ring-1 ring-[#C9A227]/40 shadow-2xs'
                      : 'border-[#e2d6bd] bg-white text-[#0b3558] hover:bg-[#fbf5ea] hover:border-[#b37d14]/40'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-[#b37d14] shrink-0" />}
                  <span>{preset.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
