import { CheckOutlined, DownOutlined, FilePdfOutlined, LoadingOutlined } from '@ant-design/icons'
import { App, Button, Dropdown, Space } from 'antd'
import { useState } from 'react'
import { apiError } from '@/api/client'
import { openFile } from '@/lib/download'
import { getPaper, PAPERS, setPaper, type Paper } from '@/lib/paper'

/**
 * Opens the document PDF. With `thermal`, a small menu picks the paper (thermal 80mm / 58mm or A5);
 * the choice is remembered on this device and used for every later print.
 */
export function PrintButton({ url, label = 'Print', size = 'small', thermal = false }: { url: string; label?: string; size?: 'small' | 'middle'; thermal?: boolean }) {
  const { message } = App.useApp()
  const [busy, setBusy] = useState(false)
  const [paper, setLocalPaper] = useState<Paper>(getPaper)

  const print = async (p: Paper) => {
    setBusy(true)
    try {
      await openFile(url, thermal ? { paper: p } : {})
    } catch (e) {
      message.error(apiError(e).message)
    } finally {
      setBusy(false)
    }
  }

  const main = (
    <Button size={size} icon={busy ? <LoadingOutlined /> : <FilePdfOutlined />} onClick={() => void print(paper)} title={thermal ? `Print on ${PAPERS.find((x) => x.value === paper)?.label}` : undefined}>
      {label}
    </Button>
  )
  if (!thermal) return main
  return (
    <Space.Compact size={size === 'small' ? 'small' : 'middle'}>
      {main}
      <Dropdown
        trigger={['click']}
        menu={{
          items: PAPERS.map((x) => ({ key: x.value, label: x.label, icon: x.value === paper ? <CheckOutlined /> : <span style={{ display: 'inline-block', width: 14 }} /> })),
          onClick: ({ key }) => {
            const p = key as Paper
            setPaper(p)
            setLocalPaper(p)
            void print(p)
          },
        }}
      >
        <Button size={size} icon={<DownOutlined />} aria-label="Choose paper size" />
      </Dropdown>
    </Space.Compact>
  )
}
