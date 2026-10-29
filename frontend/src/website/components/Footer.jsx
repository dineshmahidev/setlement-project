import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Mail, Phone, ArrowUpRight, ShieldCheck } from 'lucide-react'

export default function Footer({ onOpenEnquiry }) {
  return (
    <footer className="relative bg-[#000000] text-slate-300 border-t border-[#FFD000]/30 overflow-hidden">
      {/* Signature Yellow top accent glow */}
      <div className="h-1 w-full bg-[#FFD000]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 items-start">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 border border-[#FFD000]">
                <img
                  src="/logos/shree_laxmi_transparent.png"
                  alt="Shriee Laxmi Group"
                  className="h-full w-full object-contain filter drop-shadow"
                  onError={(e) => {
                    e.currentTarget.src = '/logos/shree_laxmi.png'
                  }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tight text-white leading-tight">
                  SHRIEE LAXMI GROUP
                </span>
                <span className="text-[10px] font-black text-[#FFD000] tracking-wider uppercase">
                  Agro Commodities & Feeds
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              Leading commercial commodity trading, wholesale agro distribution, and precision livestock feed formulation engineered with verified weighing and prompt settlement.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={onOpenEnquiry}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFD000] hover:bg-[#ffe14d] text-black text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#FFD000]/20 cursor-pointer"
              >
                <span>Initiate Trade</span>
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-[#FFD000] uppercase tracking-wider">
              Navigation
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Corporate Profile
                </Link>
              </li>
              <li>
                <Link to="/our-businesses" className="hover:text-white transition-colors">
                  Operating Enterprises
                </Link>
              </li>
              <li>
                <Link to="/products-services" className="hover:text-white transition-colors">
                  Commodity Catalog
                </Link>
              </li>
              <li>
                <Link to="/our-presence" className="hover:text-white transition-colors">
                  Statewide Network
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Trade Inquiries
                </Link>
              </li>
            </ul>
          </div>

          {/* Enterprises */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-[#FFD000] uppercase tracking-wider">
              Enterprises
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/business/laxmi-traders" className="text-white hover:text-[#FFD000] font-bold block transition-colors">
                  Laxmi Traders
                </Link>
                <span className="text-[10.5px] text-slate-400">Commercial Commodity Distribution</span>
              </li>
              <li>
                <Link to="/business/sm-traders" className="text-white hover:text-[#FFD000] font-bold block transition-colors">
                  S M Traders
                </Link>
                <span className="text-[10.5px] text-slate-400">Bulk Grain Trade & Logistics</span>
              </li>
              <li>
                <Link to="/business/shriee-feeds" className="text-white hover:text-[#FFD000] font-bold block transition-colors">
                  Shriee Feeds
                </Link>
                <span className="text-[10.5px] text-slate-400">Livestock & Poultry Formulations</span>
              </li>
            </ul>
          </div>

          {/* Central Desk */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-[#FFD000] uppercase tracking-wider">
              Headquarters
            </h3>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FFD000] shrink-0 mt-0.5" />
                <span className="text-slate-300 leading-relaxed">
                  103, Bharathiyar Street, Ariyamangalam, Tiruchirappalli - 620010, Tamil Nadu
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#FFD000] shrink-0" />
                <a href="tel:+919842456789" className="text-white hover:text-[#FFD000] font-bold">
                  +91 98424 56789
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#FFD000] shrink-0" />
                <a href="mailto:info@laxmitraders.in" className="text-white hover:text-[#FFD000]">
                  info@laxmitraders.in
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Shriee Laxmi Group. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/contact" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/contact" className="hover:text-white transition-colors">
              Terms of Supply
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
