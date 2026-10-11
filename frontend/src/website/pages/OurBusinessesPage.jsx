import React from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { ArrowRight, Building2, MapPin, ShieldCheck } from 'lucide-react'

export default function OurBusinessesPage() {
  const { onOpenEnquiry } = useOutletContext()

  return (
    <div className="pt-24 space-y-0 bg-[#FAFAFC] text-slate-800">
      {/* Hero */}
      <section className="relative py-16 bg-gradient-to-b from-[#F3F6FD] via-[#F8FAFD] to-[#FAFAFC] border-b border-slate-200/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <span className="text-xs font-black text-[#C9A227] uppercase tracking-widest block bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-200">
            BUSINESS PORTFOLIO
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-[#071426]">Our Businesses</h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Discover the business entities forming Laxmi Group, serving trading, commercial distribution, and feed requirements across Tamil Nadu.
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LAXMI TRADERS */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#C9A227] transition-all p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-[#E0BD55] bg-[#071426] px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                  Trading & Distribution
                </span>
                <h2 className="text-2xl font-black text-[#071426]">LAXMI TRADERS</h2>
                <p className="text-xs text-[#C9A227] font-bold">
                  Ariyamangalam, Tiruchirappalli • GSTIN: 33BWLKP6363A3ZN
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Laxmi Traders is an established trading business based in Ariyamangalam, Tiruchirappalli, serving customers through dependable sourcing and supply.
                </p>
              </div>
              <Link
                to="/business/laxmi-traders"
                className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-[#071426] hover:bg-[#071426] hover:text-white transition-all shadow-sm"
              >
                <span>View Full Details</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* S M TRADERS */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#C9A227] transition-all p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-[#E0BD55] bg-[#071426] px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                  Trading Business
                </span>
                <h2 className="text-2xl font-black text-[#071426]">S M TRADERS</h2>
                <p className="text-xs text-[#C9A227] font-bold">
                  Ariyamangalam, Tiruchirappalli • GSTIN: 33DTNPM3407G1ZQ
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  S M Traders operates from Ariyamangalam, Tiruchirappalli, with a focus on reliable supply and professional business relationships.
                </p>
              </div>
              <Link
                to="/business/sm-traders"
                className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-[#071426] hover:bg-[#071426] hover:text-white transition-all shadow-sm"
              >
                <span>View Full Details</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* SHRIEE FEEDS */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#C9A227] transition-all p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-black text-[#E0BD55] bg-[#071426] px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                  Feed & Related Products
                </span>
                <h2 className="text-2xl font-black text-[#071426]">SHRIEE FEEDS</h2>
                <p className="text-xs text-[#C9A227] font-bold">
                  Manapparai / Usilampatti • GSTIN: 33BOZPS3759G1Z5
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Shriee Feeds is a feed-focused business serving customers through dependable product supply and long-term business relationships.
                </p>
              </div>
              <Link
                to="/business/shriee-feeds"
                className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-[#071426] hover:bg-[#071426] hover:text-white transition-all shadow-sm"
              >
                <span>View Full Details</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

