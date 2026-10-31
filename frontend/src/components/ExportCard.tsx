import { CloudDownloadOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons'
import { App, Button, Card, Space, Typography } from 'antd'
import { useState } from 'react'
import { apiError } from '@/api/client'
import { usePage } from '@/api/hooks'
import { DateRangeField, type DateRange } from '@/components/DateField'
import { formatDate, today } from '@/lib/date'
import { openFile } from '@/lib/download'

type Format = 'xlsx' | 'csv'

/**
 * Day-wise backup of one document list (challans, purchases...): today by default, any range of days,
 * saved as Excel or CSV so it can be copied to a USB drive. `endpoint` must also serve `${endpoint}/export`.
 */
export function ExportCard({ endpoint, noun, plural = `${noun}s` }: { endpoint: string; noun: string; plural?: string }) {
  const { message } = App.useApp()
  const [range, setRange] = useState<DateRange>([today(), today()])
  const [busy, setBusy] = useState<Format | null>(null)
  // Live count so the munshi sees what the file will hold before saving it.
  const { data, isFetching } = usePage<unknown>(endpoint, { from: range[0], to: range[1], page: 1, size: 1 })
  const count = data?.total
  const label = range[0] === range[1] ? formatDate(range[0]) : `${formatDate(range[0])} to ${formatDate(range[1])}`
  const Plural = plural[0].toUpperCase() + plural.slice(1)

  const download = async (format: Format) => {
    if (count === 0) {
      message.warning(`No ${plural} on ${label}. Pick other days to export.`)
      return
    }
    setBusy(format)
    try {
      await openFile(`${endpoint}/export`, { from: range[0], to: range[1], format }, `${plural}.${format}`)
      message.success(`${Plural} for ${label} downloaded`)
    } catch (e) {
      message.error(apiError(e).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card size="small" style={{ marginBottom: 16 }} title={<Space><CloudDownloadOutlined />Export / backup</Space>}>
      <Space wrap align="center">
        <DateRangeField value={range} onChange={setRange} />
        <Typography.Text type={count === 0 ? 'warning' : undefined} strong={Boolean(count)}>
          {count === undefined || isFetching ? 'Counting…' : count === 0 ? `No ${plural} on these days` : `${count} ${count === 1 ? noun : plural}`}
        </Typography.Text>
        <Button type="primary" icon={<FileExcelOutlined />} loading={busy === 'xlsx'} disabled={busy !== null || !count} onClick={() => void download('xlsx')}>
          Excel
        </Button>
        <Button icon={<FileTextOutlined />} loading={busy === 'csv'} disabled={busy !== null || !count} onClick={() => void download('csv')}>
          CSV
        </Button>
      </Space>
      <Typography.Paragraph type="secondary" style={{ margin: '8px 0 0', fontSize: 13 }}>
        Pick the days here (the list filter below does not change the export). All {plural} for those days are saved, voided ones included. Copy the file to a USB drive to keep a backup.
      </Typography.Paragraph>
    </Card>
  )
}
