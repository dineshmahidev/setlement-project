import React, { useState, useEffect, useMemo } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import api from '../../services/api'
import { useWebsiteCms } from '../context/WebsiteCmsContext'
import {
  Building2,
  TrendingUp,
  ShieldCheck,
  Award,
  Users,
  MapPin,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Package,
  Layers,
  Truck,
  Phone,
  Mail,
  Send,
  Store,
  Sprout,
  ArrowUpRight,
  Check,
  Wheat,
  Quote,
  Star,
  Images,
} from 'lucide-react'

const phoneHref = (value) => `tel:${String(value || '').replace(/[^\d+]/g, '')}`

export default function HomePage() {
  const { onOpenEnquiry } = useOutletContext()
  const { companies, primaryCompany, getCmsImage } = useWebsiteCms()

  // Banner rotation (3 slides)
  const SLIDES = [
    {
      id: 1,
      image: '/banners/homepage_banner.png',
      badge: 'PREMIUM AGRO COMMODITIES & ANIMAL NUTRITION',
      title: 'Reliable Agro Commodities & Cattle Feeds for Tamil Nadu',
      subtitle:
        'Supplying unadulterated Cottonseed Oil Cakes, High-Protein Animal Nutrition, and Quality Grains across Tamil Nadu with complete trust.',
      action: { label: 'Explore Products', link: '/products-services' },
    },
    {
      id: 2,
      image: '/banners/laxmi_traders_banner.png',
      badge: 'LAXMI TRADERS • TRADING & DISTRIBUTION',
      title: 'Empowering Farmers & Trade Partners Everyday',
      subtitle:
        'Dependable bulk commodity sourcing, certified weighing, and fair commercial trade serving dealers and livestock farms statewide.',
      action: { label: 'Our Businesses', link: '/our-businesses' },
    },
    {
      id: 3,
      image: '/banners/shree_feeds_banner.png',
      badge: 'SHRIEE FEEDS • CATTLE & POULTRY NUTRITION',
      title: 'High-Protein Formulations for Superior Livestock Yield',
      subtitle:
        'Engineered animal nutrition and pure poultry feed rations designed for healthy growth, peak milk yield, and farm prosperity.',
      action: { label: 'Shriee Feeds', link: '/business/shriee-feeds' },
    },
  ]

  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [SLIDES.length])

  const testimonials = useMemo(() => {
    const collected = []
    companies.forEach((company) => {
      const list = Array.isArray(company.cms_testimonials) ? company.cms_testimonials : []
      list.forEach((item) => {
        if (item && (item.name || item.message)) collected.push(item)
      })
    })
    return collected.slice(0, 3)
  }, [companies])

  const gallery = useMemo(() => {
    const collected = []
    companies.forEach((company) => {
      for (let i = 1; i <= 4; i++) {
        const image = company[`gallery_image_${i}`]
        if (image) collected.push(image)
      }
    })
    return Array.from(new Set(collected)).slice(0, 4)
  }, [companies])

  const contactPhone = primaryCompany?.phone || '+91 98424 56789'
  const contactPhone2 = primaryCompany?.phone_2 || '+91 94433 12345'
  const contactEmail = primaryCompany?.email || 'info@laxmitraders.in'
  const contactAddress =
    primaryCompany?.address ||
    [primaryCompany?.city, primaryCompany?.district, primaryCompany?.state, primaryCompany?.pincode]
      .filter(Boolean)
      .join(', ') ||
    '103, Bharathiyar Street, Ariyamangalam, Tiruchirappalli - 620010, Tamil Nadu'

  // Services Cards (Matching the reference layout 3-card mini row)
  const SERVICES = [
    {
      title: 'Cottonseed Oil Cake',
      category: 'Animal Nutrition',
      desc: 'High protein, oil-rich organic cattle feed that enhances milk yield & fat content.',
      image:
        'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=600&q=80',
      link: '/products-services',
    },
    {
      title: 'Wholesale Grains',
      category: 'Agricultural Produce',
      desc: 'Clean, carefully graded maize, sorghum, and staple grains for feed and trade.',
      image:
        'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
      link: '/products-services',
    },
    {
      title: 'High-Protein Feeds',
      category: 'Livestock Feeds',
      desc: 'Scientifically mixed feed formulations for dairy herds, goats, and poultry.',
      image:
        'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80',
      link: '/business/shriee-feeds',
    },
  ]

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  })
  const [contactSuccess, setContactSuccess] = useState(false)
  const [contactSubmitting, setContactSubmitting] = useState(false)

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    setContactSubmitting(true)
    try {
      await api.post('/public/enquiries', {
        name: contactForm.name,
        phone: contactForm.phone,
        email: contactForm.email,
        message: contactForm.message,
        requirement: 'General Inquiry',
        source: 'home_contact_form',
      })
      setContactSuccess(true)
    } catch (err) {
      console.error(err)
      setContactSuccess(true)
    } finally {
      setContactSubmitting(false)
    }
  }

  return (
    <div className="bg-[#fdfbf7] text-[#2b2118] font-sans selection:bg-[#f48c06] selection:text-white">
      {/* ============================================================== */}
      {/* 1. HERO SECTION (Solid Forest Green Top with Asymmetric Arch)  */}
      {/* ============================================================== */}
      <section className="relative bg-[#1b4332] text-white pt-28 sm:pt-36 pb-20 sm:pb-28 overflow-hidden rounded-b-[40px] sm:rounded-b-[60px]">
        {/* Subtle decorative leaf watermarks (Clean solid aesthetic) */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-72 h-72 bg-[#f48c06]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Headline Column (7 Cols) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-emerald-200 text-xs font-bold uppercase tracking-wider border border-white/15">
                <span className="h-2 w-2 rounded-full bg-[#f48c06]" />
                <span>{SLIDES[activeSlide].badge}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white">
                {SLIDES[activeSlide].title}
              </h1>

              <p className="text-base sm:text-lg text-[#e8dfd5] font-normal leading-relaxed max-w-xl">
                {SLIDES[activeSlide].subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to={SLIDES[activeSlide].action.link}
                  className="px-7 py-3.5 rounded-full bg-[#f48c06] hover:bg-[#e85d04] text-white font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
                >
                  <span>{SLIDES[activeSlide].action.label}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={onOpenEnquiry}
                  className="px-7 py-3.5 rounded-full bg-white/10 hover:bg-white hover:text-[#1b4332] text-white border border-white/25 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Contact Desk
                </button>
              </div>

              {/* Slider Dots */}
              <div className="flex items-center gap-2 pt-4">
                {SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      idx === activeSlide ? 'w-8 bg-[#f48c06]' : 'w-2.5 bg-white/30 hover:bg-white/60'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Right Arch Image Column (5 Cols) — EXACT MATCH TO REFERENCE SCREENSHOT */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Arch-shaped high-impact farming portrait */}
                <div className="relative rounded-t-[140px] sm:rounded-t-[180px] rounded-b-[40px] overflow-hidden border-4 border-white/20 shadow-2xl bg-[#2d5a45] aspect-[4/5]">
                  <img
                    src={getCmsImage(`landing_slide_${activeSlide + 1}`, SLIDES[activeSlide].image)}
                    alt="Shriee Laxmi Agro Farming & Cattle Feeds"
                    className="w-full h-full object-cover transition-opacity duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1b4332]/80 via-transparent to-transparent" />

                  {/* Floating Trust Badge */}
                  <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/95 backdrop-blur-md text-[#2b2118] shadow-lg flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-xl bg-[#1b4332] text-white flex items-center justify-center font-black shrink-0">
                      <Sprout className="w-6 h-6 text-[#f48c06]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#f48c06] tracking-wider block">
                        ESTABLISHED & TRUSTED
                      </span>
                      <h4 className="text-sm font-extrabold text-[#1b4332]">
                        Direct Farm & Sourcing Network
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. SECTION: SERVICES CARDS (Matching Reference Center Grid)   */}
      {/* ============================================================== */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Heading */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black text-[#f48c06] uppercase tracking-wider block">
              OUR AGRO EXPERTISE
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1b4332] tracking-tight">
              Services & Commodity Portfolio
            </h2>
            <p className="text-sm text-slate-600">
              Clean sourcing, standardized processing, and dependable daily distribution for livestock and commercial agriculture.
            </p>
          </div>

          {/* Service Cards Grid (Large Feature Left, 3 Mini Cards Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Big Feature Card with Asymmetric Rounded Corners */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden border border-[#e8dfd5] shadow-lg bg-white p-3 group">
                <div className="relative h-[320px] sm:h-[380px] rounded-2xl overflow-hidden">
                  <img
                    src={getCmsImage(
                      'landing_feature_image',
                      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80',
                    )}
                    alt="Agro Fields and Direct Sourcing"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1b4332]/90 via-[#1b4332]/30 to-transparent" />

                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-[#f48c06] text-white text-[10px] font-black uppercase tracking-wider">
                      Core Sourcing
                    </span>
                    <h3 className="text-2xl font-black text-white">
                      Direct Farmer-to-Market Supply Chain
                    </h3>
                    <p className="text-xs text-[#e8dfd5] leading-relaxed">
                      Connecting regional agricultural producers directly with commercial livestock operations across Tamil Nadu.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: 3 Clean Service Cards */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-[#1b4332] tracking-wider">
                  Product Offerings
                </span>
                <h3 className="text-2xl font-black text-[#1b4332]">
                  Pure Nutrition for Healthy Herds & Higher Yield
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Every consignment undergoes strict quality checks for moisture, protein concentration, and purity before reaching your farm or retail store.
                </p>
              </div>

              {/* 3 mini cards matching the reference */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {SERVICES.map((s, idx) => (
                  <Link
                    key={idx}
                    to={s.link}
                    className="group rounded-2xl bg-white border border-[#e8dfd5] overflow-hidden p-2.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={getCmsImage(`landing_service_image_${idx + 1}`, s.image)}
                        alt={s.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#1b4332] text-white text-[9px] font-bold">
                        {s.category}
                      </span>
                    </div>

                    <div className="p-2 space-y-1">
                      <h4 className="text-xs font-black text-[#1b4332] group-hover:text-[#f48c06] transition-colors">
                        {s.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {s.desc}
                      </p>
                    </div>

                    <div className="pt-2 px-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#f48c06]">
                      <span>Learn More</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. SECTION: THREE BUSINESS VERTICALS (Solid Earthy Cards)     */}
      {/* ============================================================== */}
      <section className="py-20 bg-[#f4eee4] border-y border-[#e2d5c3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black text-[#f48c06] uppercase tracking-wider block">
              OUR THREE PILLARS
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1b4332]">
              Our Operating Businesses
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Three specialized divisions working together to deliver excellence in commodities, trading, and feed formulation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 1. Laxmi Traders */}
            <div className="rounded-3xl bg-white border border-[#e2d5c3] p-7 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-[#1b4332] text-white flex items-center justify-center font-black">
                    <Building2 className="w-6 h-6 text-[#f48c06]" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#f4eee4] text-[#1b4332] text-[10px] font-black uppercase">
                    Trading & Distribution
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-[#1b4332]">Laxmi Traders</h3>
                  <p className="text-xs font-bold text-[#f48c06] uppercase tracking-wide mt-0.5">
                    Commercial Commodity Trading
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Established commercial trading business supplying cottonseed oil cake, grains, and wholesale agricultural products across Tamil Nadu.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#f48c06] shrink-0 mt-0.5" />
                    <span>Ariyamangalam, Tiruchirappalli - 620010</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#f48c06] shrink-0" />
                    <span>GSTIN: 33BWLKP6363A3ZN</span>
                  </div>
                </div>
              </div>

              <Link
                to="/business/laxmi-traders"
                className="w-full py-3 rounded-full bg-[#1b4332] hover:bg-[#2d5a45] text-white text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#f48c06]" />
              </Link>
            </div>

            {/* 2. S M Traders */}
            <div className="rounded-3xl bg-white border border-[#e2d5c3] p-7 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-[#1b4332] text-white flex items-center justify-center font-black">
                    <Store className="w-6 h-6 text-[#f48c06]" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#f4eee4] text-[#1b4332] text-[10px] font-black uppercase">
                    Grains & Commodities
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-[#1b4332]">S M Traders</h3>
                  <p className="text-xs font-bold text-[#f48c06] uppercase tracking-wide mt-0.5">
                    Wholesale Grain Trade
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Bulk grain distribution and agricultural trading network with transparent weighing, fair farmer compensation, and timely dispatches.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#f48c06] shrink-0 mt-0.5" />
                    <span>Ariyamangalam, Tiruchirappalli - 620010</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#f48c06] shrink-0" />
                    <span>GSTIN: 33DTNPM3407G1ZQ</span>
                  </div>
                </div>
              </div>

              <Link
                to="/business/sm-traders"
                className="w-full py-3 rounded-full bg-[#1b4332] hover:bg-[#2d5a45] text-white text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#f48c06]" />
              </Link>
            </div>

            {/* 3. Shriee Feeds */}
            <div className="rounded-3xl bg-white border border-[#e2d5c3] p-7 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-[#1b4332] text-white flex items-center justify-center font-black">
                    <Sprout className="w-6 h-6 text-[#f48c06]" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#f4eee4] text-[#1b4332] text-[10px] font-black uppercase">
                    Cattle & Poultry Feeds
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-[#1b4332]">Shriee Feeds</h3>
                  <p className="text-xs font-bold text-[#f48c06] uppercase tracking-wide mt-0.5">
                    Feed Processing & Milling
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Specialized feed mill producing high-protein rations for dairy cattle, calves, and poultry flocks to maximize milk fat and livestock health.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#f48c06] shrink-0 mt-0.5" />
                    <span>Manapparai / Usilampatti - 621306</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#f48c06] shrink-0" />
                    <span>GSTIN: 33BOZPS3759G1Z5</span>
                  </div>
                </div>
              </div>

              <Link
                to="/business/shriee-feeds"
                className="w-full py-3 rounded-full bg-[#1b4332] hover:bg-[#2d5a45] text-white text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#f48c06]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. SECTION: CUSTOMER TESTIMONIALS (ONLY WHEN CMS HAS DATA)      */}
      {/* ============================================================== */}
      {testimonials.length > 0 && (
      <section className="py-20 lg:py-28 bg-[#fdfbf7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black text-[#f48c06] uppercase tracking-wider block">
              TRUSTED BY OUR PARTNERS
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1b4332] tracking-tight">
              What Farmers & Dealers Say
            </h2>
            <p className="text-sm text-slate-600">
              Long-term relationships built on consistent quality, honest weighing, and dependable supply.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="relative rounded-3xl bg-white border border-[#e8dfd5] p-7 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 rounded-2xl bg-[#1b4332] flex items-center justify-center">
                      <Quote className="w-5 h-5 text-[#f48c06]" />
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Number(testimonial.rating || 5)
                              ? 'text-[#f48c06] fill-[#f48c06]'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    “{testimonial.message}”
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-black text-[#1b4332]">
                    {testimonial.name || 'Valued Partner'}
                  </h4>
                  <p className="text-[11px] font-bold text-[#f48c06] uppercase tracking-wide mt-0.5">
                    {testimonial.role || 'Trade Partner'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ============================================================== */}
      {/* 5. SECTION: GALLERY (MAXIMUM 4 IMAGES FROM WEBSITE CMS)        */}
      {/* ============================================================== */}
      {gallery.length > 0 && (
      <section className="py-20 lg:py-28 bg-[#f4eee4] border-y border-[#e2d5c3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black text-[#f48c06] uppercase tracking-wider block">
              OUR WORK IN PICTURES
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1b4332] tracking-tight flex items-center justify-center gap-3">
              <Images className="w-8 h-8 text-[#f48c06]" />
              Gallery
            </h2>
            <p className="text-sm text-slate-600">
              A glimpse of our farms, godowns, feed mill, and dispatch operations across Tamil Nadu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {gallery.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="group relative rounded-3xl overflow-hidden border border-[#e2d5c3] bg-white shadow-sm hover:shadow-xl transition-all aspect-[4/5]"
              >
                <img
                  src={image}
                  alt={`Shriee Laxmi Group gallery ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1b4332]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ============================================================== */}
      {/* 6. SECTION: RESPONSIVE CONTACT (Matching Reference Section 3)  */}
      {/* ============================================================== */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Heading */}
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-black text-[#f48c06] uppercase tracking-wider block">
              REACH OUR DESK
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1b4332]">
              Responsive Direct Contact
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Connect directly with our central procurement and dispatch managers for bulk pricing and trade quotes.
            </p>
          </div>

          {/* Reference Layout: Left Asymmetric Pictures, Right Clean Contacts & Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left 2 Pictures (Split asymmetric like reference) */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="rounded-3xl overflow-hidden shadow-md aspect-[4/5] bg-slate-100">
                <img
                  src={getCmsImage(
                    'landing_contact_image_1',
                    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80',
                  )}
                  alt="Management team"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="rounded-3xl overflow-hidden shadow-md aspect-[4/5] bg-slate-100 translate-y-6">
                <img
                  src={getCmsImage(
                    'landing_contact_image_2',
                    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
                  )}
                  alt="Operations Hub"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right Contact Details Cards */}
            <div className="lg:col-span-6 space-y-6">
              <div className="p-6 rounded-3xl bg-white border border-[#e8dfd5] shadow-sm space-y-4">
                <h3 className="text-lg font-black text-[#1b4332]">Direct Trade Contacts</h3>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#fdfbf7] border border-[#e8dfd5]">
                    <div className="h-9 w-9 rounded-xl bg-[#1b4332] text-white flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-[#f48c06]" />
                    </div>
                    <div>
                      <strong className="block text-slate-900 font-bold">Calling & WhatsApp:</strong>
                      <a href={phoneHref(contactPhone)} className="font-bold text-[#f48c06] hover:underline">
                        {contactPhone}
                      </a>
                      {contactPhone2 ? (
                        <>
                          {' '}
                          •{' '}
                          <a href={phoneHref(contactPhone2)} className="font-bold text-[#f48c06] hover:underline">
                            {contactPhone2}
                          </a>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#fdfbf7] border border-[#e8dfd5]">
                    <div className="h-9 w-9 rounded-xl bg-[#1b4332] text-white flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-[#f48c06]" />
                    </div>
                    <div>
                      <strong className="block text-slate-900 font-bold">Official Email:</strong>
                      <a href={`mailto:${contactEmail}`} className="font-bold text-[#f48c06] hover:underline">
                        {contactEmail}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#fdfbf7] border border-[#e8dfd5]">
                    <div className="h-9 w-9 rounded-xl bg-[#1b4332] text-white flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-[#f48c06]" />
                    </div>
                    <div>
                      <strong className="block text-slate-900 font-bold">Trading Office:</strong>
                      <span>{contactAddress}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. SECTION: TESTIMONIAL / FORM WITH ARCH IMAGE (Ref Section 4) */}
      {/* ============================================================== */}
      <section className="py-20 bg-[#1b4332] text-white rounded-t-[40px] sm:rounded-t-[60px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Form & Feedback Statement (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-black text-[#f48c06] uppercase tracking-wider block">
                PARTNER WITH US
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                Send Us Your Commodity Requirement
              </h2>

              <p className="text-xs sm:text-sm text-[#e8dfd5] leading-relaxed max-w-lg">
                Whether you need bulk cottonseed oil cake or custom cattle rations, submit your enquiry below. Our trade desk guarantees a direct response.
              </p>

              {contactSuccess ? (
                <div className="p-6 rounded-2xl bg-white/10 border border-white/20 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-[#f48c06] mx-auto" />
                  <h4 className="text-base font-bold text-white">Enquiry Received Successfully!</h4>
                  <p className="text-xs text-[#e8dfd5]">
                    Thank you. Our executive team will review your requirement and call you back shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3 max-w-lg">
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-full bg-white/10 border border-white/20 text-white placeholder-emerald-200/60 text-xs focus:bg-white focus:text-[#1b4332] focus:outline-none transition-colors"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="tel"
                      required
                      placeholder="+91 Mobile Number"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full px-5 py-3.5 rounded-full bg-white/10 border border-white/20 text-white placeholder-emerald-200/60 text-xs focus:bg-white focus:text-[#1b4332] focus:outline-none transition-colors"
                    />

                    <input
                      type="email"
                      placeholder="Email Address"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-5 py-3.5 rounded-full bg-white/10 border border-white/20 text-white placeholder-emerald-200/60 text-xs focus:bg-white focus:text-[#1b4332] focus:outline-none transition-colors"
                    />
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Describe your requirement (e.g. 10 MT Cottonseed Cake)..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full px-5 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-emerald-200/60 text-xs focus:bg-white focus:text-[#1b4332] focus:outline-none transition-colors"
                  />

                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="px-8 py-3.5 rounded-full bg-[#f48c06] hover:bg-[#e85d04] text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                  >
                    {contactSubmitting ? 'Sending...' : 'Submit Inquiry'}
                  </button>
                </form>
              )}
            </div>

            {/* Right Column: Arch-Cut Agro Picture (5 Cols) — Matching Reference Bottom */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-sm lg:max-w-none">
                <div className="rounded-t-[140px] rounded-b-[40px] overflow-hidden border-4 border-white/20 shadow-2xl aspect-[4/5] bg-[#2d5a45]">
                  <img
                    src={getCmsImage(
                      'landing_form_image',
                      'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=800&q=80',
                    )}
                    alt="Agro Produce"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
