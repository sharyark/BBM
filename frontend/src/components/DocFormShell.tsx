import { Button, Form, Space } from 'antd'
import { useState, type ReactNode } from 'react'
import { EditReasonField, editReasonError } from './EditReasonField'

interface Props {
  onSubmit: () => void
  saving: boolean
  children: ReactNode
  extra?: ReactNode
  /** Pass when editing a saved entry: asks for a reason and blocks saving without one. */
  editReason?: { value: string; onChange: (v: string) => void }
}

export function DocFormShell({ onSubmit, saving, children, extra, editReason }: Props) {
  const [tried, setTried] = useState(false)
  const finish = () => {
    setTried(true)
    if (editReason && editReasonError(editReason.value)) return
    onSubmit()
  }
  return (
    <Form layout="vertical" onFinish={finish} autoComplete="off">
      {children}
      {editReason && <EditReasonField value={editReason.value} onChange={editReason.onChange} showError={tried} />}
      <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
        <div>{extra}</div>
        <Button type="primary" htmlType="submit" loading={saving} size="large">Save</Button>
      </Space>
    </Form>
  )
}
