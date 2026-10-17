import { useFinance } from '../lib/useFinance'
import { formatCurrency, formatDateLong } from '../lib/format'
import { Card, CardHeader } from './ui/Card'
import { BucketBadge } from './ui/Badge'
import { EditEntryDialog } from './EditEntryDialog'
import { AddEntryDialog } from './AddEntryDialog'

export function RollingRadar() {
  const { upcoming30, radarLowest, radarEnd } = useFinance()

  const total = upcoming30.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <AddEntryDialog />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="bg-surface-raised">
          <p className="text-sm font-medium uppercase tracking-wide text-text-muted">Lowest Projected Balance</p>
          <p className="mt-2 text-4xl font-semibold tabular tracking-tight text-text">
            {radarLowest ? formatCurrency(radarLowest.balance) : '—'}
          </p>
          <p className="mt-2 text-xs text-text-muted">
            {radarLowest ? `on ${formatDateLong(radarLowest.date)}` : 'no projection available'} &middot; next 30
            days (through {formatDateLong(radarEnd)})
          </p>
        </Card>

        <Card className="bg-surface-raised">
          <p className="text-sm font-medium uppercase tracking-wide text-text-muted">Net Unpaid Bills (30d)</p>
          <p className="mt-2 text-4xl font-semibold tabular tracking-tight text-text">{formatCurrency(total)}</p>
          <p className="mt-2 text-xs text-text-muted">{upcoming30.length} items outstanding in this window</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Upcoming in the Next 30 Days" />
        {upcoming30.length === 0 ? (
          <p className="text-sm text-text-muted">Nothing outstanding in this window.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming30.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-surface-raised px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-16 shrink-0 text-xs text-text-muted">{formatDateLong(e.date).slice(0, 6)}</span>
                  <BucketBadge bucket={e.bucket} />
                  <span className="truncate text-sm text-text">{e.desc}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={'tabular text-sm ' + (e.amount < 0 ? 'text-positive' : 'text-text')}>
                    {formatCurrency(e.amount)}
                  </span>
                  <EditEntryDialog entry={e} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
