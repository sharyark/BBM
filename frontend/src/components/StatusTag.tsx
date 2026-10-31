import { EditOutlined } from '@ant-design/icons'
import { Space, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'

export interface EditInfo {
  edit_count?: number
  edit_reason?: string | null
  edited_at?: string | null
}

export function StatusTag({ status, reason, edit }: { status: 'active' | 'void'; reason?: string | null; edit?: EditInfo }) {
  const main =
    status === 'active' ? (
      <Tag color="green">Active</Tag>
    ) : (
      <Tooltip title={reason ? `Voided: ${reason}` : 'Voided'}>
        <Tag color="red">Void</Tag>
      </Tooltip>
    )
  return (
    <Space size={0}>
      {main}
      <EditedTag edit={edit} />
    </Space>
  )
}

/** Small "Edited" tag; hover (or tap on a phone) shows why and when the entry was last changed. */
export function EditedTag({ edit }: { edit?: EditInfo }) {
  if (!edit?.edit_count) return null
  const when = edit.edited_at ? dayjs(edit.edited_at).format('DD-MM-YYYY h:mm A') : ''
  const times = edit.edit_count > 1 ? ` (${edit.edit_count} times)` : ''
  return (
    <Tooltip
      trigger={['hover', 'click']}
      title={
        <>
          <div><strong>Edited{times}</strong>{when && ` · ${when}`}</div>
          <div>Reason: {edit.edit_reason || '-'}</div>
        </>
      }
    >
      <Tag color="orange" icon={<EditOutlined />} style={{ cursor: 'help' }} aria-label={`Edited: ${edit.edit_reason ?? ''}`}>
        Edited
      </Tag>
    </Tooltip>
  )
}
