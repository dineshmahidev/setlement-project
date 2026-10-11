import React from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ImageGalleryModal({ isOpen, image, images, onClose, onNavigate }) {
  if (!isOpen || !image) return null

  const currentIndex = images.findIndex((img) => img.url === image.url)

  const handlePrev = (e) => {
    e.stopPropagation()
    const prevIdx = (currentIndex - 1 + images.length) % images.length
    onNavigate(images[prevIdx])
  }

  const handleNext = (e) => {
    e.stopPropagation()
    const nextIdx = (currentIndex + 1) % images.length
    onNavigate(images[nextIdx])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark Overlay */}
      <div
        className="fixed inset-0 bg-black/95 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Lightbox Content */}
      <div className="relative z-10 max-w-5xl w-full flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 rounded-full p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-all"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="relative overflow-hidden rounded-2xl border border-[#C9A227]/40 bg-[#071426] shadow-2xl max-h-[80vh] flex items-center justify-center">
          <img
            src={image.url}
            alt={image.title || 'Laxmi Group Gallery'}
            className="max-h-[75vh] w-auto object-contain rounded-2xl"
          />

          {/* Previous Button */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-[#C9A227] hover:text-[#071426] transition-all"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white hover:bg-[#C9A227] hover:text-[#071426] transition-all"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Caption */}
        <div className="mt-4 text-center">
          <h4 className="text-base font-extrabold text-[#E0BD55] uppercase tracking-wide">
            {image.title}
          </h4>
          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">{image.caption}</p>
          <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-full">
            {image.category} • Image {currentIndex + 1} of {images.length}
          </span>
        </div>
      </div>
    </div>
  )
}
