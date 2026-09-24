import { useCallback, useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { Button, PageHeader, PageSpinner } from '../../components'

const MODULES = [
  ['SETTLEMENT_BILL', 'Settlement Bill'],
  ['QC', 'QC Fields'],
  ['CHARGES', 'Charges'],
]

export default function FieldConfiguration() {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/field-configurations')
      setRows(Array.isArray(res.data) ? res.data : res.data.data || [])
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to load field configurations'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  function update(id, patch) {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    setDirty(true)
  }

  async function save() {
    setSaving(true)
    try {
      const fields = rows.map((r) => ({
        id: r.id,
        visible: r.visible ? 1 : 0,
        required: r.required ? 1 : 0,
        mode: r.mode,
        calculation_rule: r.calculation_rule || null,
        sort_order: r.sort_order,
      }))
      const res = await api.put('/field-configurations', { fields })
      setRows(Array.isArray(res.data) ? res.data : res.data.data || rows)
      setDirty(false)
      toast.success('Field configuration saved')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading && !rows.length) return <PageSpinner />

  return (
    <div>
      <PageHeader
        title="Field Configuration"
        subtitle="Hidden fields disappear from form, calculations and PDF"
        actions={
          <Button onClick={save} loading={saving} disabled={!dirty}>
            Save Changes
          </Button>
        }
      />

      <div className="space-y-4">
        {MODULES.map(([mod, label]) => {
          const list = rows.filter((r) => r.module === mod)
          if (!list.length) return null
          return (
            <div key={mod} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700">
                {label} <span className="font-normal text-slate-400">({mod})</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-xs uppercase text-slate-500">
                    <tr className="border-b border-slate-100">
                      <th className="px-4 py-2 text-left">Field</th>
                      <th className="px-4 py-2 text-left">Key</th>
                      <th className="px-4 py-2 text-center">Visible</th>
                      <th className="px-4 py-2 text-center">Required</th>
                      <th className="px-4 py-2 text-left">Mode</th>
                      <th className="px-4 py-2 text-left">Calculation Rule</th>
                      <th className="px-4 py-2 text-right">Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {list.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-2 font-medium text-slate-800">{r.field_name}</td>
                        <td className="px-4 py-2 text-xs text-slate-500">{r.field_key}</td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(r.visible)}
                            onChange={(e) => update(r.id, { visible: e.target.checked })}
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(r.required)}
                            onChange={(e) => update(r.id, { required: e.target.checked })}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={r.mode || 'MANUAL'}
                            onChange={(e) => update(r.id, { mode: e.target.value })}
                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                          >
                            <option value="MANUAL">MANUAL</option>
                            <option value="AUTOMATIC">AUTOMATIC</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            value={r.calculation_rule || ''}
                            onChange={(e) => update(r.id, { calculation_rule: e.target.value })}
                            placeholder="—"
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-slate-500">{r.sort_order}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      {dirty && (
        <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Unsaved changes — click Save Changes to apply.
        </p>
      )}
    </div>
  )
}
