import { useCallback, useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { Button, Checkbox, FormField, Input, PageHeader, PageSpinner, Select, Textarea } from '../../components'

const KEYS = [
  'company_name',
  'address',
  'gstin',
  'cin',
  'email',
  'website',
  'phone',
  'invoice_prefix',
  'debit_note_prefix',
  'currency',
  'inventory_quantity_source',
  'allow_negative_stock',
  'pdf_header',
  'pdf_footer',
  'signature',
  'seal',
  'default_gst',
  'bill_number_format',
]

export default function CompanySettings() {
  const toast = useToast()
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [branches, setBranches] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, b] = await Promise.all([
        api.get('/settings'),
        api.get('/branches?per_page=100').catch(() => ({ data: [] })),
      ])
      setForm(s.data || {})
      const bl = Array.isArray(b.data) ? b.data : b.data.data || []
      setBranches(bl)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load settings'))
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {}
      KEYS.forEach((k) => {
        if (form[k] === undefined) return
        if (k === 'allow_negative_stock') payload[k] = form[k] ? 1 : 0
        else payload[k] = form[k]
      })
      if (form.default_branch_id !== undefined) {
        payload.default_branch_id = form.default_branch_id ? Number(form.default_branch_id) : null
      }
      const res = await api.put('/settings', payload)
      setForm(res.data || payload)
      toast.success('Settings saved')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading && !form.company_name) return <PageSpinner />

  const negative = form.allow_negative_stock === true || form.allow_negative_stock === 1 || form.allow_negative_stock === '1'

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Company Settings"
        subtitle="Company identity, PDF and inventory options"
        actions={
          <Button onClick={save} loading={saving} form="settings-form">
            Save
          </Button>
        }
      />
      <form id="settings-form" onSubmit={save} className="space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Company</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Company Name">
              <Input value={form.company_name || ''} onChange={(e) => setF('company_name', e.target.value)} />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={form.email || ''} onChange={(e) => setF('email', e.target.value)} />
            </FormField>
            <FormField label="Address" className="sm:col-span-2">
              <Textarea rows={2} value={form.address || ''} onChange={(e) => setF('address', e.target.value)} />
            </FormField>
            <FormField label="GSTIN">
              <Input value={form.gstin || ''} onChange={(e) => setF('gstin', e.target.value)} />
            </FormField>
            <FormField label="CIN">
              <Input value={form.cin || ''} onChange={(e) => setF('cin', e.target.value)} />
            </FormField>
            <FormField label="Website">
              <Input value={form.website || ''} onChange={(e) => setF('website', e.target.value)} />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone || ''} onChange={(e) => setF('phone', e.target.value)} />
            </FormField>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Billing</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="Invoice Prefix">
              <Input value={form.invoice_prefix || ''} onChange={(e) => setF('invoice_prefix', e.target.value)} />
            </FormField>
            <FormField label="Debit Note Prefix">
              <Input value={form.debit_note_prefix || ''} onChange={(e) => setF('debit_note_prefix', e.target.value)} />
            </FormField>
            <FormField label="Currency">
              <Input value={form.currency || ''} onChange={(e) => setF('currency', e.target.value)} />
            </FormField>
            <FormField label="Default GST">
              <Input value={form.default_gst || ''} onChange={(e) => setF('default_gst', e.target.value)} placeholder="CGST_SGST:5" />
            </FormField>
            <FormField label="Bill Number Format">
              <Input
                value={form.bill_number_format || ''}
                onChange={(e) => setF('bill_number_format', e.target.value)}
                placeholder="{PREFIX}/{FY}/{SEQ}"
              />
            </FormField>
            <FormField label="Default Branch">
              <Select
                value={form.default_branch_id || ''}
                onChange={(e) => setF('default_branch_id', e.target.value)}
              >
                <option value="">None</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </FormField>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">Inventory</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Inventory Quantity Source">
              <Select
                value={form.inventory_quantity_source || 'FINAL_WEIGHT'}
                onChange={(e) => setF('inventory_quantity_source', e.target.value)}
              >
                <option value="FINAL_WEIGHT">Final Weight</option>
                <option value="NET_WEIGHT">Net Weight</option>
                <option value="MANUAL_QUANTITY">Manual Quantity</option>
              </Select>
            </FormField>
            <div className="pt-6">
              <Checkbox
                label="Allow negative stock"
                checked={negative}
                onChange={(e) => setF('allow_negative_stock', e.target.checked ? 1 : 0)}
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">PDF</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="PDF Header" className="sm:col-span-2">
              <Textarea rows={2} value={form.pdf_header || ''} onChange={(e) => setF('pdf_header', e.target.value)} />
            </FormField>
            <FormField label="PDF Footer" className="sm:col-span-2">
              <Textarea rows={2} value={form.pdf_footer || ''} onChange={(e) => setF('pdf_footer', e.target.value)} />
            </FormField>
            <FormField label="Signature">
              <Input value={form.signature || ''} onChange={(e) => setF('signature', e.target.value)} />
            </FormField>
            <FormField label="Seal">
              <Input value={form.seal || ''} onChange={(e) => setF('seal', e.target.value)} />
            </FormField>
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  )
}
