import React, { useState, useEffect } from 'react'
import {
  Users,
  Eye,
  TrendingUp,
  Clock,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Monitor,
  Tablet,
  Calendar,
  MessageSquare,
  ArrowUpRight,
  ShieldAlert,
  Send,
  X,
  Trash2,
  FileSpreadsheet
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function LeadsTraffic() {
  const { activeCompany } = useAuth()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('leads') // 'leads' | 'traffic'
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Leads state
  const [enquiries, setEnquiries] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    in_progress: 0,
    converted: 0,
    closed: 0,
    today: 0,
  })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Selected lead for detail modal
  const [selectedEnquiry, setSelectedEnquiry] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [leadNotes, setLeadNotes] = useState('')
  const [leadStatus, setLeadStatus] = useState('new')

  // Traffic state
  const [trafficData, setTrafficData] = useState({
    total_visits: 0,
    unique_visitors: 0,
    visits_today: 0,
    unique_today: 0,
    total_leads: 0,
    conversion_rate: 0,
    top_pages: [],
    device_breakdown: [],
    daily_trends: [],
    recent_visits: [],
  })

  // Fetch enquiries and stats
  const fetchEnquiries = async () => {
    try {
      const params = {}
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter
      if (search) params.search = search

      const res = await api.get('/enquiries', { params })
      if (res.data?.success) {
        setEnquiries(res.data.data || [])
        if (res.data.stats) setStats(res.data.stats)
      }
    } catch (err) {
      toast.error('Failed to load enquiries')
    }
  }

  // Fetch traffic stats
  const fetchTraffic = async () => {
    try {
      const res = await api.get('/traffic-stats')
      if (res.data?.success) {
        setTrafficData(res.data.data || {})
      }
    } catch (err) {
      toast.error('Failed to load traffic statistics')
    }
  }

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchEnquiries(), fetchTraffic()])
      setLoading(false)
    }
    loadAll()
  }, [statusFilter])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEnquiries()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchEnquiries(), fetchTraffic()])
    setRefreshing(false)
    toast.success('Leads and traffic data refreshed')
  }

  const openViewModal = (enquiry) => {
    setSelectedEnquiry(enquiry)
    setLeadStatus(enquiry.status || 'new')
    setLeadNotes(enquiry.notes || '')
    setModalOpen(true)
  }

  const handleSaveLead = async () => {
    if (!selectedEnquiry) return
    setStatusUpdating(true)
    try {
      const res = await api.patch(`/enquiries/${selectedEnquiry.id}`, {
        status: leadStatus,
        notes: leadNotes,
      })
      if (res.data?.success) {
        toast.success('Lead updated successfully')
        setEnquiries((prev) =>
          prev.map((e) => (e.id === selectedEnquiry.id ? res.data.data : e))
        )
        setSelectedEnquiry(res.data.data)
        fetchEnquiries()
      }
    } catch (err) {
      toast.error('Failed to update lead')
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleDeleteLead = async (id, e) => {
    if (e) e.stopPropagation()
    if (!window.confirm('Are you sure you want to remove this lead?')) return
    try {
      const res = await api.delete(`/enquiries/${id}`)
      if (res.data?.success) {
        toast.success('Lead deleted')
        setEnquiries((prev) => prev.filter((item) => item.id !== id))
        if (selectedEnquiry?.id === id) setModalOpen(false)
        fetchEnquiries()
      }
    } catch (err) {
      toast.error('Failed to delete lead')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-black text-amber-900">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
            New Enquiry
          </span>
        )
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 border border-blue-300 px-2.5 py-0.5 text-[11px] font-black text-blue-900">
            <Phone className="w-2.5 h-2.5 text-blue-700" />
            Contacted
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 border border-purple-300 px-2.5 py-0.5 text-[11px] font-black text-purple-900">
            <Clock className="w-2.5 h-2.5 text-purple-700" />
            In Progress
          </span>
        )
      case 'converted':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-black text-emerald-900">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
            Converted (Deal)
          </span>
        )
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
            Closed
          </span>
        )
      default:
        return (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
            {status}
          </span>
        )
    }
  }

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const d = new Date(dateString)
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-[#0B1A2D] via-[#162A45] to-[#0B1A2D] p-6 rounded-2xl text-white shadow-xl border border-amber-400/20">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Leads & Traffic Hub
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                  Live Sync
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Track website visitor traffic, manage incoming customer enquiries, and guarantee 1-day response SLA.
              </p>
            </div>
          </div>
        </div>

        {/* SLA Notice Badge & Refresh */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-400/40 rounded-xl px-3.5 py-2 text-emerald-300 text-xs font-black shadow-sm">
            <span className="text-base">⚡</span>
            <div>
              <span className="block text-[10px] text-emerald-400 uppercase tracking-wider font-extrabold">Active SLA</span>
              <span>We will contact within 1 day</span>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 px-3.5 py-2 text-xs font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Leads */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Leads</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-[#0B1A2D]">{stats.total}</div>
          <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
            <span className="text-emerald-600 font-bold">+{stats.today} today</span>
          </div>
        </div>

        {/* New Inquiries Pending */}
        <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-900 text-xs font-bold">
            <span>New (Pending)</span>
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
          </div>
          <div className="text-2xl font-black text-amber-900">{stats.new}</div>
          <div className="text-[10px] text-amber-700 font-bold">
            Needs contact within 1 day
          </div>
        </div>

        {/* Contacted */}
        <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-blue-700 text-xs font-bold">
            <span>Contacted</span>
            <Phone className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900">{stats.contacted}</div>
          <div className="text-[10px] text-slate-500 font-medium">Followed up</div>
        </div>

        {/* Converted Deals */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>Converted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900">{stats.converted}</div>
          <div className="text-[10px] text-emerald-700 font-semibold">Active deals</div>
        </div>

        {/* Total Website Traffic */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Visits</span>
            <Eye className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-[#0B1A2D]">{trafficData.total_visits}</div>
          <div className="text-[10px] text-indigo-600 font-semibold">
            +{trafficData.visits_today} today
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Unique Visitors</span>
            <Monitor className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-[#0B1A2D]">{trafficData.unique_visitors}</div>
          <div className="text-[10px] text-purple-600 font-semibold">
            {trafficData.conversion_rate}% lead rate
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black transition-all border-b-2 cursor-pointer ${
            activeTab === 'leads'
              ? 'border-[#C9A227] text-[#0B1A2D] bg-white rounded-t-xl shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-[#C9A227]" />
          <span>Website Form Inquiries & Leads</span>
          <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.2 text-[10px] font-black">
            {stats.total}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('traffic')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black transition-all border-b-2 cursor-pointer ${
            activeTab === 'traffic'
              ? 'border-[#C9A227] text-[#0B1A2D] bg-white rounded-t-xl shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Eye className="w-4 h-4 text-indigo-600" />
          <span>Website Visitors & Traffic Analytics</span>
          <span className="rounded-full bg-indigo-100 text-indigo-900 px-2 py-0.2 text-[10px] font-black">
            {trafficData.total_visits}
          </span>
        </button>
      </div>

      {/* TAB 1: LEADS CONTENT */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer name, phone, email, firm, requirement..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#C9A227] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: 'All Leads' },
                { id: 'new', label: 'New (Pending)' },
                { id: 'contacted', label: 'Contacted' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'converted', label: 'Converted' },
                { id: 'closed', label: 'Closed' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setStatusFilter(pill.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === pill.id
                      ? 'bg-[#0B1A2D] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* SLA Reminder Notice Banner */}
          <div className="flex items-center justify-between bg-amber-50/80 border border-amber-300 rounded-xl px-4 py-2.5 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>SLA Commitment:</strong> All enquiries submitted via the corporate website carry our promise: <em>"We will contact within 1 day"</em>. Please prioritize uncontacted leads promptly.
              </span>
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md">
              24-HR GOAL
            </span>
          </div>

          {/* Leads Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 space-y-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#C9A227] border-t-transparent" />
                <span className="text-xs font-bold text-slate-500">Loading website leads...</span>
              </div>
            ) : enquiries.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mx-auto">
                  <MessageSquare className="w-6 h-6 text-amber-700" />
                </div>
                <h3 className="text-sm font-black text-[#0B1A2D]">No Enquiries Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {search
                    ? 'No leads matched your search query. Try clearing the filter.'
                    : 'Customer inquiries submitted via the website contact form or quick enquiry modal will appear here.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600">
                    <tr>
                      <th className="py-3 px-4">Customer / Firm</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">Requirement / Hub</th>
                      <th className="py-3 px-4">Status & SLA</th>
                      <th className="py-3 px-4">Received At</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enquiries.map((enquiry) => (
                      <tr
                        key={enquiry.id}
                        onClick={() => openViewModal(enquiry)}
                        className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                      >
                        {/* Customer & Company */}
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-[#0B1A2D] text-xs group-hover:text-amber-800 transition-colors">
                            {enquiry.name}
                          </div>
                          {enquiry.company_name ? (
                            <div className="text-[11px] text-slate-600 flex items-center gap-1 font-medium mt-0.5">
                              <Building className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[200px]">{enquiry.company_name}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400">Individual Buyer / Partner</div>
                          )}
                        </td>

                        {/* Contact Info */}
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-1">
                            <a
                              href={`tel:${enquiry.phone}`}
                              className="font-bold text-[#0B1A2D] hover:text-amber-700 flex items-center gap-1.5"
                            >
                              <Phone className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{enquiry.phone}</span>
                            </a>
                            {enquiry.email && (
                              <a
                                href={`mailto:${enquiry.email}`}
                                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1.5 truncate max-w-[200px]"
                              >
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{enquiry.email}</span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Requirement / Business */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">
                            {enquiry.requirement || 'General Enquiry'}
                          </div>
                          {enquiry.message && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 max-w-[260px] mt-0.5">
                              "{enquiry.message}"
                            </p>
                          )}
                        </td>

                        {/* Status & SLA */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {getStatusBadge(enquiry.status)}
                            <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                              <span>⚡ Within 1 Day SLA</span>
                            </div>
                          </div>
                        </td>

                        {/* Received At */}
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          <div className="font-medium">{formatDate(enquiry.created_at)}</div>
                          <div className="text-[10px] text-slate-400 capitalize">
                            Source: {enquiry.source?.replace(/_/g, ' ') || 'Website'}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openViewModal(enquiry)}
                              className="inline-flex items-center gap-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 text-xs font-bold transition-all cursor-pointer"
                              title="View full enquiry and contact customer"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-700" />
                              <span>View Enquiry</span>
                            </button>

                            <button
                              onClick={(e) => handleDeleteLead(enquiry.id, e)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
                              title="Delete enquiry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TRAFFIC CONTENT */}
      {activeTab === 'traffic' && (
        <div className="space-y-6">
          {/* Traffic Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Real-time Counter */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Total Page Visits
                </span>
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-3xl font-black text-[#0B1A2D]">
                {trafficData.total_visits}
              </div>
              <p className="text-xs text-slate-500">
                Total page requests tracked across the Shriee Laxmi Group corporate website.
              </p>
            </div>

            {/* Unique Visitors */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Unique Human Visitors
                </span>
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-black text-[#0B1A2D]">
                {trafficData.unique_visitors}
              </div>
              <p className="text-xs text-slate-500">
                Distinct browsers & client sessions tracked on the site.
              </p>
            </div>

            {/* Conversion Rate */}
            <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50 to-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Lead Conversion Rate
                </span>
                <ArrowUpRight className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-black text-amber-950">
                {trafficData.conversion_rate}%
              </div>
              <p className="text-xs text-amber-800">
                {trafficData.total_leads} inquiries submitted out of {trafficData.unique_visitors} unique visitors.
              </p>
            </div>
          </div>

          {/* Daily Visits Trend (Past 14 Days) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-[#0B1A2D] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C9A227]" />
                  14-Day Visitor Trend
                </h3>
                <p className="text-xs text-slate-500">Daily page views and unique visitors</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                Last 14 Days
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-3">
              {(trafficData.daily_trends || []).map((day) => {
                const maxViews = Math.max(...(trafficData.daily_trends || []).map((d) => d.views), 10)
                const heightPct = Math.round((day.views / maxViews) * 100) || 8

                return (
                  <div key={day.date} className="flex flex-col items-center gap-1.5 group">
                    <div className="text-[10px] font-bold text-slate-400 group-hover:text-amber-700">
                      {day.views}
                    </div>
                    <div className="h-28 w-full bg-slate-100 rounded-lg flex items-end p-1 relative overflow-hidden">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-gradient-to-t from-[#0B1A2D] to-amber-500 rounded transition-all duration-300 group-hover:from-amber-600 group-hover:to-amber-400"
                        title={`${day.label}: ${day.views} views, ${day.unique} unique`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900">
                      {day.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 2-Column Grid: Top Pages & Devices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Visited Pages */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-[#0B1A2D] flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                Top Visited Pages
              </h3>

              <div className="divide-y divide-slate-100">
                {(trafficData.top_pages || []).length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No page visits logged yet.</p>
                ) : (
                  trafficData.top_pages.map((page, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {page.page_url === '/' ? 'Home Page (Corporate)' : page.page_url}
                        </div>
                        {page.page_title && (
                          <div className="text-[10px] text-slate-400 truncate">{page.page_title}</div>
                        )}
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-[#0B1A2D]">
                        {page.views} views
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Device & Platform Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-[#0B1A2D] flex items-center gap-2">
                <Monitor className="w-4 h-4 text-purple-600" />
                Visitor Device Breakdown
              </h3>

              <div className="grid grid-cols-3 gap-3">
                {['desktop', 'mobile', 'tablet'].map((type) => {
                  const match = (trafficData.device_breakdown || []).find(
                    (d) => d.device_type?.toLowerCase() === type
                  )
                  const count = match ? match.count : 0
                  const total = trafficData.total_visits || 1
                  const pct = Math.round((count / total) * 100)

                  const Icon = type === 'desktop' ? Monitor : type === 'mobile' ? Smartphone : Tablet

                  return (
                    <div key={type} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-center space-y-1.5">
                      <Icon className="w-5 h-5 mx-auto text-slate-600" />
                      <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                        {type}
                      </div>
                      <div className="text-lg font-black text-[#0B1A2D]">{count}</div>
                      <div className="text-[10px] font-bold text-amber-700">{pct}%</div>
                    </div>
                  )
                })}
              </div>

              {/* Real-Time Visitor Activity Stream */}
              <div className="pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Recent Visitor Stream (Live)
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {(trafficData.recent_visits || []).slice(0, 10).map((visit, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs bg-slate-50 rounded-lg p-2 border border-slate-100"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="font-bold text-slate-800 truncate">{visit.page_url}</span>
                        <span className="text-[10px] text-slate-400">({visit.device_type})</span>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {formatDate(visit.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ENQUIRY MODAL (WITH PROMINENT 1-DAY SLA NOTICE) */}
      {modalOpen && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-[#0B1A2D] via-[#162A45] to-[#0B1A2D] text-white p-5 border-b border-amber-400/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-black">
                  <MessageSquare className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    Enquiry Details #{selectedEnquiry.id}
                  </h3>
                  <p className="text-xs text-amber-300">
                    Received on {formatDate(selectedEnquiry.created_at)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* PROMINENT SLA CALLOUT BANNER */}
              <div className="rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 border-2 border-amber-400/80 p-4 text-[#0B1A2D] space-y-1 shadow-sm">
                <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-amber-950">
                  <span className="text-lg">⚡</span>
                  <span>SLA COMMITMENT: We will contact within 1 day</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  The website promised the customer: <strong>"We will contact within 1 day"</strong>. Please connect with the customer immediately via mobile or WhatsApp to provide pricing, quotes, or business details.
                </p>
              </div>

              {/* Customer Contact Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Customer & Business Profile
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Customer Name:</span>
                    <strong className="text-sm font-black text-[#0B1A2D]">{selectedEnquiry.name}</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Firm / Company Name:</span>
                    <strong className="text-xs font-bold text-slate-800">
                      {selectedEnquiry.company_name || 'Individual / Not Provided'}
                    </strong>
                  </div>

                  {/* Phone + Action Buttons */}
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mobile Phone:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <strong className="text-sm font-black text-amber-900">{selectedEnquiry.phone}</strong>
                      <a
                        href={`tel:${selectedEnquiry.phone}`}
                        className="inline-flex items-center gap-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-2 py-0.5 text-[11px] font-bold"
                      >
                        <Phone className="w-3 h-3" /> Call
                      </a>
                      <a
                        href={`https://wa.me/91${selectedEnquiry.phone.replace(/[^0-9]/g, '').slice(-10)}?text=Hello%20${encodeURIComponent(selectedEnquiry.name)},%20thank%20you%20for%20contacting%20Laxmi%20Group.%20Regarding%20your%20enquiry:`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 px-2 py-0.5 text-[11px] font-bold"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email Address:</span>
                    {selectedEnquiry.email ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-slate-800">{selectedEnquiry.email}</span>
                        <a
                          href={`mailto:${selectedEnquiry.email}?subject=Regarding%20your%20Laxmi%20Group%20Enquiry`}
                          className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 text-[11px] font-bold"
                        >
                          <Mail className="w-3 h-3" /> Mail
                        </a>
                      </div>
                    ) : (
                      <span className="text-slate-400">Not provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Requirement & Message */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Product / Business Requirement
                  </span>
                  <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold">
                    {selectedEnquiry.requirement || 'General Enquiry'}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-bold block">Message / Detailed Request:</span>
                  <p className="leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedEnquiry.message || 'No additional message text provided.'}
                  </p>
                </div>
              </div>

              {/* Follow-up & Status Update Section */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center justify-between">
                  <span>Follow-Up & CRM Action</span>
                  {selectedEnquiry.contacted_at && (
                    <span className="text-[11px] text-emerald-700 font-bold">
                      Contacted: {formatDate(selectedEnquiry.contacted_at)}
                    </span>
                  )}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lead Status
                    </label>
                    <select
                      value={leadStatus}
                      onChange={(e) => setLeadStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#C9A227] focus:outline-none"
                    >
                      <option value="new">New (Pending Contact)</option>
                      <option value="contacted">Contacted (Customer Called)</option>
                      <option value="in_progress">In Progress (Sent Quotation)</option>
                      <option value="converted">Converted (Order Placed)</option>
                      <option value="closed">Closed / Not Interested</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Internal Follow-Up Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Called customer at 2 PM, quoted 10 tons cottonseed cake @ ₹3,200/qtl..."
                      value={leadNotes}
                      onChange={(e) => setLeadNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#C9A227] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between bg-slate-50 p-4 border-t border-slate-200">
              <button
                type="button"
                onClick={(e) => handleDeleteLead(selectedEnquiry.id, e)}
                className="flex items-center gap-1.5 text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Lead</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={statusUpdating}
                  onClick={handleSaveLead}
                  className="rounded-xl bg-[#0B1A2D] hover:bg-[#162A45] text-amber-300 px-5 py-2 text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {statusUpdating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Save Follow-up</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
