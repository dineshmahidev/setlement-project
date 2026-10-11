import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { MapPin, ShieldCheck, Building2 } from 'lucide-react'

export default function OurPresencePage() {
  const { onOpenEnquiry } = useOutletContext()

  return (
    <div className="pt-24 space-y-0 bg-[#FAFAFC] text-slate-800">
      {/* Hero */}
      <section className="relative py-16 bg-gradient-to-b from-[#F3F6FD] via-[#F8FAFD] to-[#FAFAFC] border-b border-slate-200/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <span className="text-xs font-black text-[#C9A227] uppercase tracking-widest block bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-200">
            LOCATION & HUB FOOTPRINT
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-[#071426]">Our Presence</h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Headquartered in Tiruchirappalli, Tamil Nadu, with dedicated trading hubs in Ariyamangalam and Manapparai / Usilampatti.
          </p>
        </div>
      </section>

      {/* Locations */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LAXMI TRADERS */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
              <span className="text-xs font-black text-[#C9A227] uppercase tracking-wider block">
                TRADING HUB
              </span>
              <h3 className="text-2xl font-black text-[#071426]">LAXMI TRADERS</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                103, Bharathiyar Street, Ariyamangalam, Tiruchirappalli, Tamil Nadu – 620010
              </p>
              <div className="text-xs text-[#C9A227] font-bold">GSTIN: 33BWLKP6363A3ZN</div>
            </div>

            {/* S M TRADERS */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
              <span className="text-xs font-black text-[#C9A227] uppercase tracking-wider block">
                COMMERCIAL SUPPLY
              </span>
              <h3 className="text-2xl font-black text-[#071426]">S M TRADERS</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                103/A, Bharathiyar Street, Ariyamangalam, Tiruchirappalli, Tamil Nadu – 620010
              </p>
              <div className="text-xs text-[#C9A227] font-bold">GSTIN: 33DTNPM3407G1ZQ</div>
            </div>

            {/* SHRIEE FEEDS */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
              <span className="text-xs font-black text-[#C9A227] uppercase tracking-wider block">
                FEED OPERATIONS
              </span>
              <h3 className="text-2xl font-black text-[#071426]">SHRIEE FEEDS</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Door No. 3/1044, Nandanar Metu Mill New Colony, Manapparai / Usilampatti, Tiruchirappalli – 621312
              </p>
              <div className="text-xs text-[#C9A227] font-bold">
                GSTIN: 33BOZPS3759G1Z5 • Proprietor: K. Sakthi Murugan
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

