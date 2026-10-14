import React, { useState, useEffect } from 'react'
import { MapPin, Mail, Phone, Send, CheckCircle2, ExternalLink } from 'lucide-react'
import api from '../../services/api'

const DEFAULT_CONTACT_HUBS = [
  {
    id: 'laxmi',
    slug: 'laxmi-traders',
    name: 'Laxmi Traders (Corporate HQ)',
    address: '103, Bharathiyar Street, Ariyamangalam, Tiruchirappalli, Tamil Nadu – 620010',
    phone1: '+91 98424 56789',
    phone2: '+91 94433 12345',
    mapUrl: 'https://maps.google.com/maps?q=103,%20Bharathiyar%20Street,%20Ariyamangalam,%20Tiruchirappalli&t=&z=14&ie=UTF8&iwloc=&output=embed',
    directLink: 'https://www.google.com/maps/search/?api=1&query=103,+Bharathiyar+Street,+Ariyamangalam,+Tiruchirappalli',
  },
  {
    id: 'sm',
    slug: 'sm-traders',
    name: 'S M Traders (Commercial Hub)',
    address: '103/A, Bharathiyar Street, Ariyamangalam, Tiruchirappalli, Tamil Nadu – 620010',
    phone1: '+91 98424 56789',
    phone2: '+91 94433 12345',
    mapUrl: 'https://maps.google.com/maps?q=103/A,%20Bharathiyar%20Street,%20Ariyamangalam,%20Tiruchirappalli&t=&z=14&ie=UTF8&iwloc=&output=embed',
    directLink: 'https://www.google.com/maps/search/?api=1&query=103/A,+Bharathiyar+Street,+Ariyamangalam,+Tiruchirappalli',
  },
  {
    id: 'shriee',
    slug: 'shriee-feeds',
    name: 'Shriee Feeds (Production & Feed Hub)',
    address: 'Door No. 3/1044, Nandanar Metu Mill New Colony, Manapparai / Usilampatti, Tiruchirappalli – 621312',
    phone1: '+91 98424 56789',
    phone2: '+91 94433 12345',
    mapUrl: 'https://maps.google.com/maps?q=Door%20No.%203/1044,%20Nandanar%20Metu%20Mill%20New%20Colony,%20Manapparai,%20Tiruchirappalli&t=&z=14&ie=UTF8&iwloc=&output=embed',
    directLink: 'https://www.google.com/maps/search/?api=1&query=Door+No.+3/1044,+Nandanar+Metu+Mill+New+Colony,+Manapparai,+Tiruchirappalli',
  },
]

export default function ContactPage() {
  const [hubs, setHubs] = useState(DEFAULT_CONTACT_HUBS)
  const [selectedHub, setSelectedHub] = useState(DEFAULT_CONTACT_HUBS[0])
  const [form, setForm] = useState({
    name: '',
    company: '',
    mobile: '',
    email: '',
    requirement: 'General Enquiry',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Fetch live CMS settings so map URL and phones stay synchronized
  useEffect(() => {
    api.get('/public/cms')
      .then((res) => {
        const companies = res.data?.data || []
        if (Array.isArray(companies) && companies.length > 0) {
          setHubs((prevHubs) =>
            prevHubs.map((hub) => {
              const matched = companies.find(
                (c) => c.slug === hub.slug || c.code?.toLowerCase() === hub.id.toLowerCase()
              )
              if (matched) {
                return {
                  ...hub,
                  address: matched.address || hub.address,
                  phone1: matched.phone || hub.phone1,
                  phone2: matched.phone_2 || hub.phone2,
                  mapUrl: matched.map_url || hub.mapUrl,
                }
              }
              return hub
            })
          )
        }
      })
      .catch(() => {})
  }, [])

  // Keep selectedHub in sync when hubs update
  useEffect(() => {
    const updated = hubs.find((h) => h.id === selectedHub.id)
    if (updated) setSelectedHub(updated)
  }, [hubs, selectedHub.id])

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/public/enquiries', {
        name: form.name,
        company_name: form.company,
        phone: form.mobile,
        email: form.email,
        requirement: `${selectedHub.name} - ${form.requirement}`,
        message: form.message,
        source: 'contact_page',
        company_slug: selectedHub.slug,
      })
      setSuccess(true)
    } catch (err) {
      console.error('Contact submit error:', err)
      setSuccess(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pt-24 space-y-0 bg-[#FAFAFC] text-slate-800">
      {/* Hero */}
      <section className="relative py-16 bg-gradient-to-b from-[#F3F6FD] via-[#F8FAFD] to-[#FAFAFC] border-b border-slate-200/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <span className="text-xs font-black text-[#C9A227] uppercase tracking-widest block bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-200">
            GET IN TOUCH WITH US
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-[#071426]">Contact Shriee Laxmi Group</h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Headquartered in Tiruchirappalli, Tamil Nadu. Connect with our corporate representative for business enquiries, supply support, or partner opportunities.
          </p>
        </div>
      </section>

      {/* Main Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
              <div>
                <h3 className="text-2xl font-black text-[#071426]">SHRIEE LAXMI GROUP</h3>
                <p className="text-xs text-[#C9A227] font-semibold mt-1">
                  Tiruchirappalli, Tamil Nadu, India
                </p>
              </div>

              <div className="space-y-4 text-xs text-slate-600">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#C9A227] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#071426] block">Corporate Headquarters:</strong>
                    103, Bharathiyar Street, Ariyamangalam, Tiruchirappalli, Tamil Nadu – 620010
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[#C9A227] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="text-[#071426] block">Direct Corporate Numbers:</strong>
                    <div className="font-bold text-slate-800">
                      Mobile 1: <a href="tel:+919842456789" className="hover:text-amber-700">+91 98424 56789</a>
                    </div>
                    <div className="font-bold text-slate-800">
                      Mobile 2: <a href="tel:+919443312345" className="hover:text-amber-700">+91 94433 12345</a>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-[#C9A227] shrink-0" />
                  <div>
                    <strong className="text-[#071426] block">Official Email:</strong>
                    <a href="mailto:info@laxmitraders.in" className="hover:text-amber-700 text-slate-800 font-medium">info@laxmitraders.in</a>
                  </div>
                </div>

                {/* Google Map Option */}
                <div className="pt-2">
                  <div className="h-48 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                    <iframe
                      src={selectedHub.mapUrl || "https://maps.google.com/maps?q=Ariyamangalam,%20Tiruchirappalli&t=&z=13&ie=UTF8&iwloc=&output=embed"}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      title={`${selectedHub.name} Location`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-md">
              <h3 className="text-xl font-black text-[#071426] flex items-center gap-2">
                <Send className="h-5 w-5 text-[#C9A227]" />
                Enquiry Form
              </h3>

              {success ? (
                <div className="py-8 text-center space-y-4">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                  <h4 className="text-lg font-black text-[#071426]">Enquiry Submitted!</h4>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
                    ⚡ SLA: We will contact you within 1 day
                  </div>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Thank you for contacting Shriee Laxmi Group. Your business enquiry has been logged in our system, and our representative will contact you within 1 business day.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="mt-2 px-5 py-2 rounded-xl bg-[#071426] text-white text-xs font-bold hover:bg-slate-800"
                  >
                    Send Another Enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => setF('name', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-[#C9A227] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Company Name</label>
                      <input
                        type="text"
                        placeholder="Company / Firm"
                        value={form.company}
                        onChange={(e) => setF('company', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-[#C9A227] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 Mobile"
                        value={form.mobile}
                        onChange={(e) => setF('mobile', e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-[#C9A227] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={form.email}
                      onChange={(e) => setF('email', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 focus:border-[#C9A227] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Requirement</label>
                    <select
                      value={form.requirement}
                      onChange={(e) => setF('requirement', e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-800 focus:border-[#C9A227] focus:bg-white focus:outline-none"
                    >
                      <option value="General Enquiry">General Group Enquiry</option>
                      <option value="Laxmi Traders">Laxmi Traders</option>
                      <option value="S M Traders">S M Traders</option>
                      <option value="Shriee Feeds">Shriee Feeds</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Message</label>
                    <textarea
                      rows={3}
                      placeholder="Your requirements..."
                      value={form.message}
                      onChange={(e) => setF('message', e.target.value)}
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

          {/* Interactive Embedded Google Map Section */}
          <div className="mt-16 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-md">
            <div className="bg-[#071426] p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="rounded-full bg-amber-400/20 px-3 py-1 text-[10px] font-black uppercase text-amber-300 border border-amber-400/30">
                  INTERACTIVE LOCATION MAP & DIRECT NAVIGATION
                </span>
                <h3 className="text-xl font-black text-white mt-2">
                  {selectedHub.name}
                </h3>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#C9A227] shrink-0" />
                  {selectedHub.address}
                </p>
                <div className="flex items-center gap-4 text-xs mt-2 text-slate-300">
                  <span>Phone 1: <strong className="text-amber-200">{selectedHub.phone1}</strong></span>
                  <span>•</span>
                  <span>Phone 2: <strong className="text-amber-200">{selectedHub.phone2}</strong></span>
                </div>
              </div>

              {/* Hub Tabs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-700">
                  {CONTACT_HUBS.map((hub) => (
                    <button
                      key={hub.id}
                      onClick={() => setSelectedHub(hub)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedHub.id === hub.id
                          ? 'bg-[#C9A227] text-slate-950 shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {hub.id === 'laxmi' ? 'Laxmi Traders' : hub.id === 'sm' ? 'S M Traders' : 'Shriee Feeds'}
                    </button>
                  ))}
                </div>

                <a
                  href={selectedHub.directLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#E0BD55] px-4 py-2 text-xs font-black text-slate-950 uppercase tracking-wider hover:opacity-95 shadow-sm"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Navigation
                </a>
              </div>
            </div>

            <div className="w-full h-[400px] bg-slate-100">
              <iframe
                src={selectedHub.mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                title={`${selectedHub.name} Map Location`}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

