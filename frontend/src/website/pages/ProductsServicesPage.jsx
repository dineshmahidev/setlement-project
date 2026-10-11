import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { Layers, Truck, Package, Users, ArrowRight } from 'lucide-react'

export default function ProductsServicesPage() {
  const { onOpenEnquiry } = useOutletContext()

  const CATEGORIES = [
    {
      title: 'Trading Products',
      subtitle: 'Managed through Laxmi Traders & S M Traders',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
      description: 'Dependable sourcing and bulk supply of commercial and agro commodities with verified parameters.',
    },
    {
      title: 'Distribution Services',
      subtitle: 'Logistics & Supply Channels',
      image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1000&q=80',
      description: 'Connecting product suppliers with regional customers across Tiruchirappalli and Tamil Nadu districts.',
    },
    {
      title: 'Feed & Related Products',
      subtitle: 'Managed through Shriee Feeds',
      image: 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=1000&q=80',
      description: 'Agricultural feed grains, raw materials, and feed products for livestock and commercial demands.',
    },
    {
      title: 'Business Supply & Bulk Trade',
      subtitle: 'Custom Business Procurement',
      image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1000&q=80',
      description: 'Tailored commercial procurement and bulk delivery arrangements for institutional trade partners.',
    },
  ]

  return (
    <div className="pt-24 space-y-0 bg-[#FAFAFC] text-slate-800">
      {/* Hero */}
      <section className="relative py-16 bg-gradient-to-b from-[#F3F6FD] via-[#F8FAFD] to-[#FAFAFC] border-b border-slate-200/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <span className="text-xs font-black text-[#C9A227] uppercase tracking-widest block bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-200">
            COMMERCIAL CAPABILITIES
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-[#071426]">Products & Services</h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Discover our product segments across trading, distribution channels, and agricultural feed supply.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {CATEGORIES.map((cat, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden shadow-sm flex flex-col justify-between hover:border-[#C9A227] hover:shadow-xl transition-all"
              >
                <div className="relative h-60 overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-black text-[#071426]">{cat.title}</h3>
                    <p className="text-xs text-[#C9A227] font-semibold mt-0.5">{cat.subtitle}</p>
                    <p className="text-xs text-slate-600 leading-relaxed mt-2">{cat.description}</p>
                  </div>
                  <button
                    onClick={onOpenEnquiry}
                    className="w-full py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-[#071426] hover:bg-[#071426] hover:text-white transition-all shadow-sm"
                  >
                    Send Product Enquiry
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

