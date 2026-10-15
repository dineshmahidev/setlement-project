import React from 'react'
import { Printer, Download, X } from 'lucide-react'
import { openPdf, downloadPdf } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/helpers'

export default function SettlementBillModal({ settlement, isOpen, onClose }) {
  const { activeCompany } = useAuth()

  React.useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !settlement) return null

  const co = settlement.branch?.company || activeCompany || {}
  const coName = co.company_name || 'LAXMI TRADERS'
  const coMonogram = co.settlement_prefix || (co.short_name || coName || 'LT').slice(0, 2).toUpperCase()
  const coLogo = co.logo_transparent_path || co.logo_path
  const coTagline = co.tagline || 'AGRO PRODUCTS & GRAINS'
  const coSubTagline = co.sub_tagline || 'Quality Grains | Trusted Trade | Sustainable Tomorrow'
  const coGstin = co.gstin || '-'
  const coState = co.state || 'Tamil Nadu'
  const coStateCode = co.state_code || '33'
  const coAddrLine1 = [co.address, co.city].filter(Boolean).join(', ')
  const coAddrLine2 = [co.state, co.pincode].filter(Boolean).join(', ')

  const handlePrint = async () => {
    try {
      if (settlement.id && Number(settlement.id) > 0) {
        await openPdf(`/settlements/${settlement.id}/pdf`, `${settlement.settlement_number || 'settlement'}.pdf`)
      } else {
        window.print()
      }
    } catch (err) {
      console.error(err)
      window.print()
    }
  }

  const handleDownload = async () => {
    try {
      if (settlement.id && Number(settlement.id) > 0) {
        await downloadPdf(`/settlements/${settlement.id}/pdf`, `${settlement.settlement_number || 'settlement'}.pdf`)
      } else {
        window.print()
      }
    } catch (err) {
      console.error(err)
      window.print()
    }
  }

  // Calculate debit/credit note values
  const existingNote = settlement.debit_notes?.[0]
  const origInv = parseFloat(settlement.original_invoice_value) || 0
  const branVal = parseFloat(settlement.bran_value) || 0
  const manualAdj = parseFloat(settlement.manual_adjustment) || 0

  let noteType = settlement.note_type
  if (origInv > 0) {
    const diff = (origInv - branVal) + manualAdj
    noteType = diff < -0.001 ? 'credit' : 'debit'
  } else if (manualAdj !== 0) {
    noteType = manualAdj < -0.001 ? 'credit' : 'debit'
  } else if (!noteType) {
    const rawType = existingNote?.transaction_type ? String(existingNote.transaction_type).toLowerCase() : ''
    noteType = (rawType === 'credit' || rawType === 'cn') ? 'credit' : 'debit'
  }

  const isCredit = noteType === 'credit'
  const noteLabel = isCredit ? 'CREDIT NOTE' : 'DEBIT NOTE'
  const noteDocLabel = isCredit ? 'CreditNote No:' : 'DebitNote No:'

  const calculatedDiff = origInv > 0 ? Math.abs((origInv - branVal) + manualAdj) : Math.abs(manualAdj)
  const rebateAmount = parseFloat(settlement.rebate_amount) > 0
    ? parseFloat(settlement.rebate_amount)
    : (parseFloat(settlement.note_amount) > 0 ? parseFloat(settlement.note_amount) : (calculatedDiff > 0 ? calculatedDiff : 0))

  const invoiceValue = parseFloat(settlement.original_invoice_value) > 0
    ? parseFloat(settlement.original_invoice_value)
    : (isCredit
        ? Math.max(0, (parseFloat(settlement.bran_value) || 0) - rebateAmount)
        : (parseFloat(settlement.bran_value) || 0) + rebateAmount)

  const isInterstate = Boolean(settlement.is_interstate)
  const cgstRate = parseFloat(settlement.cgst_rate) || 2.5
  const sgstRate = parseFloat(settlement.sgst_rate) || 2.5
  const igstRate = isInterstate ? (parseFloat(settlement.igst_rate) || 5.0) : 0

  const rebateCgst = isInterstate ? 0 : Number(((rebateAmount * cgstRate) / 100).toFixed(2))
  const rebateSgst = isInterstate ? 0 : Number(((rebateAmount * sgstRate) / 100).toFixed(2))
  const rebateIgst = isInterstate ? Number(((rebateAmount * igstRate) / 100).toFixed(2)) : 0
  const rebateTotal = Number((rebateAmount + rebateCgst + rebateSgst + rebateIgst).toFixed(2))

  const invCgst = isInterstate ? 0 : Number(((invoiceValue * cgstRate) / 100).toFixed(2))
  const invSgst = isInterstate ? 0 : Number(((invoiceValue * sgstRate) / 100).toFixed(2))
  const invIgst = isInterstate ? Number(((invoiceValue * igstRate) / 100).toFixed(2)) : 0
  const invTotal = Number((invoiceValue + invCgst + invSgst + invIgst).toFixed(2))

  let dnNumber = existingNote?.debit_note_number
  if (isCredit && dnNumber && dnNumber.startsWith('DN/')) {
    dnNumber = 'CN/' + dnNumber.slice(3)
  } else if (!isCredit && dnNumber && dnNumber.startsWith('CN/')) {
    dnNumber = 'DN/' + dnNumber.slice(3)
  }
  if (!dnNumber) {
    const rawNum = String(settlement.settlement_number || '0001').replace(/^SB\//, '')
    dnNumber = `${isCredit ? 'CN' : 'DN'}/${rawNum}`
  }

  const billNo = settlement.bill_number || settlement.invoice?.invoice_number || '68'
  const billDate = settlement.bill_date || settlement.invoice?.invoice_date || settlement.settlement_date

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.()
        }
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]"
      >
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0b3558] text-white">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-sm font-bold tracking-wide">
              Settlement Bill & {noteLabel} (Detailed Document Preview)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print PDF
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg bg-[#b37d14] hover:bg-[#96670e] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 ml-2 text-lg font-bold cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Container */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-[#f4f6f9] flex flex-col items-center">
          
          {/* Document Canvas matching Inward border box and PDF layout */}
          <div className="w-full max-w-3xl bg-white rounded-lg shadow-md border-2 border-[#0b3558] p-5 sm:p-6 text-[10.5px] text-slate-900 font-sans select-text space-y-3">
            
            {/* Top Company Header */}
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                {coLogo ? (
                  <img
                    src={coLogo.startsWith('/') ? coLogo : `/${coLogo}`}
                    alt={coName}
                    className="h-11 w-auto max-w-[60px] object-contain drop-shadow-xs"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#fdfbf7] border border-[#b37d14] flex items-center justify-center font-black text-[#0b3558] text-base">
                    {coMonogram}
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-black tracking-wider text-[#0b3558] uppercase leading-none">
                    {coName}
                  </h1>
                  <div className="text-[9px] font-bold text-[#b37d14] tracking-wider uppercase mt-0.5">
                    {coTagline}
                  </div>
                  <div className="text-[8.5px] text-slate-500 italic">
                    {coSubTagline}
                  </div>
                </div>
              </div>

              <div className="text-right text-[8.5px] text-slate-700 leading-tight">
                <div>{coAddrLine1}</div>
                <div>{coAddrLine2}</div>
                <div className="font-semibold text-slate-900">
                  <strong>GSTIN :</strong> <span className="font-mono font-bold">{coGstin}</span>
                </div>
                <div><strong>State :</strong> {coState} &nbsp;|&nbsp; <strong>State Code :</strong> {coStateCode}</div>
                <div><strong>Phone :</strong> {co.phone || '-'} {co.phone_2 ? ` / ${co.phone_2}` : ''} {co.email ? ` | Email : ${co.email}` : ''}</div>
              </div>
            </div>

            {/* Header Divider Line */}
            <div className="h-0.5 bg-[#0b3558]"></div>

            {/* SECTION 1: SETTLEMENT BILL */}
            <div className="bg-[#0b3558] text-white text-center font-bold text-xs tracking-widest py-1 uppercase rounded-xs">
              <span className="inline-block w-5 h-px bg-[#d69e2e] align-middle mr-2"></span>
              SETTLEMENT BILL
              <span className="inline-block w-5 h-px bg-[#d69e2e] align-middle ml-2"></span>
            </div>

            {/* Vendor Details & Bill Header Grid */}
            <div className="grid grid-cols-2 border border-slate-300 bg-[#fdfbf7] text-[10px]">
              {/* Left Vendor Info */}
              <div className="p-2 border-r border-slate-300 flex flex-col justify-between">
                <div>
                  <div className="text-[9px] font-bold text-[#0b3558] uppercase">Vendor Details</div>
                  <div className="text-xs font-black text-[#0b3558] uppercase">{settlement.vendor?.vendor_name || 'S.K. SATHANA TRADERS'}</div>
                  <div className="text-slate-600 text-[9px] mt-0.5 leading-relaxed">
                    {settlement.vendor?.address || '45/B, Mill Road, Sathy Main Road'}<br />
                    {settlement.vendor?.city || 'Gobichettipalayam'} {settlement.vendor?.pincode ? `, ${settlement.vendor?.pincode}` : ''}<br />
                    <strong>GSTIN :</strong> <span className="font-mono font-bold text-slate-800">{settlement.vendor?.gstin || '-'}</span>
                    {settlement.vendor?.phone && <span> &nbsp;|&nbsp; <strong>Phone :</strong> {settlement.vendor.phone}</span>}
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-200 flex items-center gap-2">
                  <span className="font-bold text-slate-700">Product</span>
                  <span className="font-black text-[#0b3558] uppercase">{settlement.product?.product_name || 'Rice Bran Grade II'}</span>
                </div>
              </div>

              {/* Right Key-Value Metrics */}
              <div className="divide-y divide-slate-200">
                <div className="grid grid-cols-2 px-2 py-0.5">
                  <span className="font-bold text-slate-700">Lot Number</span>
                  <span className="font-bold text-slate-900 text-right">{settlement.lot_number || '-'}</span>
                </div>
                <div className="grid grid-cols-2 px-2 py-0.5">
                  <span className="font-bold text-slate-700">Bill No & Date</span>
                  <span className="font-bold text-slate-900 text-right">{billNo} & {formatDate(billDate)}</span>
                </div>
                <div className="grid grid-cols-2 px-2 py-0.5">
                  <span className="font-bold text-slate-700">Vehicle Number</span>
                  <span className="font-bold font-mono text-slate-900 text-right">{settlement.vehicle_number || '-'}</span>
                </div>
                <div className="grid grid-cols-2 px-2 py-0.5">
                  <span className="font-bold text-slate-700">Cont.Unit Rate</span>
                  <span className="font-bold text-slate-900 text-right">{Number(settlement.contract_unit_rate || 0).toFixed(2)} {settlement.rate_basis === 'per_10kg' ? 'PP Bag' : (settlement.rate_basis === 'per_mt' ? 'Per MT' : 'Per Kg')}</span>
                </div>
                <div className="grid grid-cols-2 px-2 py-0.5">
                  <span className="font-bold text-slate-700">Final Unit Rate</span>
                  <span className="font-bold text-slate-900 text-right">{Number(settlement.final_unit_rate || 0).toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 px-2 py-0.5">
                  <span className="font-bold text-slate-700">Final Weight (MT)</span>
                  <span className="font-bold text-slate-900 text-right">{Number(settlement.final_weight_mt || 0).toFixed(3)}</span>
                </div>
                <div className="grid grid-cols-2 px-2 py-0.5">
                  <span className="font-bold text-slate-700">Jute Bag</span>
                  <span className="text-slate-900 text-right">{Number(settlement.jute_bag || 0).toFixed(3)}</span>
                </div>
                <div className="grid grid-cols-2 px-2 py-0.5">
                  <span className="font-bold text-slate-700">PP Bag</span>
                  <span className="text-slate-900 text-right">{Number(settlement.pp_bag || 0).toFixed(3)}</span>
                </div>
              </div>
            </div>

            {/* Settlement QC Tests (Left 35%) & Financials (Right 65%) */}
            <div className="grid grid-cols-12 gap-2 text-[10px]">
              {/* Left: QC Tests */}
              <div className="col-span-4 border border-slate-300">
                <div className="bg-[#f7eedb] px-2 py-1 font-bold text-[#0b3558] text-center border-b border-slate-300">
                  QC Test Particulars
                </div>
                <div className="divide-y divide-slate-200">
                  <div className="flex justify-between px-2 py-0.5 font-bold">
                    <span>Oil Content</span>
                    <span>{settlement.oil_content ? `${Number(settlement.oil_content).toFixed(2)} %` : '-'}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>FFA</span>
                    <span>{settlement.ffa ? (!isNaN(Number(settlement.ffa)) && settlement.ffa !== '' ? Number(settlement.ffa).toFixed(2) : settlement.ffa) : '-'}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>SS (Sand Silica)</span>
                    <span>{settlement.ss ? (!isNaN(Number(settlement.ss)) && settlement.ss !== '' ? Number(settlement.ss).toFixed(2) : settlement.ss) : '-'}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>Fibre</span>
                    <span>{settlement.fibre ? (!isNaN(Number(settlement.fibre)) && settlement.fibre !== '' ? Number(settlement.fibre).toFixed(2) : settlement.fibre) : '-'}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>Moisture</span>
                    <span>{settlement.moisture ? (!isNaN(Number(settlement.moisture)) && settlement.moisture !== '' ? Number(settlement.moisture).toFixed(2) : settlement.moisture) : '-'}</span>
                  </div>
                </div>
              </div>

              {/* Right: Financial Summary */}
              <div className="col-span-8 border border-slate-300 divide-y divide-slate-200">
                <div className="flex justify-between px-2 py-0.5 bg-[#fdfbf7] font-bold">
                  <span>Total Value</span>
                  <span>{Number(settlement.bran_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between px-2 py-0.5">
                  <span>Bag Amount</span>
                  <span>{Number(settlement.bag_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between px-2 py-0.5 font-bold">
                  <span>Bran Value</span>
                  <span>{Number(settlement.bran_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between px-2 py-0.5">
                  <span>CGST ({Number(settlement.cgst_rate || 2.5).toFixed(2)}%)</span>
                  <span>{Number(settlement.cgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between px-2 py-0.5">
                  <span>SGST ({Number(settlement.sgst_rate || 2.5).toFixed(2)}%)</span>
                  <span>{Number(settlement.sgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between px-2 py-0.5">
                  <span>IGST ({Number(settlement.igst_rate || 0).toFixed(2)}%)</span>
                  <span>{Number(settlement.igst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between px-2 py-1 bg-slate-100 font-bold text-slate-800 border-y border-slate-200 my-0.5">
                  <span>Sub Total (Bran Value + GST)</span>
                  <span>{Number(settlement.subtotal_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between px-2 py-0.5">
                  <span>Loading charges</span>
                  <span>{Number(settlement.loading_charges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between px-2 py-0.5">
                  <span>Unloading Charges</span>
                  <span>{Number(settlement.unloading_charges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between px-2 py-0.5">
                  <span>TDS Deduction {settlement.tds_rate > 0 ? `(${Number(settlement.tds_rate).toFixed(2)}%)` : ''}</span>
                  <span>{Number(settlement.tds || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between px-2 py-0.5">
                  <span>Advance Paid</span>
                  <span>{Number(settlement.advance_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between px-2 py-0.5">
                  <span>Lorry Freight</span>
                  <span>{Number(settlement.lorry_freight || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between px-2 py-0.5">
                  <span>Other Charges</span>
                  <span>{Number(settlement.other_charges || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between px-2 py-1 bg-[#faedcd] text-[#0b3558] font-black text-[11px]">
                  <span>Net Payable</span>
                  <span className="text-xs">₹{Number(settlement.net_payable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* SECTION 2: DEBIT / CREDIT NOTE */}
            <div className="space-y-2 pt-1">
              <div className="bg-[#0b3558] text-white text-center font-bold text-xs tracking-widest py-1 uppercase rounded-xs">
                <span className="inline-block w-5 h-px bg-[#d69e2e] align-middle mr-2"></span>
                {noteLabel}
                <span className="inline-block w-5 h-px bg-[#d69e2e] align-middle ml-2"></span>
              </div>

              {/* Debit/Credit Note Header Grid */}
              <div className="grid grid-cols-2 border border-slate-300 bg-[#fdfbf7] text-[10px]">
                <div className="p-2 border-r border-slate-300">
                  <div className="text-[9px] font-bold text-[#0b3558] uppercase">Vendor Details</div>
                  <div className="text-xs font-black text-[#0b3558] uppercase">{settlement.vendor?.vendor_name || '-'}</div>
                  <div className="text-slate-600 text-[9px] mt-0.5">
                    {settlement.vendor?.address || '-'}<br />
                    {settlement.vendor?.city || '-'} {settlement.vendor?.pincode ? `, ${settlement.vendor?.pincode}` : ''}<br />
                    <strong>GSTIN :</strong> <span className="font-mono font-bold text-slate-800">{settlement.vendor?.gstin || '-'}</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-200">
                  <div className="grid grid-cols-2 px-2 py-0.5">
                    <span className="font-bold text-slate-700">{noteDocLabel}</span>
                    <span className="font-bold font-mono text-slate-900 text-right">{dnNumber}</span>
                  </div>
                  <div className="grid grid-cols-2 px-2 py-0.5">
                    <span className="font-bold text-slate-700">Date</span>
                    <span className="font-bold text-slate-900 text-right">{formatDate(settlement.settlement_date)}</span>
                  </div>
                  <div className="grid grid-cols-2 px-2 py-0.5">
                    <span className="font-bold text-slate-700">InvoiceNo</span>
                    <span className="font-bold text-slate-900 text-right">{billNo}</span>
                  </div>
                  <div className="grid grid-cols-2 px-2 py-0.5">
                    <span className="font-bold text-slate-700">InvoiceDate</span>
                    <span className="font-bold text-slate-900 text-right">{formatDate(billDate)}</span>
                  </div>
                  <div className="grid grid-cols-2 px-2 py-0.5">
                    <span className="font-bold text-slate-700">Lot No</span>
                    <span className="font-bold text-slate-900 text-right">{settlement.lot_number || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full border border-slate-300 text-[10px]">
                <thead className="bg-[#f7eedb] font-bold text-[#0b3558]">
                  <tr>
                    <th className="p-1 text-center w-10 border-r border-slate-300">S.No</th>
                    <th className="p-1 text-left border-r border-slate-300">Particulars</th>
                    <th className="p-1 text-right w-28">Amount (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-300">
                    <td className="p-1 text-center font-bold border-r border-slate-300">1</td>
                    <td className="p-1 border-r border-slate-300 font-medium">
                      {isCredit 
                        ? 'Credit (Oil Content & Quality Bonus / Premium Rate Difference)' 
                        : 'Rebate (Oil Content & Quality Adjustment Difference)'}
                    </td>
                    <td className="p-1 text-right font-black">Rs. {Number(rebateAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>

              {/* Dual Column Financial Summary */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {/* Left: Party Invoice Breakdown */}
                <div className="border border-slate-300 divide-y divide-slate-200">
                  <div className="flex justify-between px-2 py-0.5 font-bold">
                    <span>Party Invoice</span>
                    <span>Rs. {Number(invoiceValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>CGST</span>
                    <span>Rs. {Number(invCgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>SGST</span>
                    <span>Rs. {Number(invSgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>IGST</span>
                    <span>Rs. {Number(invIgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5 bg-[#fdfbf7] font-black text-[#0b3558]">
                    <span>Total Party Invoice</span>
                    <span>Rs. {Number(invTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Right: Note Tax Breakdown */}
                <div className="border border-slate-300 divide-y divide-slate-200">
                  <div className="flex justify-between px-2 py-0.5 bg-[#fdfbf7] font-bold">
                    <span>{isCredit ? 'Total (Credit)' : 'Total (Debit)'}</span>
                    <span>Rs. {Number(rebateAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>CGST</span>
                    <span>Rs. {Number(rebateCgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>SGST</span>
                    <span>Rs. {Number(rebateSgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>IGST</span>
                    <span>Rs. {Number(rebateIgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1 bg-[#faedcd] text-[#0b3558] font-black">
                    <span>Total</span>
                    <span>Rs. {Number(rebateTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-[#0b3558] font-bold">
                <strong>Remarks:</strong> {(() => {
                  const r = existingNote?.remarks || settlement.remarks
                  if (isCredit && (!r || r.toLowerCase().includes('debit'))) {
                    return 'Auto-generated Credit Note posted to vendor ledger'
                  }
                  if (!isCredit && (!r || r.toLowerCase().includes('credit'))) {
                    return 'Auto-generated Debit Note posted to vendor ledger'
                  }
                  return r || `Auto-generated ${noteLabel} posted to vendor ledger`
                })()}
              </div>
            </div>

            {/* Clean Footer Divider Line */}
            <div className="h-0.5 bg-[#0b3558]"></div>

            {/* Bottom Signature */}
            <div className="pt-1 flex justify-between items-end text-[10px] font-bold text-[#0b3558]">
              <div>AUTHORISED SIGNATURE</div>
              <div className="text-right border-t border-[#0b3558] pt-1 w-52 text-center">
                For {coName}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
