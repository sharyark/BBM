import { Tooltip } from 'antd'
import dayjs from 'dayjs'
import type { Dashboard } from '@/api/types'
import { formatCurrency, formatShort, toNumber } from '@/lib/format'

// One series: past days in a lighter step of the app blue, today in the full blue (both >= 3:1 on white).
const PAST = '#7393b8'
const TODAY = '#1f4e79'

/** Round the top of the axis up to a clean number (1, 2, 2.5, 3, 4, 5 x 10^n) so ticks read 0 / 1.5 lakh / 3 lakh. */
function niceMax(v: number): number {
  if (v <= 0) return 1
  const pow = 10 ** Math.floor(Math.log10(v))
  return ([1, 2, 2.5, 3, 4, 5, 10].find((m) => v <= m * pow) ?? 10) * pow
}

/** Daily sales for the last 14 days as columns; hover (or tap) a day for its sales and trips. */
export function SalesChart({ days }: { days: Dashboard['daily'] }) {
  const values = days.map((d) => toNumber(d.sales))
  const max = niceMax(Math.max(...values, 0))
  const ticks = [0, max / 2, max]
  const last = days.length - 1
  return (
    <div className="sales-chart">
      <div className="sc-plot" aria-hidden>
        {ticks.map((t) => (
          <div key={t} className="sc-grid" style={{ bottom: `${(t / max) * 100}%` }}>
            <span>{formatShort(t)}</span>
          </div>
        ))}
        <div className="sc-bars">
          {days.map((d, i) => {
            const v = values[i]
            const h = (v / max) * 100
            return (
              <Tooltip
                key={d.date}
                trigger={['hover', 'click']}
                title={
                  <>
                    <div><strong>{i === last ? 'Today' : dayjs(d.date).format('ddd, D MMM')}</strong></div>
                    <div>Sales: {formatCurrency(v)}</div>
                    <div>{d.trips} trip{d.trips === 1 ? '' : 's'}</div>
                  </>
                }
              >
                <div className="sc-slot">
                  {i === last && v > 0 && <span className="sc-tip" style={{ bottom: `calc(${h}% + 4px)` }}>{formatShort(v)}</span>}
                  <div className="sc-bar" style={{ height: `${h}%`, minHeight: v > 0 ? 2 : 0, background: i === last ? TODAY : PAST }} />
                </div>
              </Tooltip>
            )
          })}
        </div>
      </div>
      <div className="sc-x" aria-hidden>
        {days.map((d, i) => (
          <span key={d.date} style={{ fontWeight: i === last ? 600 : undefined }}>{i === last ? 'Today' : dayjs(d.date).format('D')}</span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Daily sales, last 14 days</caption>
        <thead><tr><th>Date</th><th>Sales</th><th>Trips</th></tr></thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}><td>{d.date}</td><td>{formatCurrency(d.sales)}</td><td>{d.trips}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
