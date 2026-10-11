import { useCallback, useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Button, FormField, Input, PageHeader, Select } from '../../components'
import { formatNumber, extractList } from '../../utils/helpers'
import { ArrowRightLeft, RefreshCw } from 'lucide-react'

export default function Transfer() {
  const toast = useToast()
  const { branchId } = useAuth()
  const [branches, setBranches] = useState([])
  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    source_branch_id: branchId || '',
    dest_branch_id: '',
    lot_id: '',
    quantity: '',
    reference: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [b, l] = await Promise.all([
        api.get('/branches?per_page=200').catch(() => ({ data: [] })),
        api.get(`/lots?per_page=500&status=OPEN${form.source_branch_id ? `&branch_id=${form.source_branch_id}` : ''}`).catch(() => ({ data: [] })),
      ])
      setBranches(extractList(b.data))
      setLots(extractList(l.data).filter((lot) => Number(lot.available_qty) > 0))
    } finally {
      setLoading(false)
    }
  }, [form.source_branch_id])

  useEffect(() => { load() }, [load])

  const selectedLot = lots.find((l) => String(l.id) === String(form.lot_id))

  async function submit(e) {
    e.preventDefault()
    if (!form.lot_id || !Number(form.quantity) || !form.dest_branch_id) {
      toast.error('Select lot, destination godown and quantity')
      return
    }
    setSaving(true)
    try {
      await api.post('/inventory/transfer-lot', {
        date: form.date,
        source_branch_id: Number(form.source_branch_id),
        dest_branch_id: Number(form.dest_branch_id),
        lot_id: Number(form.lot_id),
        quantity: Number(form.quantity),
        reference: form.reference || null,
      })
      toast.success('Stock transferred between godowns')
      setForm((f) => ({ ...f, lot_id: '', quantity: '', reference: '' }))
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Transfer failed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader
        title="Stock Transfer"
        subtitle="Move a lot between godowns (lot identity preserved)"
        icon={ArrowRightLeft}
        actions={<Button variant="secondary" onClick={load} loading={loading}><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>}
      />

      <form onSubmit={submit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <FormField label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></FormField>
        <FormField label="Source Godown" required>
          <Select value={form.source_branch_id} onChange={(e) => setForm({ ...form, source_branch_id: e.target.value, lot_id: '' })}>
            <option value="">Select…</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.branch_name || b.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Destination Godown" required>
          <Select value={form.dest_branch_id} onChange={(e) => setForm({ ...form, dest_branch_id: e.target.value })}>
            <option value="">Select…</option>
            {branches.filter((b) => String(b.id) !== String(form.source_branch_id)).map((b) => (
              <option key={b.id} value={b.id}>{b.branch_name || b.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Lot" required>
          <Select value={form.lot_id} onChange={(e) => setForm({ ...form, lot_id: e.target.value })}>
            <option value="">Select lot…</option>
            {lots.map((l) => (
              <option key={l.id} value={l.id}>{l.lot_number} — {l.item?.name || `#${l.item_id}`} (avail {formatNumber(l.available_qty)})</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Quantity" required>
          <Input type="number" step="0.001" max={selectedLot ? selectedLot.available_qty : undefined} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        </FormField>
        {selectedLot && (
          <div className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
            Available in lot: <strong>{formatNumber(selectedLot.available_qty)}</strong> • Oil%: <strong>{selectedLot.oil_pct ?? '—'}</strong> • Grade: <strong>{selectedLot.grade?.name || '—'}</strong>
          </div>
        )}
        <FormField label="Reference" className="sm:col-span-2"><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="LR / challan no" /></FormField>
        <div className="sm:col-span-2">
          <Button type="submit" loading={saving}><ArrowRightLeft className="h-3.5 w-3.5" /> Transfer Stock</Button>
        </div>
      </form>
    </div>
  )
}
