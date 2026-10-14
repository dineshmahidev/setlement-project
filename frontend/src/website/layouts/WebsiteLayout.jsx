import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import EnquiryModal from '../components/EnquiryModal'
import { MessageSquare } from 'lucide-react'

export default function WebsiteLayout() {
  const [enquiryOpen, setEnquiryOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 font-sans selection:bg-[#C9A227] selection:text-white overflow-x-hidden w-full max-w-full">
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

      {/* Floating Quick Action Widget */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5">
        <button
          onClick={() => setEnquiryOpen(true)}
          className="flex items-center gap-2 rounded-full border-2 border-[#E0BD55] bg-gradient-to-r from-[#C9A227] to-[#B37D14] px-4 py-3 text-xs font-black text-white shadow-xl shadow-amber-950/20 hover:scale-105 active:scale-95 transition-all group"
        >
          <MessageSquare className="h-4 w-4 text-white animate-pulse" />
          <span className="hidden sm:inline font-extrabold uppercase tracking-wider">Quick Enquiry</span>
        </button>
      </div>
    </div>
  )
}
