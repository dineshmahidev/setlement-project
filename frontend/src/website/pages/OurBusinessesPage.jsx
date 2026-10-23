import React, { useEffect, useState } from 'react'
import FlipBusinessCard from '../components/FlipBusinessCard'
import api from '../../services/api'
import { logoSrc } from '../../utils/helpers'

export default function OurBusinessesPage() {
  const [cmsLogos, setCmsLogos] = useState({})

  useEffect(() => {
    api
      .get('/public/cms')
      .then((res) => {
        const list = res.data?.data || []
        setCmsLogos(
          Object.fromEntries(
            list.map((c) => [
              (c.company_name || '').toUpperCase(),
              c.show_logo_website === false ? '' : logoSrc(c.logo_transparent_path || c.logo_path),
            ]),
          ),
        )
      })
      .catch(() => {})
  }, [])

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
            Discover the business entities forming Shriee Laxmi Group. Click or tap any card to flip between the company logo and the operations facility banner.
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LAXMI TRADERS */}
            <FlipBusinessCard
              name="LAXMI TRADERS"
              category="Trading & Distribution"
              meaning="Growth, Trade & Business"
              logo={cmsLogos['LAXMI TRADERS'] || ''}
              banner="/banners/laxmi_traders_banner.png"
              location="103, Bharathiyar Street, Ariyamangalam, Tiruchirappalli - 620010"
              gstin="33BWLKP6363A3ZN"
              godowns="2 Active Godowns (Ariyamangalam & Bazaar)"
              phone="+91 98424 56789 / 0431-2456789"
              description="Established commercial trading business based in Ariyamangalam, Tiruchirappalli, serving customers through dependable sourcing and commodity supply."
              keyProducts={['Cottonseed Oil Cake', 'Grain Trading', 'Agro Commodities']}
              link="/business/laxmi-traders"
              autoFlipDelay={700}
              autoFlipDuration={3600}
            />

            {/* S M TRADERS */}
            <FlipBusinessCard
              name="S M TRADERS"
              category="Trading & Warehousing"
              meaning="Godown, Grains & Farming"
              logo={cmsLogos['S M TRADERS'] || ''}
              banner="/banners/sm_traders_banner.png"
              location="103/A, Bharathiyar Street, Ariyamangalam, Tiruchirappalli - 620010"
              gstin="33DTNPM3407G1ZQ"
              godowns="Bulk Grain Godown Capacity"
              phone="+91 98424 67890 / 0431-2456790"
              description="Wholesale grain trading operations with spacious godowns, transparent weighing, and robust farmer-to-market trade."
              keyProducts={['Bulk Grains', 'Warehouse Storage', 'Commercial Distribution']}
              link="/business/sm-traders"
              autoFlipDelay={1400}
              autoFlipDuration={3600}
            />

            {/* SHRIEE FEEDS */}
            <FlipBusinessCard
              name="SHRIEE FEEDS"
              category="Cattle & Poultry Feeds"
              meaning="Agriculture, Cattle & Poultry"
              logo={cmsLogos['SHRIEE FEEDS'] || ''}
              banner="/banners/shree_feeds_banner.png"
              location="Door No. 3/1044, Nandanar Metu Mill New Colony, Manapparai - 621306"
              gstin="33BOZPS3759G1Z5"
              godowns="Feed Mill & Processing Godown"
              phone="+91 98424 78901 / 0431-2456791"
              description="High-protein cattle feeds and specialized poultry nutrition engineered for superior livestock health, higher yield, and farmer prosperity."
              keyProducts={['High-Protein Feed', 'Cattle Nutrition', 'Poultry Rations']}
              link="/business/shriee-feeds"
              autoFlipDelay={2100}
              autoFlipDuration={3600}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

