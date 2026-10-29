import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../services/api'
import { useToast } from '../context/ToastContext'
import { Button, FormField, Input, Modal } from './index'

const EMPTY_FORM = {
  current_password: '',
  password: '',
  password_confirmation: '',
}

export default function ChangePasswordModal({ open, onClose }) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM)
      setSaving(false)
    }
  }, [open])

  const setField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (form.password.length < 6) {
      toast.error('New password must be at least 6 characters.')
      return
    }

    if (form.password !== form.password_confirmation) {
      toast.error('New password and confirmation do not match.')
      return
    }

    setSaving(true)
    try {
      await api.post('/change-password', form)
      toast.success('Password changed successfully.')
      setForm(EMPTY_FORM)
      onClose?.()
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to change password'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change Password"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="change-password-form" loading={saving}>
            Update Password
          </Button>
        </>
      }
    >
      <form id="change-password-form" onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-500">
          Enter your current password, then choose a new password with at least 6 characters.
        </p>

        <FormField label="Current Password" required>
          <Input
            type="password"
            autoComplete="current-password"
            value={form.current_password}
            onChange={setField('current_password')}
            required
          />
        </FormField>

        <FormField label="New Password" required>
          <Input
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={setField('password')}
            minLength={6}
            required
          />
        </FormField>

        <FormField label="Confirm New Password" required>
          <Input
            type="password"
            autoComplete="new-password"
            value={form.password_confirmation}
            onChange={setField('password_confirmation')}
            minLength={6}
            required
          />
        </FormField>
      </form>
    </Modal>
  )
}
