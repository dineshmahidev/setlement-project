import React, { useState, useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { MapPin, ShieldCheck, ArrowRight, Building2, Truck, Phone, Mail, ExternalLink } from 'lucide-react'
import api from '../../services/api'

export default function SMTradersPage() {
  const { onOpenEnquiry } = useOutletContext()
  const [cms, setCms] = useState(null)

  useEffect(() => {
    api.get('/public/cms/sm-traders')
      .then((res) => {
        if (res.data?.data) setCms(res.data.data)
      })
      .catch(() => {})
  }, [])

  const phone1 = cms?.phone || '+91 98424 67890'
  const phone2 = cms?.phone_2 || '+91 94433 98765'
  const address = cms?.address || '103/A, Bharathiyar Street, Ariyamangalam'
  const city = cms?.city || 'Tiruchirappalli'
  const pincode = cms?.pincode || '620010'
  const gstin = cms?.gstin || '33DTNPM3407G1ZQ'
  const mapUrl = cms?.map_url || 'https://maps.google.com/maps?q=Ariyamangalam,%20Tiruchirappalli&t=&z=13&ie=UTF8&iwloc=&output=embed'

  const bannerImg = cms?.banner_path ? (cms.banner_path.startsWith('/') ? cms.banner_path : '/' + cms.banner_path) : '/banners/sm_traders_banner.png'
  const logoImg = cms?.logo_transparent_path ? (cms.logo_transparent_path.startsWith('/') ? cms.logo_transparent_path : '/' + cms.logo_transparent_path) : '/logos/sm_traders_transparent.png'

  return (
    <div className="pt-20 space-y-0 bg-[#FAFAFC] text-slate-800">
      {/* Hero with Banner & Logo */}
      <section className="relative min-h-[420px] py-16 sm:py-24 bg-slate-950 text-white border-b border-slate-200/80 overflow-hidden flex items-center">
        {/* Background Banner Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={bannerImg}
            alt="SM Traders Banner"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071426]/95 via-[#071426]/85 to-slate-950/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071426] via-transparent to-black/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
              <img
                src={logoImg}
                alt="SM Traders Logo"
                className="h-20 sm:h-24 w-auto object-contain drop-shadow-md"
              />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/20 backdrop-blur-md px-3.5 py-1 text-xs font-bold text-amber-300 uppercase tracking-wider">
                SHRIEE LAXMI GROUP BUSINESS VERTICAL
              </div>
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
                {cms?.company_name || 'S M TRADERS'}
              </h1>
              <p className="text-xs sm:text-sm text-amber-300/90 font-bold uppercase tracking-widest">
                Godown, Grains & Farming • Ariyamangalam, Tiruchirappalli
              </p>
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-200 max-w-2xl leading-relaxed">
            {cms?.about_us || 'Wholesale trading business operating from Ariyamangalam, Tiruchirappalli, focused on reliable product supply and professional commercial relationships.'}
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={onOpenEnquiry}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#E0BD55] text-xs font-black text-[#071426] uppercase tracking-wider shadow-lg hover:brightness-110 transition-all cursor-pointer"
            >
              Enquire S M Traders
            </button>
            <Link
              to="/our-businesses"
              className="px-6 py-3 rounded-xl border border-white/30 bg-white/10 backdrop-blur-md text-xs font-bold text-white hover:bg-white/20 shadow-sm"
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
                About S M Traders
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                S M Traders operates from Ariyamangalam, Tiruchirappalli, with a focus on reliable supply and professional business relationships across regional markets.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <Building2 className="h-6 w-6 text-[#C9A227]" />
                  <h4 className="text-xs font-black text-[#071426] uppercase tracking-wider">Commercial Supply</h4>
                  <p className="text-xs text-slate-500">Professional fulfillment for commercial requirements.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <Truck className="h-6 w-6 text-[#C9A227]" />
                  <h4 className="text-xs font-black text-[#071426] uppercase tracking-wider">Trading Logistics</h4>
                  <p className="text-xs text-slate-500">Streamlined goods movement and scheduling.</p>
                </div>
              </div>

              {/* Facility Google Map */}
              <div className="pt-4 space-y-2">
                <h4 className="text-xs font-black text-[#071426] uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#C9A227]" />
                  Facility Location & Route Map
                </h4>
                <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                  <iframe
                    src={mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    title="S M Traders Location Map"
                  />
                </div>
              </div>
            </div>

            {/* Address Sidebar Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-4 shadow-md">
              <h3 className="text-base font-black text-[#071426] uppercase tracking-wider border-b border-slate-200 pb-2">
                Business & Contact Details
              </h3>

              <div className="space-y-3.5 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-5 w-5 text-[#C9A227] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#071426] block">Registered Address:</strong>
                    {address},
                    <br />
                    {city}, Tamil Nadu – {pincode}
                  </div>
                </div>

                {/* 2 Mobile Numbers */}
                <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200">
                  <Phone className="h-5 w-5 text-[#C9A227] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="text-[#071426] block">Direct Contact Numbers:</strong>
                    <div className="text-slate-800 font-bold">
                      Mobile 1: <a href={`tel:${phone1}`} className="hover:text-amber-700">{phone1}</a>
                    </div>
                    {phone2 && (
                      <div className="text-slate-800 font-bold">
                        Mobile 2: <a href={`tel:${phone2}`} className="hover:text-amber-700">{phone2}</a>
                      </div>
                    )}
                  </div>
                </div>

                {cms?.email && (
                  <div className="flex items-center gap-2.5 pt-2 border-t border-slate-200">
                    <Mail className="h-5 w-5 text-[#C9A227] shrink-0" />
                    <div>
                      <strong className="text-[#071426] block">Email:</strong>
                      <span className="text-slate-800">{cms.email}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2.5 pt-2 border-t border-slate-200">
                  <ShieldCheck className="h-5 w-5 text-[#C9A227] shrink-0" />
                  <div>
                    <strong className="text-[#071426] block">GSTIN Registration:</strong>
                    <span className="text-[#C9A227] font-bold">{gstin}</span>
                  </div>
                </div>

                {/* Embedded Google Map */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <strong className="text-[#071426] block text-xs flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#C9A227]" />
                    Interactive Location Map:
                  </strong>
                  <div className="h-44 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                    <iframe
                      src={cms?.map_url || "https://maps.google.com/maps?q=103/A,%20Bharathiyar%20Street,%20Ariyamangalam,%20Tiruchirappalli&t=&z=14&ie=UTF8&iwloc=&output=embed"}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      title="S M Traders Location Map"
                    />
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ', Tiruchirappalli')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C9A227] hover:underline"
                  >
                    Open in Google Maps Navigation →
                  </a>
                </div>
              </div>

              <button
                onClick={onOpenEnquiry}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#E0BD55] text-slate-950 text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer hover:opacity-95"
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

