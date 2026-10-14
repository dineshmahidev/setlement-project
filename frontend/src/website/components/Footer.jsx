import React from 'react'
import { Link } from 'react-router-dom'
import { Building2, MapPin, Mail, Phone, ArrowUpRight, ShieldCheck } from 'lucide-react'

export default function Footer({ onOpenEnquiry }) {
  return (
    <footer className="bg-[#071426] border-t border-[#C9A227]/30 text-slate-300">
      {/* Top Banner Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#0B1F3A] via-[#C9A227] to-[#0B1F3A]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Column 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logos/shree_laxmi_transparent.png"
                alt="Shriee Laxmi Group Agro Traders & Feeds"
                className="h-12 w-auto object-contain drop-shadow-md"
                onError={(e) => {
                  e.currentTarget.src = '/logos/shree_laxmi.png'
                }}
              />
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tight text-white leading-tight">
                  SHRIEE LAXMI GROUP
                </span>
                <span className="text-[10px] font-bold text-[#E0BD55] tracking-wider uppercase">
                  Agro Commodities & Feeds
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-300/80 leading-relaxed max-w-md">
              "Building Trust. Growing Together."
              <br />
              Shriee Laxmi Group is a premier business group based in Tiruchirappalli, Tamil Nadu, operating across trading, distribution, and feed-related business segments.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onOpenEnquiry}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9A227] text-xs font-black text-[#071426] uppercase tracking-wider hover:bg-[#E0BD55] transition-colors"
              >
                <span>Send Enquiry</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <Link
                to="/panel/login"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900/80 text-xs font-semibold text-slate-300 hover:text-white hover:border-[#C9A227]/40 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#C9A227]" />
                <span>Staff Portal</span>
              </Link>
            </div>
          </div>

          {/* Column 2: Company */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-[#E0BD55] uppercase tracking-widest border-b border-slate-800 pb-2">
              Company
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/about" className="hover:text-[#E0BD55] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/our-businesses" className="hover:text-[#E0BD55] transition-colors">
                  Our Businesses
                </Link>
              </li>
              <li>
                <Link to="/our-presence" className="hover:text-[#E0BD55] transition-colors">
                  Our Presence
                </Link>
              </li>
              <li>
                <Link to="/products-services" className="hover:text-[#E0BD55] transition-colors">
                  Products & Services
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#E0BD55] transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Business Verticals */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-[#E0BD55] uppercase tracking-widest border-b border-slate-800 pb-2">
              Businesses
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/business/laxmi-traders"
                  className="hover:text-[#E0BD55] transition-colors font-medium"
                >
                  Laxmi Traders
                </Link>
                <span className="block text-[10px] text-slate-400">Trading & Distribution</span>
              </li>
              <li className="pt-1">
                <Link
                  to="/business/sm-traders"
                  className="hover:text-[#E0BD55] transition-colors font-medium"
                >
                  S M Traders
                </Link>
                <span className="block text-[10px] text-slate-400">Trading Business</span>
              </li>
              <li className="pt-1">
                <Link
                  to="/business/shriee-feeds"
                  className="hover:text-[#E0BD55] transition-colors font-medium"
                >
                  Shriee Feeds
                </Link>
                <span className="block text-[10px] text-slate-400">Feed & Related Products</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Location */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-[#E0BD55] uppercase tracking-widest border-b border-slate-800 pb-2">
              Location
            </h3>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                <span>
                  <strong>SHRIEE LAXMI GROUP</strong>
                  <br />
                  Tiruchirappalli,
                  <br />
                  Tamil Nadu, India
                </span>
              </div>
              <div className="pt-2 text-[11px] text-slate-400 space-y-1">
                <p>• Ariyamangalam Hub, Tiruchirappalli - 620010</p>
                <p>• Manapparai / Usilampatti Hub - 621312</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 Shriee Laxmi Group. All Rights Reserved.</p>
          <div className="flex items-center gap-6 text-[11px]">
            <Link to="/contact" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/contact" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
            <Link to="/panel/login" className="text-[#E0BD55] hover:underline">
              Management Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
