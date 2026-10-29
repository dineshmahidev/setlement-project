import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { ShieldCheck, Award, TrendingUp, Users, ArrowRight, Target, HeartHandshake, Recycle } from 'lucide-react'
import { useWebsiteCms } from '../context/WebsiteCmsContext'

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Transparency',
    description: 'Clear documentation, verified weighing, and open communication at every stage of trade.',
  },
  {
    icon: Award,
    title: 'Operational Reliability',
    description: 'Consistent service levels backed by structured logistics and disciplined processes.',
  },
  {
    icon: HeartHandshake,
    title: 'Customer Commitment',
    description: 'Prompt settlement and responsive support that keep our partners confident.',
  },
  {
    icon: Recycle,
    title: 'Sustainable Growth',
    description: 'Long-term relationships with producers, suppliers, and buyers across Tamil Nadu.',
  },
]

export default function AboutPage() {
  const { onOpenEnquiry } = useOutletContext()
  const { getCmsImage } = useWebsiteCms()

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
                src={getCmsImage(
                  'about_image',
                  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1000&q=80',
                )}
                alt="Warehouse & Logistics"
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-[#F3F6FD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#C9A227] uppercase tracking-widest block">
              WHAT WE STAND FOR
            </span>
            <h2 className="text-3xl font-black text-[#071426]">Our Core Values</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              The principles that guide every transaction, partnership, and decision across the group.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm hover:border-[#C9A227] hover:shadow-md transition-all"
              >
                <div className="h-11 w-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center group-hover:bg-[#C9A227] group-hover:border-[#C9A227] transition-colors">
                  <Icon className="w-5 h-5 text-[#C9A227] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-base font-black text-[#071426]">{title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-slate-200 bg-[#071426] p-8 space-y-4 shadow-md">
            <div className="h-11 w-11 rounded-xl bg-[#C9A227]/15 border border-[#C9A227]/40 flex items-center justify-center">
              <Target className="w-5 h-5 text-[#C9A227]" />
            </div>
            <h3 className="text-xl font-black text-white">Our Vision</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              To be Tamil Nadu's most trusted agro commodities and feed group — recognised for quality,
              fair dealing, and dependable supply at scale.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-amber-50/70 p-8 space-y-4 shadow-sm">
            <div className="h-11 w-11 rounded-xl bg-white border border-amber-300 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#C9A227]" />
            </div>
            <h3 className="text-xl font-black text-[#071426]">Our Mission</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Connect regional producers, suppliers, and buyers through structured logistics,
              transparent settlement, and service that strengthens every business relationship.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-14 bg-[#F3F6FD] border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            { icon: Users, value: '3', label: 'Operating Enterprises' },
            { icon: TrendingUp, value: '4', label: 'Business Verticals' },
            { icon: Award, value: '100%', label: 'Verified Weighing' },
            { icon: ShieldCheck, value: 'Prompt', label: 'Settlement Cycle' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="space-y-2">
              <Icon className="w-6 h-6 text-[#C9A227] mx-auto" />
              <div className="text-3xl font-black text-[#071426]">{value}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <h2 className="text-3xl font-black text-[#071426]">Want to work with us?</h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Share your requirement and our team will respond with pricing, availability, and dispatch options.
          </p>
          <button
            onClick={onOpenEnquiry}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#071426] text-xs font-black text-white uppercase tracking-wider hover:bg-[#C9A227] hover:text-slate-950 transition-colors shadow-md"
          >
            Start an Enquiry
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  )
}

