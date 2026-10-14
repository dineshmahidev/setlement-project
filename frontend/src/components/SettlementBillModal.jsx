import React from 'react'
import { Printer, Download, X } from 'lucide-react'
import { openPdf, downloadPdf } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/helpers'

export default function SettlementBillModal({ settlement, isOpen, onClose }) {
  const { activeCompany } = useAuth()
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

  // Calculate debit/credit note values if not explicitly provided
  const existingNote = settlement.debit_notes?.[0]
  const noteType = existingNote?.transaction_type || settlement.note_type || 'debit'
  const isCredit = noteType === 'credit'
  const noteLabel = isCredit ? 'CREDIT NOTE' : 'DEBIT NOTE'
  const noteDocLabel = isCredit ? 'CreditNote No:' : 'DebitNote No:'
  const notePrefix = isCredit ? 'CN' : 'DN'

  const rebateAmount = parseFloat(settlement.rebate_amount) || parseFloat(settlement.note_amount) || 0
  const invoiceValue = parseFloat(settlement.original_invoice_value) > 0
    ? parseFloat(settlement.original_invoice_value)
    : (parseFloat(settlement.bran_value) || 0) + rebateAmount

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

  const dnNumber = existingNote?.debit_note_number ||
    `${notePrefix}/${(settlement.settlement_number || '1019').replace(/\D/g, '') || '1019'}/${settlement.financial_year || '26-27'}`

  const billNo = settlement.bill_number || settlement.invoice?.invoice_number || '68'
  const billDate = settlement.bill_date || settlement.invoice?.invoice_date || settlement.settlement_date

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Modal Top Actions Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-[#0b3558] text-white">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-white bg-[#07233b] px-2.5 py-0.5 rounded">
              {settlement.settlement_number || 'NEW'}
            </span>
            <span className="text-sm font-bold text-slate-100">
              Settlement Bill & Debit Note (Single Document Preview)
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

        {/* Single Page Preview Container */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-[#f4f6f9] flex flex-col items-center">
          
          <div className="w-full max-w-3xl bg-white border-2 border-[#0b3558] p-4 text-[10.5px] text-slate-900 font-sans shadow-lg select-text space-y-2">
            
            {/* Top Company Header */}
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#0b3558]">
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
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SECTION 1: SETTLEMENT BILL                                                */}
            {/* ========================================================================= */}
            <div className="bg-[#0b3558] text-white text-center font-bold text-xs tracking-widest py-1 uppercase rounded-xs">
              SETTLEMENT BILL
            </div>

            {/* Vendor Details & Bill Header Grid */}
            <div className="grid grid-cols-2 border border-slate-300 bg-[#fdfbf7] text-[10px]">
              {/* Left Vendor Info */}
              <div className="p-2 border-r border-slate-300 flex flex-col justify-between">
                <div>
                  <div className="text-[9px] font-bold text-[#0b3558] uppercase">Vendor Details</div>
                  <div className="text-xs font-black text-[#0b3558] uppercase">{settlement.vendor?.vendor_name || 'SRI RAM AGRO'}</div>
                  <div className="text-slate-600 text-[9px] mt-0.5">
                    {settlement.vendor?.address || 'ARIYALUR'}<br />
                    {settlement.vendor?.city || 'ARIYALUR'} {settlement.vendor?.pincode ? `, ${settlement.vendor?.pincode}` : ''}<br />
                    <strong>GSTIN :</strong> <span className="font-mono font-bold text-slate-800">{settlement.vendor?.gstin || '-'}</span>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-200 flex items-center gap-2">
                  <span className="font-bold text-slate-700">Product</span>
                  <span className="font-black text-[#0b3558] uppercase">{settlement.product?.product_name || 'BOILED BRAN'}</span>
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
                  <span className="font-bold text-slate-900 text-right">{Number(settlement.contract_unit_rate || 0).toFixed(2)}</span>
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
                    <span>{settlement.ffa ? Number(settlement.ffa).toFixed(2) : '-'}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>SS (Sand Silica)</span>
                    <span>{settlement.ss ? Number(settlement.ss).toFixed(2) : '-'}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>Fibre</span>
                    <span>{settlement.fibre ? Number(settlement.fibre).toFixed(2) : '-'}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>Moisture</span>
                    <span>{settlement.moisture ? Number(settlement.moisture).toFixed(2) : '-'}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>IV</span>
                    <span>{settlement.iv ? Number(settlement.iv).toFixed(3) : '-'}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>Calcium</span>
                    <span>{settlement.calcium ? Number(settlement.calcium).toFixed(2) : '0'}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>Protein</span>
                    <span>{settlement.protein ? Number(settlement.protein).toFixed(2) : '0'}</span>
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
                <div className="flex justify-between px-2 py-1 bg-slate-100 font-black text-[#0b3558] border-y border-slate-200 my-0.5">
                  <span>Sub Total (Bran Value + GST)</span>
                  <span>{Number(settlement.subtotal_amount || (Number(settlement.bran_value || 0) + Number(settlement.bag_amount || 0) + Number(settlement.cgst_amount || 0) + Number(settlement.sgst_amount || 0) + Number(settlement.igst_amount || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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

            {/* ========================================================================= */}
            {/* SECTION 2: DEBIT / CREDIT NOTE (ALWAYS IN SAME SINGLE CARD/PDF PREVIEW)   */}
            {/* ========================================================================= */}
            <div className="pt-2 border-t-2 border-dashed border-[#0b3558] space-y-2">
              <div className="bg-[#0b3558] text-white text-center font-bold text-xs tracking-widest py-1 uppercase rounded-xs">
                {noteLabel}
              </div>

              {/* Debit Note Header Grid */}
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
                    <th className="p-1 text-right w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-300">
                    <td className="p-1 text-center font-bold border-r border-slate-300">1</td>
                    <td className="p-1 border-r border-slate-300 font-medium">
                      {isCredit 
                        ? 'Quality Premium / Price Bonus (Settlement value exceeds invoice)' 
                        : 'Rebate (Oil Content & Quality Adjustment Difference)'}
                    </td>
                    <td className="p-1 text-right font-black">{Number(rebateAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>

              {/* Dual Column Financial Summary */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {/* Left: Party Invoice Breakdown */}
                <div className="border border-slate-300 divide-y divide-slate-200">
                  <div className="flex justify-between px-2 py-0.5 font-bold">
                    <span>Party Invoice</span>
                    <span>{Number(invoiceValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>CGST</span>
                    <span>{Number(invCgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>SGST</span>
                    <span>{Number(invSgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>IGST</span>
                    <span>{Number(invIgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5 bg-[#fdfbf7] font-black text-[#0b3558]">
                    <span>Total Party Invoice</span>
                    <span>{Number(invTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Right: Note Tax Breakdown */}
                <div className="border border-slate-300 divide-y divide-slate-200">
                  <div className="flex justify-between px-2 py-0.5 bg-[#fdfbf7] font-bold">
                    <span>{isCredit ? 'Total (Credit)' : 'Total (Debit)'}</span>
                    <span>{Number(rebateAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>CGST</span>
                    <span>{Number(rebateCgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>SGST</span>
                    <span>{Number(rebateSgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between px-2 py-0.5">
                    <span>IGST</span>
                    <span>{Number(rebateIgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1 bg-[#faedcd] text-[#0b3558] font-black">
                    <span>Total</span>
                    <span>₹{Number(rebateTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-[#0b3558] font-bold">
                <strong>Remarks:</strong> {settlement.remarks || `Auto-generated ${noteLabel} posted to vendor ledger`}
              </div>
            </div>

            {/* Bottom Signature */}
            <div className="pt-4 flex justify-between items-end text-[10px] font-bold text-[#0b3558]">
              <div>AUTHORISED SIGNATURE</div>
              <div className="text-right border-t-2 border-[#0b3558] pt-1 w-52 text-center">
                For {coName}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}

