import React from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Building2, ShieldCheck, Award, TrendingUp, Users, ArrowRight } from 'lucide-react'

export default function AboutPage() {
  const { onOpenEnquiry } = useOutletContext()

  return (
    <div className="pt-24 space-y-0 bg-[#FAFAFC] text-slate-800">
      {/* Hero */}
      <section className="relative py-16 bg-gradient-to-b from-[#F3F6FD] via-[#F8FAFD] to-[#FAFAFC] border-b border-slate-200/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <span className="text-xs font-black text-[#C9A227] uppercase tracking-widest block bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-200">
            ABOUT SHRIEE LAXMI GROUP
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-[#071426]">
            Building Trust. Growing Together.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Shriee Laxmi Group is a premier corporate business group headquartered in Tiruchirappalli, Tamil Nadu, operating across trading, distribution, and feed-related business segments.
          </p>
        </div>
      </section>

      {/* Story & Philosophy */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-black text-[#C9A227] uppercase tracking-widest block">
                OUR PHILOSOPHY
              </span>
              <h2 className="text-3xl font-black text-[#071426]">
                Dependable Sourcing, Customer Commitment & Sustainable Growth
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                At Shriee Laxmi Group, our business operations are anchored in transparency, operational reliability, and customer satisfaction. We connect regional producers, suppliers, and buyers with structured logistics and dependable service.
              </p>
              <div className="pt-2">
                <button
                  onClick={onOpenEnquiry}
                  className="px-6 py-3 rounded-xl bg-[#071426] text-xs font-black text-white uppercase tracking-wider hover:bg-[#C9A227] hover:text-slate-950 transition-colors shadow-md"
                >
                  Connect With Us
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-lg bg-slate-100">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1000&q=80"
                alt="Warehouse & Logistics"
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

