import Button from './Button'
import Modal from './Modal'

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  danger = false,
  variant,
  onConfirm,
  onCancel,
  onClose,
}) {
  const handleCancel = onCancel || onClose
  const isDanger = danger || variant === 'danger'

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : handleCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={isDanger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  )
}
