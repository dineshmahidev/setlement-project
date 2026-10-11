import React from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { MapPin, ShieldCheck, ArrowRight, UserCheck, Package, Sprout } from 'lucide-react'

export default function ShrieeFeedsPage() {
  const { onOpenEnquiry } = useOutletContext()

  return (
    <div className="pt-24 space-y-0 bg-[#FAFAFC] text-slate-800">
      {/* Hero */}
      <section className="relative py-16 bg-gradient-to-b from-[#F3F6FD] via-[#F8FAFD] to-[#FAFAFC] border-b border-slate-200/80 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-bold text-[#C9A227] uppercase tracking-wider">
            LAXMI GROUP BUSINESS VERTICAL
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-[#071426]">SHRIEE FEEDS</h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Feed-focused business serving agricultural and livestock customers through dependable product supply and long-term business partnerships.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={onOpenEnquiry}
              className="px-6 py-3 rounded-xl bg-[#071426] text-xs font-black text-white uppercase tracking-wider shadow-md hover:bg-[#C9A227] hover:text-slate-950 transition-colors"
            >
              Enquire Shriee Feeds
            </button>
            <Link
              to="/our-businesses"
              className="px-6 py-3 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:text-[#071426] shadow-sm"
            >
              All Businesses
            </Link>
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-black text-[#071426] uppercase tracking-wider">
                About Shriee Feeds
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Shriee Feeds is a feed-focused business serving customers through dependable product supply, consistent quality standards, and long-term business relationships in Manapparai and Usilampatti regions.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <Sprout className="h-6 w-6 text-[#C9A227]" />
                  <h4 className="text-xs font-black text-[#071426] uppercase tracking-wider">Feed Products</h4>
                  <p className="text-xs text-slate-500">Quality controlled feed supplies and raw materials.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <Package className="h-6 w-6 text-[#C9A227]" />
                  <h4 className="text-xs font-black text-[#071426] uppercase tracking-wider">Bulk Fulfillment</h4>
                  <p className="text-xs text-slate-500">Timely shipment for regional feed demands.</p>
                </div>
              </div>
            </div>

            {/* Address Sidebar Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-4 shadow-md">
              <h3 className="text-base font-black text-[#071426] uppercase tracking-wider border-b border-slate-200 pb-2">
                Business Information
              </h3>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <UserCheck className="h-5 w-5 text-[#C9A227] shrink-0" />
                  <div>
                    <strong className="text-[#071426] block">Proprietor:</strong>
                    <span>K. Sakthi Murugan</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200">
                  <MapPin className="h-5 w-5 text-[#C9A227] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#071426] block">Registered Address:</strong>
                    Door No. 3/1044, Nandanar Metu Mill New Colony,
                    <br />
                    Manapparai / Usilampatti,
                    <br />
                    Tiruchirappalli, Tamil Nadu – 621312
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-slate-200">
                  <ShieldCheck className="h-5 w-5 text-[#C9A227] shrink-0" />
                  <div>
                    <strong className="text-[#071426] block">GSTIN Registration:</strong>
                    <span className="text-[#C9A227] font-bold">33BOZPS3759G1Z5</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenEnquiry}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#E0BD55] text-slate-950 text-xs font-black uppercase tracking-wider shadow-sm"
              >
                Send Business Enquiry
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

