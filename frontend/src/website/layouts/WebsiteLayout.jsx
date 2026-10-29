import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import EnquiryModal from '../components/EnquiryModal'
import { MessageSquare, ArrowUpRight } from 'lucide-react'
import { trackPageVisit } from '../../services/trafficTracker'

export default function WebsiteLayout() {
  const [enquiryOpen, setEnquiryOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    trackPageVisit(location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col bg-[#050507] text-white font-sans selection:bg-[#FFD000] selection:text-black overflow-x-hidden w-full max-w-full">
      {/* Header Navbar */}
      <Navbar onOpenEnquiry={() => setEnquiryOpen(true)} />

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet context={{ onOpenEnquiry: () => setEnquiryOpen(true) }} />
      </main>

      {/* Footer */}
      <Footer onOpenEnquiry={() => setEnquiryOpen(true)} />

      {/* Interactive Enquiry Modal */}
      <EnquiryModal isOpen={enquiryOpen} onClose={() => setEnquiryOpen(false)} />

      {/* Floating Action Button (Solid Yellow & Black) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setEnquiryOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-[#FFD000] hover:bg-[#ffe14d] text-black px-5 py-3 text-xs font-black shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer group border-2 border-black"
          title="Quick Trade Inquiry"
        >
          <span className="h-2 w-2 rounded-full bg-black animate-pulse" />
          <span className="uppercase tracking-wider text-[11px] font-black">Trade Desk</span>
          <ArrowUpRight className="h-4 w-4 stroke-[2.5] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>
    </div>
  )
}
