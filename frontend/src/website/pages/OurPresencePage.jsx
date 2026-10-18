import React, { useState, useEffect } from 'react'
import { MapPin, ExternalLink, Navigation } from 'lucide-react'
import api from '../../services/api'

const DEFAULT_LOCATIONS = [
  {
    id: 'laxmi-kng',
    slug: 'laxmi-traders-kangeyam',
    tag: 'PROCESSING PLANT',
    name: 'LAXMI TRADERS — Kangeyam',
    address: 'Kangeyam, Tiruchirappalli District, Tamil Nadu',
    gstin: '33BWLKP6363A3ZN',
    mapUrl: 'https://maps.google.com/maps?q=Kangeyam,%20Tiruchirappalli&t=&z=13&ie=UTF8&iwloc=&output=embed',
    directMapLink: 'https://www.google.com/maps/search/?api=1&query=Kangeyam,+Tiruchirappalli',
  },
  {
    id: 'laxmi',
    slug: 'laxmi-traders',
    tag: 'TRADING HUB',
    name: 'LAXMI TRADERS',
    address: '103, Bharathiyar Street, Ariyamangalam, Tiruchirappalli, Tamil Nadu – 620010',
    gstin: '33BWLKP6363A3ZN',
    mapUrl: 'https://maps.google.com/maps?q=103,%20Bharathiyar%20Street,%20Ariyamangalam,%20Tiruchirappalli&t=&z=14&ie=UTF8&iwloc=&output=embed',
    directMapLink: 'https://www.google.com/maps/search/?api=1&query=103,+Bharathiyar+Street,+Ariyamangalam,+Tiruchirappalli',
  },
  {
    id: 'sm',
    slug: 'sm-traders',
    tag: 'COMMERCIAL SUPPLY',
    name: 'S M TRADERS',
    address: '103/A, Bharathiyar Street, Ariyamangalam, Tiruchirappalli, Tamil Nadu – 620010',
    gstin: '33DTNPM3407G1ZQ',
    mapUrl: 'https://maps.google.com/maps?q=103/A,%20Bharathiyar%20Street,%20Ariyamangalam,%20Tiruchirappalli&t=&z=14&ie=UTF8&iwloc=&output=embed',
    directMapLink: 'https://www.google.com/maps/search/?api=1&query=103/A,+Bharathiyar+Street,+Ariyamangalam,+Tiruchirappalli',
  },
  {
    id: 'shriee',
    slug: 'shriee-feeds',
    tag: 'FEED OPERATIONS',
    name: 'SHRIEE FEEDS',
    address: 'Door No. 3/1044, Nandanar Metu Mill New Colony, Manapparai / Usilampatti, Tiruchirappalli – 621312',
    gstin: '33BOZPS3759G1Z5',
    mapUrl: 'https://maps.google.com/maps?q=Door%20No.%203/1044,%20Nandanar%20Metu%20Mill%20New%20Colony,%20Manapparai,%20Tiruchirappalli&t=&z=14&ie=UTF8&iwloc=&output=embed',
    directMapLink: 'https://www.google.com/maps/search/?api=1&query=Door+No.+3/1044,+Nandanar+Metu+Mill+New+Colony,+Manapparai,+Tiruchirappalli',
  },
]

export default function OurPresencePage() {
  const [locations, setLocations] = useState(DEFAULT_LOCATIONS)
  const [selectedHub, setSelectedHub] = useState(DEFAULT_LOCATIONS[0])

  useEffect(() => {
    api.get('/public/cms')
      .then((res) => {
        const companies = res.data?.data || []
        if (Array.isArray(companies) && companies.length > 0) {
          setLocations((prev) =>
            prev.map((loc) => {
              const matched = companies.find((c) => c.slug === loc.slug || c.code?.toLowerCase() === loc.id.toLowerCase())
              if (matched) {
                return {
                  ...loc,
                  address: matched.address || loc.address,
                  mapUrl: matched.map_url || loc.mapUrl,
                }
              }
              return loc
            })
          )
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const updated = locations.find((l) => l.id === selectedHub.id)
    if (updated) setSelectedHub(updated)
  }, [locations, selectedHub.id])

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
            Headquartered in Tiruchirappalli, Tamil Nadu, with dedicated hubs in Kangeyam, Ariyamangalam and Manapparai / Usilampatti.
          </p>
        </div>
      </section>

      {/* Locations Cards */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {locations.map((loc) => {
              const isSelected = selectedHub.id === loc.id
              return (
                <div
                  key={loc.id}
                  onClick={() => setSelectedHub(loc)}
                  className={`rounded-2xl border p-6 space-y-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#C9A227] bg-amber-50/50 shadow-md ring-2 ring-[#C9A227]/30'
                      : 'border-slate-200 bg-slate-50/60 shadow-sm hover:shadow-md hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#C9A227] uppercase tracking-wider block">
                      {loc.tag}
                    </span>
                    {isSelected && (
                      <span className="rounded-full bg-[#071426] px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                        Viewing Map
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-[#071426]">{loc.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {loc.address}
                  </p>
                  <div className="text-xs text-[#C9A227] font-bold">GSTIN: {loc.gstin}</div>
                  <button
                    type="button"
                    className="text-xs font-bold text-[#071426] flex items-center gap-1 hover:text-[#C9A227] transition-colors"
                  >
                    <Navigation className="h-3.5 w-3.5" /> View on Live Map ↓
                  </button>
                </div>
              )
            })}
          </div>

          {/* Interactive Embedded Google Map Section */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-md">
            <div className="bg-[#071426] p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-300">
                    LIVE EMBEDDED MAP
                  </span>
                  <h3 className="text-lg font-black text-white">{selectedHub.name}</h3>
                </div>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#C9A227]" />
                  {selectedHub.address}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={selectedHub.directMapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#E0BD55] px-4 py-2 text-xs font-black text-slate-950 uppercase tracking-wider hover:opacity-95 shadow-sm"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Navigation
                </a>
              </div>
            </div>

            <div className="w-full h-96 bg-slate-100">
              <iframe
                src={selectedHub.mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                title={`${selectedHub.name} Embedded Map`}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
