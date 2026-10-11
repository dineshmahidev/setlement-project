import React, { useState, useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Hero3DCanvas from '../components/Hero3DCanvas'
import ImageGalleryModal from '../components/ImageGalleryModal'
import {
  Building2,
  TrendingUp,
  ShieldCheck,
  Award,
  Users,
  MapPin,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Package,
  Layers,
  Truck,
  Sparkles,
  Phone,
  Mail,
  Send,
  Eye,
  Store,
  Sprout,
  HelpCircle,
  Check,
} from 'lucide-react'

function HeroSlider({ onOpenEnquiry }) {
  const [current, setCurrent] = useState(0)

  const SLIDES = [
    {
      id: 1,
      image: '/images/slide1.jpg',
      badge: 'LAXMI GROUP • AGRO COMMODITIES & FEEDS',
      title: 'KING OF AGRO COMMODITIES & CATTLE FEEDS',
      subtitle: 'Supplying Premium Cottonseed Oil Cakes, High-Protein Animal Nutrition, and Quality Grains across Tamil Nadu.',
      primaryAction: { label: 'Explore Products', link: '/products-services' },
    },
    {
      id: 2,
      image: '/images/slide2.jpg',
      badge: 'SHRIEE FEEDS & LAXMI TRADERS',
      title: 'NURTURING LIVESTOCK • EMPOWERING FARMERS',
      subtitle: 'State-of-the-Art Processing Facilities & Wholesale Depots in Tiruchirappalli and Manapparai / Usilampatti.',
      primaryAction: { label: 'Our Businesses', link: '/our-businesses' },
    },
    {
      id: 3,
      image: '/images/slide3.jpg',
      badge: 'LOGISTICS & WAREHOUSING',
      title: 'POWERFUL DISTRIBUTION & MULTI-GODOWN NETWORK',
      subtitle: 'Integrated Transport Fleet & Bulk Storage Facilities Ensuring On-Time Commodity Deliveries.',
      primaryAction: { label: 'Our Presence', link: '/our-presence' },
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [SLIDES.length])

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)
  }

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % SLIDES.length)
  }

  const activeSlide = SLIDES[current]

  return (
    <div className="pt-14 sm:pt-16 bg-[#071426] text-white">
      {/* DESKTOP FULL COVER SLIDER */}
      <div className="hidden sm:block relative w-full h-[75vh] min-h-[580px] overflow-hidden bg-slate-950">
        {SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-center"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/60" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white space-y-4 sm:space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-xs font-black uppercase tracking-widest text-amber-200">
                    {slide.badge}
                  </span>
                </div>

                <h2 className="text-4xl lg:text-6xl font-black tracking-tight leading-tight text-white drop-shadow-lg max-w-4xl mx-auto">
                  {slide.title}
                </h2>

                <p className="text-base text-slate-200 font-medium max-w-2xl mx-auto drop-shadow">
                  {slide.subtitle}
                </p>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <Link
                    to={slide.primaryAction.link}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#E0BD55] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-amber-500/20 hover:scale-105 transition-all"
                  >
                    {slide.primaryAction.label}
                  </Link>
                  <button
                    onClick={onOpenEnquiry}
                    className="px-6 py-3 rounded-xl border border-white/40 bg-white/10 backdrop-blur-md text-white font-bold text-xs uppercase tracking-wider hover:bg-white hover:text-slate-950 transition-all cursor-pointer"
                  >
                    Enquire Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Desktop Controls */}
        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-2xl bg-black/40 border border-white/20 text-white backdrop-blur-md flex items-center justify-center hover:bg-[#C9A227] hover:text-slate-950 transition-all cursor-pointer shadow-lg"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-2xl bg-black/40 border border-white/20 text-white backdrop-blur-md flex items-center justify-center hover:bg-[#C9A227] hover:text-slate-950 transition-all cursor-pointer shadow-lg"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrent(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === current ? 'w-8 bg-[#C9A227]' : 'w-2.5 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* MOBILE SCREEN: ORIGINAL ASPECT RATIO IMAGE + DOWNSIDE CONTENT STACK */}
      <div className="block sm:hidden bg-[#071426]">
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-black">
          <img
            src={activeSlide.image}
            alt={activeSlide.title}
            className="w-full h-full object-cover transition-all duration-500"
          />

          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-xl bg-black/60 text-white flex items-center justify-center border border-white/20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-xl bg-black/60 text-white flex items-center justify-center border border-white/20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrent(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === current ? 'w-5 bg-[#C9A227]' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Mobile Downside Content Section */}
        <div className="p-5 text-center space-y-3.5 bg-gradient-to-b from-[#071426] to-[#0A1D36] border-b border-slate-800">
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#E0BD55] bg-amber-500/10 border border-amber-400/30 px-3 py-0.5 rounded-full">
            {activeSlide.badge}
          </span>

          <h2 className="text-xl font-black text-white leading-snug">
            {activeSlide.title}
          </h2>

          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            {activeSlide.subtitle}
          </p>

          <div className="flex items-center justify-center gap-2 pt-1">
            <Link
              to={activeSlide.primaryAction.link}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#E0BD55] text-slate-950 font-black text-xs uppercase tracking-wider text-center"
            >
              {activeSlide.primaryAction.label}
            </Link>
            <button
              onClick={onOpenEnquiry}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-600 bg-slate-800 text-white font-bold text-xs uppercase tracking-wider text-center"
            >
              Enquire
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { onOpenEnquiry } = useOutletContext()
  const [activeGalleryImage, setActiveGalleryImage] = useState(null)
  const [selectedVertical, setSelectedVertical] = useState('laxmi-traders')

  const [contactForm, setContactForm] = useState({
    name: '',
    company: '',
    mobile: '',
    email: '',
    requirement: 'General Enquiry',
    message: '',
  })
  const [contactSuccess, setContactSuccess] = useState(false)

  const setCF = (k, v) => setContactForm((f) => ({ ...f, [k]: v }))

  const handleContactSubmit = (e) => {
    e.preventDefault()
    setContactSuccess(true)
  }

  // 8 Interactive Vertical Selector Options (Matching Reference UI style)
  const SELECTOR_OPTIONS = [
    {
      id: 'laxmi-traders',
      label: 'Laxmi Traders',
      subtitle: 'Trading & Distribution',
      icon: Building2,
      location: 'Ariyamangalam, Tiruchirappalli',
      gstin: '33BWLKP6363A3ZN',
      link: '/business/laxmi-traders',
      desc: 'Established trading & distribution entity supplying commercial commodities across Tamil Nadu.',
    },
    {
      id: 'sm-traders',
      label: 'S M Traders',
      subtitle: 'Wholesale Grains',
      icon: Store,
      location: 'Ariyamangalam, Tiruchirappalli',
      gstin: '33DTNPM3407G1ZQ',
      link: '/business/sm-traders',
      desc: 'Wholesale commercial trading specializing in grain and bulk commodity supply.',
    },
    {
      id: 'shriee-feeds',
      label: 'Shriee Feeds',
      subtitle: 'Feeds & Nutrition',
      icon: Sprout,
      location: 'Manapparai / Usilampatti',
      gstin: '33BOZPS3759G1Z5',
      link: '/business/shriee-feeds',
      desc: 'Feed processing and supply unit serving livestock and agricultural partners.',
    },
    {
      id: 'agro-supply',
      label: 'Agro Logistics',
      subtitle: 'Fleet & Transport',
      icon: Truck,
      location: 'Tamil Nadu Logistics Network',
      gstin: 'Integrated Operations',
      link: '/products-services',
      desc: 'Dedicated transport fleet ensuring timely and secure commodity deliveries.',
    },
    {
      id: 'warehousing',
      label: 'Warehousing',
      subtitle: 'Bulk Storage',
      icon: Package,
      location: 'Ariyamangalam & Manapparai',
      gstin: 'Integrated Hubs',
      link: '/our-presence',
      desc: 'Modern storage infrastructure designed for safe inventory preservation.',
    },
    {
      id: 'quality-control',
      label: 'Quality Check',
      subtitle: 'Verified Standards',
      icon: ShieldCheck,
      location: 'All Distribution Hubs',
      gstin: 'Grade Standardized',
      link: '/about',
      desc: 'Strict quality inspection parameters for all incoming and outgoing consignments.',
    },
    {
      id: 'b2b-clients',
      label: 'B2B Sales',
      subtitle: 'Institutional Trade',
      icon: Users,
      location: 'Regional Markets',
      gstin: 'B2B Supply Contract',
      link: '/contact',
      desc: 'Tailored institutional procurement contracts and bulk commercial supply.',
    },
    {
      id: 'group-enquiry',
      label: 'Group Contact',
      subtitle: 'General Inquiry',
      icon: HelpCircle,
      location: 'Tiruchirappalli HQ',
      gstin: 'Corporate Group',
      link: '/contact',
      desc: 'Direct corporate inquiries for new business partnerships and group trade.',
    },
  ]

  const activeVerticalObj = SELECTOR_OPTIONS.find((opt) => opt.id === selectedVertical) || SELECTOR_OPTIONS[0]

  // Gallery Images List
  const GALLERY_IMAGES = [
    {
      url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
      title: 'Commercial Trading Warehouse',
      category: 'Trading & Storage',
      caption: 'State-of-the-art warehouse facilities at Ariyamangalam, Tiruchirappalli.',
    },
    {
      url: 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=1200&q=80',
      title: 'Agricultural Feed Grains',
      category: 'Feed Products',
      caption: 'High-quality agricultural feed grains processed and supplied by Shriee Feeds.',
    },
    {
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      title: 'Distribution Hub Operations',
      category: 'Distribution',
      caption: 'Consolidated goods distribution serving partners across Tamil Nadu.',
    },
    {
      url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80',
      title: 'Wholesale Stock Supply',
      category: 'Trading Business',
      caption: 'Bulk trading and commercial supply operations by S M Traders.',
    },
    {
      url: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80',
      title: 'Logistics Fleet & Fleet Movement',
      category: 'Logistics',
      caption: 'Reliable transport networks ensuring on-time delivery across districts.',
    },
    {
      url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
      title: 'Corporate Strategy Meetings',
      category: 'Partnerships',
      caption: 'Professional business management and partner engagement at Laxmi Group.',
    },
    {
      url: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1200&q=80',
      title: 'Bagged Commodity Storage',
      category: 'Storage',
      caption: 'Organized product stacking and quality preservation in Ariyamangalam.',
    },
    {
      url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
      title: 'Agro Field Sourcing',
      category: 'Sourcing',
      caption: 'Direct collaboration with regional agricultural producers across Tamil Nadu.',
    },
    {
      url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
      title: 'Quality Assessment & Standards',
      category: 'Quality Control',
      caption: 'Rigorous quality parameters verified prior to customer dispatch.',
    },
    {
      url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80',
      title: 'Long-term Client Relationships',
      category: 'Corporate Values',
      caption: 'Building transparent, trustworthy relationships with clients and vendors.',
    },
    {
      url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
      title: 'Tiruchirappalli Regional Landscape',
      category: 'Location',
      caption: 'Operating from Tiruchirappalli, the central industrial heart of Tamil Nadu.',
    },
    {
      url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
      title: 'Industrial Feed Processing',
      category: 'Production',
      caption: 'Advanced feed preparation infrastructure at Manapparai / Usilampatti.',
    },
  ]

  return (
    <div className="space-y-0 bg-[#FAFAFC] text-slate-800 font-sans">
      {/* 3-SLIDE HERO CAROUSEL SLIDER */}
      <HeroSlider onOpenEnquiry={onOpenEnquiry} />

      {/* ==================================================
          SECTION 1 — HERO & INTERACTIVE CARD SELECTOR UI
          ================================================== */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-20 overflow-hidden bg-gradient-to-b from-[#F3F6FD] via-[#F8FAFD] to-[#FAFAFC]">
        {/* Soft Ambient Mesh Background Blobs (Reference UI gradient backdrop) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-tr from-indigo-200/50 via-purple-200/40 to-pink-200/50 blur-3xl rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-gradient-to-r from-blue-300/30 to-teal-200/40 blur-3xl rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-gradient-to-l from-rose-200/40 via-amber-200/30 to-purple-200/40 blur-3xl rounded-full pointer-events-none -z-10" />

        {/* 3D Canvas Light Particles */}
        <Hero3DCanvas />

        <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 my-auto">
          {/* Top Emblem Logo Icon (Exact match to top icon in screenshot) */}
          <div className="inline-flex items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-[#FF5E62] via-[#FF9966] to-[#8E2DE2] p-0.5 shadow-2xl shadow-rose-400/30 transform hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full rounded-[22px] bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center shadow-inner">
                {/* Heart / Shield Glowing Emblem Shape */}
                <svg
                  className="w-9 h-9 sm:w-11 sm:h-11 text-white drop-shadow-md"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Headline Title */}
          <div className="space-y-3 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071426] tracking-tight leading-tight">
              Which vertical fits your needs best?
            </h1>
            <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xl mx-auto">
              Select an option below to explore Laxmi Group's specialized trading, wholesale, feed, and logistics operations.
            </p>
          </div>

          {/* 8 Glassmorphic Selector Cards Grid (2 rows x 4 cols on desktop, matching reference UI) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-2">
            {SELECTOR_OPTIONS.map((opt) => {
              const IconComp = opt.icon
              const isSelected = selectedVertical === opt.id

              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedVertical(opt.id)}
                  className={`group relative p-5 sm:p-6 rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 ${
                    isSelected
                      ? 'bg-white/95 border-2 border-[#C9A227] shadow-xl ring-4 ring-[#C9A227]/20 scale-105 z-10'
                      : 'bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-slate-300 hover:bg-white/90 hover:-translate-y-0.5'
                  }`}
                >
                  {/* Selected Badge Checkmark */}
                  {isSelected && (
                    <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#C9A227] text-slate-950 flex items-center justify-center text-xs font-bold shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}

                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                      isSelected
                        ? 'bg-[#071426] text-[#E0BD55]'
                        : 'bg-slate-100 text-slate-700 group-hover:bg-[#071426] group-hover:text-[#E0BD55]'
                    }`}
                  >
                    <IconComp className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  <h3 className="text-xs sm:text-sm font-black text-[#071426] tracking-tight">{opt.label}</h3>
                  <span className="text-[11px] text-slate-500 font-medium mt-0.5 truncate max-w-full">
                    {opt.subtitle}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Active Vertical Highlights Banner */}
          <div className="max-w-3xl mx-auto p-5 sm:p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-md text-left transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#C9A227] bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                  {activeVerticalObj.subtitle}
                </span>
                <span className="text-xs text-slate-400 font-medium">• {activeVerticalObj.location}</span>
              </div>
              <h4 className="text-base font-black text-[#071426]">{activeVerticalObj.label}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{activeVerticalObj.desc}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto pt-2 sm:pt-0">
              <Link
                to={activeVerticalObj.link}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#071426] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#C9A227] hover:text-slate-950 transition-colors shadow-sm"
              >
                <span>View Details</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={onOpenEnquiry}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-xs uppercase tracking-wider text-slate-800 hover:border-[#C9A227] transition-colors"
              >
                Enquire
              </button>
            </div>
          </div>

          {/* Pagination Indicators Dot Bar (Exact match to screenshot bottom pagination `. . ➖ . .`) */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="w-6 h-2 rounded-full bg-[#071426]" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
          </div>

          {/* Large High-Impact Hero Picture Section */}
          <div className="pt-8">
            <div className="relative group rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl bg-white p-2">
              <div className="relative h-[320px] sm:h-[420px] lg:h-[480px] rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80"
                  alt="Laxmi Group Headquarters & Warehouse Operations"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071426]/90 via-[#071426]/30 to-transparent" />

                {/* Overlaid Visual Stats Badges */}
                <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-lg text-left">
                  <div>
                    <span className="text-xs font-black text-[#C9A227] uppercase tracking-widest block">
                      TAMIL NADU CORPORATE GROUP
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-[#071426]">
                      Building Trust. Growing Together.
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-lg">
                      Headquartered in Tiruchirappalli — connecting suppliers and regional markets across Tamil Nadu.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={onOpenEnquiry}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#E0BD55] text-slate-950 font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all"
                    >
                      Partner With Us
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 2 — BUSINESS GROUP INTRO
          ================================================== */}
      <section className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Picture */}
            <div className="relative group">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-xl bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80"
                  alt="Laxmi Group Business Leadership"
                  className="w-full h-[360px] sm:h-[420px] object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md">
                  <span className="text-xs font-black text-[#C9A227] uppercase tracking-wider block">
                    HEADQUARTERED IN TAMIL NADU
                  </span>
                  <p className="text-xs text-slate-700 mt-0.5">
                    Central distribution & sourcing hubs in Tiruchirappalli
                  </p>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-black text-[#C9A227] uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <Building2 className="w-4 h-4 text-[#C9A227]" />
                <span>WHO WE ARE</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-[#071426] leading-tight">
                One Group.
                <br />
                <span className="text-[#C9A227]">Multiple Business Strengths.</span>
              </h2>

              <p className="text-slate-600 text-sm leading-relaxed">
                Laxmi Group is a growing business group based in Tiruchirappalli, Tamil Nadu. Our businesses operate across trading and feed-related segments, with a common focus on dependable supply, customer relationships and sustainable growth.
              </p>

              {/* 3 Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-1 hover:border-[#C9A227] transition-colors">
                  <span className="text-xl font-black text-[#C9A227]">01</span>
                  <h4 className="text-xs font-bold text-[#071426] uppercase tracking-wider">Customer Focus</h4>
                  <p className="text-[11px] text-slate-500">Tailored supply and attentive partner service.</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-1 hover:border-[#C9A227] transition-colors">
                  <span className="text-xl font-black text-[#C9A227]">02</span>
                  <h4 className="text-xs font-bold text-[#071426] uppercase tracking-wider">Reliable Supply</h4>
                  <p className="text-[11px] text-slate-500">Consistent quality & dependable logistics.</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-1 hover:border-[#C9A227] transition-colors">
                  <span className="text-xl font-black text-[#C9A227]">03</span>
                  <h4 className="text-xs font-bold text-[#071426] uppercase tracking-wider">Long-Term Trust</h4>
                  <p className="text-[11px] text-slate-500">Enduring partnerships built over time.</p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#071426] text-white font-extrabold text-xs uppercase tracking-wider hover:bg-[#C9A227] hover:text-slate-950 transition-all shadow-md"
                >
                  <span>About Laxmi Group</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 3 — OUR BUSINESSES
          ================================================== */}
      <section className="py-20 bg-[#F3F6FD] border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#C9A227] uppercase tracking-widest block">
              OUR BUSINESS VERTICALS
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#071426]">Our Businesses</h2>
            <p className="text-sm text-slate-600">
              Different businesses. One common commitment to quality and trust.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* CARD 1: LAXMI TRADERS */}
            <div className="group relative rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-md flex flex-col hover:shadow-2xl hover:border-[#C9A227] transition-all duration-300">
              <div className="relative h-60 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80"
                  alt="Laxmi Traders Warehouse"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute top-4 left-4 rounded-full bg-[#071426] text-[#E0BD55] px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                  Trading & Distribution
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-2xl font-black text-[#071426] tracking-tight group-hover:text-[#C9A227] transition-colors">
                    LAXMI TRADERS
                  </h3>
                  <p className="text-xs text-[#C9A227] font-semibold mt-1">
                    Ariyamangalam, Tiruchirappalli • GSTIN: 33BWLKP6363A3ZN
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed mt-3">
                    Laxmi Traders is an established trading business based in Ariyamangalam, Tiruchirappalli, serving customers through dependable sourcing and supply.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Link
                    to="/business/laxmi-traders"
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-[#071426] hover:bg-[#071426] hover:text-white transition-all"
                  >
                    <span>Explore Laxmi Traders</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* CARD 2: S M TRADERS */}
            <div className="group relative rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-md flex flex-col hover:shadow-2xl hover:border-[#C9A227] transition-all duration-300">
              <div className="relative h-60 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1000&q=80"
                  alt="S M Traders Wholesale Operations"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute top-4 left-4 rounded-full bg-[#071426] text-[#E0BD55] px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                  Trading Business
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-2xl font-black text-[#071426] tracking-tight group-hover:text-[#C9A227] transition-colors">
                    S M TRADERS
                  </h3>
                  <p className="text-xs text-[#C9A227] font-semibold mt-1">
                    Ariyamangalam, Tiruchirappalli • GSTIN: 33DTNPM3407G1ZQ
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed mt-3">
                    S M Traders operates from Ariyamangalam, Tiruchirappalli, with a focus on reliable supply and professional business relationships.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Link
                    to="/business/sm-traders"
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-[#071426] hover:bg-[#071426] hover:text-white transition-all"
                  >
                    <span>Explore S M Traders</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* CARD 3: SHRIEE FEEDS */}
            <div className="group relative rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-md flex flex-col hover:shadow-2xl hover:border-[#C9A227] transition-all duration-300">
              <div className="relative h-60 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=1000&q=80"
                  alt="Shriee Feeds Agriculture"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute top-4 left-4 rounded-full bg-[#071426] text-[#E0BD55] px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                  Feed & Related Products
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-2xl font-black text-[#071426] tracking-tight group-hover:text-[#C9A227] transition-colors">
                    SHRIEE FEEDS
                  </h3>
                  <p className="text-xs text-[#C9A227] font-semibold mt-1">
                    Manapparai / Usilampatti • GSTIN: 33BOZPS3759G1Z5
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed mt-3">
                    Shriee Feeds is a feed-focused business serving customers through dependable product supply and long-term business relationships.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Link
                    to="/business/shriee-feeds"
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-[#071426] hover:bg-[#071426] hover:text-white transition-all"
                  >
                    <span>Explore Shriee Feeds</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 4 — BUSINESS CAPABILITIES
          ================================================== */}
      <section className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-black text-[#C9A227] uppercase tracking-widest block">
              CORE CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#071426]">What We Do</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 space-y-4 hover:border-[#C9A227] hover:bg-white hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-xl bg-amber-100 text-[#C9A227] flex items-center justify-center">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-black text-[#C9A227]">01</span>
                <h3 className="text-base font-black text-[#071426] uppercase tracking-wider mt-1">TRADING</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Reliable sourcing and supply through our established trading businesses.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 space-y-4 hover:border-[#C9A227] hover:bg-white hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-xl bg-amber-100 text-[#C9A227] flex items-center justify-center">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-black text-[#C9A227]">02</span>
                <h3 className="text-base font-black text-[#071426] uppercase tracking-wider mt-1">DISTRIBUTION</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connecting products with customers through dependable supply channels across districts.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 space-y-4 hover:border-[#C9A227] hover:bg-white hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-xl bg-amber-100 text-[#C9A227] flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-black text-[#C9A227]">03</span>
                <h3 className="text-base font-black text-[#071426] uppercase tracking-wider mt-1">FEED BUSINESS</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Supporting feed-related requirements through dedicated supply operations at Shriee Feeds.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 space-y-4 hover:border-[#C9A227] hover:bg-white hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-xl bg-amber-100 text-[#C9A227] flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-black text-[#C9A227]">04</span>
                <h3 className="text-base font-black text-[#071426] uppercase tracking-wider mt-1">PARTNERSHIPS</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Building strong and long-term relationships with customers, suppliers and trade partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 5 — VISUAL STATISTICS
          ================================================== */}
      <section className="relative py-16 bg-[#071426] text-white overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="p-5 rounded-2xl border border-slate-700 bg-slate-900/80 backdrop-blur-md space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-[#E0BD55]">3+</span>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Business Verticals</h4>
              <p className="text-[11px] text-slate-400">Trading, Distribution & Feed</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-700 bg-slate-900/80 backdrop-blur-md space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-[#E0BD55]">Tamil Nadu</span>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Business Presence</h4>
              <p className="text-[11px] text-slate-400">Centered in Tiruchirappalli</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-700 bg-slate-900/80 backdrop-blur-md space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-[#E0BD55]">Customer First</span>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Business Approach</h4>
              <p className="text-[11px] text-slate-400">Reliable & Timely Supply</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-700 bg-slate-900/80 backdrop-blur-md space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-[#E0BD55]">Long-Term</span>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Business Focus</h4>
              <p className="text-[11px] text-slate-400">Building Sustainable Trust</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 6 — WHY LAXMI GROUP
          ================================================== */}
      <section className="py-20 bg-white border-t border-slate-200/80 space-y-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-black text-[#C9A227] uppercase tracking-widest block">
              OUR ADVANTAGES
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#071426]">Why Partner With Us?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4 p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:shadow-md transition-all">
              <span className="text-2xl font-black text-[#C9A227]">01</span>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#071426]">RELIABILITY</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dependable supply and consistent business relationships across all operations.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:shadow-md transition-all">
              <span className="text-2xl font-black text-[#C9A227]">02</span>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#071426]">CUSTOMER FOCUS</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Understanding partner requirements and offering adaptive fulfillment.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:shadow-md transition-all">
              <span className="text-2xl font-black text-[#C9A227]">03</span>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#071426]">QUALITY COMMITMENT</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Carefully inspecting product parameters to deliver high quality.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:shadow-md transition-all">
              <span className="text-2xl font-black text-[#C9A227]">04</span>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#071426]">LONG-TERM TRUST</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Building sustainable relationships with trade partners across Tamil Nadu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 7 — OUR BUSINESS PRESENCE
          ================================================== */}
      <section className="py-20 bg-[#F3F6FD] border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#C9A227] uppercase tracking-widest block">
              REGIONAL FOOTPRINT
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#071426]">Our Presence</h2>
            <p className="text-sm text-slate-600">
              Headquartered in Tiruchirappalli, Tamil Nadu – strategically connected for regional distribution.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#C9A227] uppercase tracking-wider">
                  TRADING HUB
                </span>
                <MapPin className="h-5 w-5 text-[#C9A227]" />
              </div>
              <h3 className="text-xl font-black text-[#071426]">LAXMI TRADERS</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                103, Bharathiyar Street, Ariyamangalam, Tiruchirappalli, Tamil Nadu – 620010
              </p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-[#C9A227] font-bold">
                GSTIN: 33BWLKP6363A3ZN
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#C9A227] uppercase tracking-wider">
                  COMMERCIAL SUPPLY
                </span>
                <MapPin className="h-5 w-5 text-[#C9A227]" />
              </div>
              <h3 className="text-xl font-black text-[#071426]">S M TRADERS</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                103/A, Bharathiyar Street, Ariyamangalam, Tiruchirappalli, Tamil Nadu – 620010
              </p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-[#C9A227] font-bold">
                GSTIN: 33DTNPM3407G1ZQ
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#C9A227] uppercase tracking-wider">
                  FEED OPERATIONS
                </span>
                <MapPin className="h-5 w-5 text-[#C9A227]" />
              </div>
              <h3 className="text-xl font-black text-[#071426]">SHRIEE FEEDS</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Door No. 3/1044, Nandanar Metu Mill New Colony, Manapparai / Usilampatti, Tiruchirappalli – 621312
              </p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-[#C9A227] font-bold">
                GSTIN: 33BOZPS3759G1Z5 • Proprietor: K. Sakthi Murugan
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 8 — OUR VALUES
          ================================================== */}
      <section className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-black text-[#C9A227] uppercase tracking-widest block">
              FOUNDATIONAL PRINCIPLES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#071426]">What We Believe In</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 space-y-3">
              <ShieldCheck className="h-8 w-8 text-[#C9A227]" />
              <h3 className="text-base font-black text-[#071426] uppercase tracking-wider">TRUST</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The foundation of every relationship we build with customers and suppliers.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 space-y-3">
              <Award className="h-8 w-8 text-[#C9A227]" />
              <h3 className="text-base font-black text-[#071426] uppercase tracking-wider">INTEGRITY</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transparent, honest and responsible business practices.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 space-y-3">
              <Sparkles className="h-8 w-8 text-[#C9A227]" />
              <h3 className="text-base font-black text-[#071426] uppercase tracking-wider">QUALITY</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dependable products and attentive fulfillment.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 space-y-3">
              <TrendingUp className="h-8 w-8 text-[#C9A227]" />
              <h3 className="text-base font-black text-[#071426] uppercase tracking-wider">GROWTH</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Growing together with our partners and communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 9 — BUSINESS JOURNEY
          ================================================== */}
      <section className="py-20 bg-[#F3F6FD] border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-black text-[#C9A227] uppercase tracking-widest block">
              OUR EVOLUTION
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#071426]">Our Journey</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-sm">
              <span className="text-[11px] font-black text-[#C9A227] bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                STAGE 01
              </span>
              <h3 className="text-base font-black text-[#071426]">Foundation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Establishing trading operations in Tiruchirappalli.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-sm">
              <span className="text-[11px] font-black text-[#C9A227] bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                STAGE 02
              </span>
              <h3 className="text-base font-black text-[#071426]">Expansion</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Expanding warehousing and distribution capabilities.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-sm">
              <span className="text-[11px] font-black text-[#C9A227] bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                STAGE 03
              </span>
              <h3 className="text-base font-black text-[#071426]">Multiple Verticals</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Diversifying into Laxmi Traders, S M Traders and Shriee Feeds.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-sm">
              <span className="text-[11px] font-black text-[#C9A227] bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                STAGE 04
              </span>
              <h3 className="text-base font-black text-[#071426]">Future Growth</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strengthening digital systems and trade partnerships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 10 — IMAGE GALLERY WITH LIGHTBOX
          ================================================== */}
      <section className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#C9A227] uppercase tracking-widest block">
              VISUAL GALLERY
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#071426]">In Pictures</h2>
            <p className="text-sm text-slate-600">
              A visual view of our trading operations, warehousing, logistics and team in Tamil Nadu.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {GALLERY_IMAGES.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setActiveGalleryImage(img)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm hover:shadow-xl hover:border-[#C9A227] transition-all"
              >
                <img
                  src={img.url}
                  alt={img.title}
                  className="w-full h-44 sm:h-52 object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <span className="text-[10px] font-black text-[#E0BD55] uppercase tracking-wider">
                    {img.category}
                  </span>
                  <h4 className="text-xs font-extrabold text-white truncate">{img.title}</h4>
                </div>
              </div>
            ))}
          </div>

          <ImageGalleryModal
            isOpen={Boolean(activeGalleryImage)}
            image={activeGalleryImage}
            images={GALLERY_IMAGES}
            onClose={() => setActiveGalleryImage(null)}
            onNavigate={(img) => setActiveGalleryImage(img)}
          />
        </div>
      </section>

      {/* ==================================================
          SECTION 11 — PARTNERSHIP CTA
          ================================================== */}
      <section className="relative py-20 bg-[#071426] text-white border-t border-slate-800">
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-6">
          <span className="text-xs font-black text-[#E0BD55] uppercase tracking-widest block">
            STRATEGIC COLLABORATION
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            Looking for a Reliable Business Partner?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Whether you are looking for products, supply support or a business partnership, our team is ready to connect with you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onOpenEnquiry}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#E0BD55] text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-all"
            >
              Send an Enquiry
            </button>
            <Link
              to="/contact"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-slate-600 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:border-[#C9A227] transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* ==================================================
          SECTION 12 — CONTACT FORM & INFO
          ================================================== */}
      <section className="py-20 bg-[#FAFAFC] border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#C9A227] uppercase tracking-widest block">
              REACH OUT TO US
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#071426]">Get In Touch</h2>
            <p className="text-sm text-slate-600">
              We welcome business enquiries from customers, trade suppliers and strategic partners.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <div>
                <h3 className="text-2xl font-black text-[#071426]">LAXMI GROUP</h3>
                <p className="text-xs text-[#C9A227] font-semibold mt-0.5">
                  Tiruchirappalli, Tamil Nadu, India
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-600">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#C9A227] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#071426] block">Trading Hubs:</strong>
                    Ariyamangalam & Manapparai / Usilampatti Hubs, Tiruchirappalli, Tamil Nadu
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-[#C9A227] shrink-0" />
                  <div>
                    <strong className="text-[#071426] block">Official Group Email:</strong>
                    <span>[Official email to be provided]</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-[#C9A227] shrink-0" />
                  <div>
                    <strong className="text-[#071426] block">Official Phone Contact:</strong>
                    <span>[Official phone to be provided]</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-md">
              <h3 className="text-xl font-black text-[#071426] flex items-center gap-2">
                <Send className="h-5 w-5 text-[#C9A227]" />
                Send Business Enquiry
              </h3>

              {contactSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                  <h4 className="text-lg font-black text-[#071426]">Enquiry Received!</h4>
                  <p className="text-xs text-slate-600">
                    Thank you. Your message has been sent to Laxmi Group team. We will get back to you promptly.
                  </p>
                  <button
                    onClick={() => setContactSuccess(false)}
                    className="px-6 py-2.5 rounded-xl bg-[#071426] text-xs font-black text-white"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Full Name <span className="text-[#C9A227]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={contactForm.name}
                      onChange={(e) => setCF('name', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-[#C9A227] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Company Name</label>
                      <input
                        type="text"
                        placeholder="Company / Firm"
                        value={contactForm.company}
                        onChange={(e) => setCF('company', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-[#C9A227] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Mobile Number <span className="text-[#C9A227]">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 Phone"
                        value={contactForm.mobile}
                        onChange={(e) => setCF('mobile', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-[#C9A227] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={contactForm.email}
                      onChange={(e) => setCF('email', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-[#C9A227] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Business Requirement</label>
                    <select
                      value={contactForm.requirement}
                      onChange={(e) => setCF('requirement', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-800 focus:border-[#C9A227] focus:bg-white focus:outline-none"
                    >
                      <option value="General Enquiry">General Group Enquiry</option>
                      <option value="Laxmi Traders">Laxmi Traders (Trading)</option>
                      <option value="S M Traders">S M Traders (Commercial Supply)</option>
                      <option value="Shriee Feeds">Shriee Feeds (Feeds)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Message</label>
                    <textarea
                      rows={3}
                      placeholder="Write your requirement..."
                      value={contactForm.message}
                      onChange={(e) => setCF('message', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-[#C9A227] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#E0BD55] text-slate-950 font-black uppercase tracking-wider text-xs shadow-md hover:scale-[1.01] transition-transform"
                  >
                    Submit Enquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

