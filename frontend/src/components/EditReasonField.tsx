import { Form, Input } from 'antd'
import { useId } from 'react'

/** Returns an error to show, or null when the reason is long enough (the server asks for 3+ characters). */
export function editReasonError(value: string): string | null {
  return value.trim().length >= 3 ? null : 'Write why you are changing this entry'
}

/** "Reason for change" box shown only when editing a saved entry; the reason appears on the Edited tag. */
export function EditReasonField({ value, onChange, showError }: { value: string; onChange: (v: string) => void; showError: boolean }) {
  const id = useId()
  const error = showError ? editReasonError(value) : null
  return (
    <Form.Item
      label="Reason for change"
      htmlFor={id}
      required
      validateStatus={error ? 'error' : undefined}
      help={error ?? 'Shown on the Edited tag in the list, e.g. "rate corrected", "wrong customer"'}
      style={{ marginBottom: 16 }}
    >
      <Input id={id} value={value} maxLength={500} placeholder="Why is this entry being changed?" onChange={(e) => onChange(e.target.value)} />
    </Form.Item>
  )
}
