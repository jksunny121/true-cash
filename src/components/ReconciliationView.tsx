import { useMemo } from 'react'
import { useFinance } from '../lib/useFinance'
import { monthKeyOf, sumBucketForMonth } from '../lib/engine'
import { formatCurrency, formatDateShort, formatMonthLabel } from '../lib/format'
import { Card, CardHeader } from './ui/Card'
import { BucketBadge } from './ui/Badge'
import { ProgressBar } from './ui/ProgressBar'
import { Switch } from './ui/Switch'
import { EditEntryDialog } from './EditEntryDialog'
import { useStore } from '../store/useStore'

export function ReconciliationView() {
  const { ledger, account } = useFinance()
  const toggleEntryPaid = useStore((s) => s.toggleEntryPaid)

  const months = useMemo(() => {
    const keys = Array.from(new Set(ledger.map((e) => monthKeyOf(e.date)))).sort()
    return keys
  }, [ledger])

  return (
    <div className="flex flex-col gap-6">
      {months.map((monthKey) => {
        const entries = ledger
          .filter((e) => monthKeyOf(e.date) === monthKey)
          .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

        const variableSpent = sumBucketForMonth(ledger, 'Variable', monthKey, { onlyPaid: true })
        const variablePlanned = sumBucketForMonth(ledger, 'Variable', monthKey)
        const bufferSpent = sumBucketForMonth(ledger, 'Buffer', monthKey, { onlyPaid: true })
        const bufferPlanned = sumBucketForMonth(ledger, 'Buffer', monthKey)

        return (
          <Card key={monthKey}>
            <CardHeader title={formatMonthLabel(monthKey)} />

            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1 flex items-baseline justify-between text-xs">
                  <span className="text-variable">Variable</span>
                  <span className="tabular text-text-muted">
                    {formatCurrency(variableSpent)} / {formatCurrency(account.monthlyTargets.Variable)}
                  </span>
                </div>
                <ProgressBar value={variableSpent} max={account.monthlyTargets.Variable} colorClass="bg-variable" />
                {variablePlanned > variableSpent && (
                  <p className="mt-1 text-[11px] text-text-muted">
                    +{formatCurrency(variablePlanned - variableSpent)} planned, not yet paid
                  </p>
                )}
              </div>
              <div>
                <div className="mb-1 flex items-baseline justify-between text-xs">
                  <span className="text-buffer">Buffer</span>
                  <span className="tabular text-text-muted">
                    {formatCurrency(bufferSpent)} / {formatCurrency(account.monthlyTargets.Buffer)}
                  </span>
                </div>
                <ProgressBar value={bufferSpent} max={account.monthlyTargets.Buffer} colorClass="bg-buffer" />
                {bufferPlanned > bufferSpent && (
                  <p className="mt-1 text-[11px] text-text-muted">
                    +{formatCurrency(bufferPlanned - bufferSpent)} planned, not yet paid
                  </p>
                )}
              </div>
            </div>

            <ul className="flex flex-col gap-1.5">
              {entries.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface-raised px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-11 shrink-0 text-xs text-text-muted">{formatDateShort(e.date)}</span>
                    <BucketBadge bucket={e.bucket} />
                    <span className="truncate text-sm text-text">{e.desc}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={'tabular text-sm ' + (e.amount < 0 ? 'text-positive' : 'text-text')}>
                      {formatCurrency(e.amount)}
                    </span>
                    {e.bucket !== 'Income' && <EditEntryDialog entry={e} />}
                    {e.logged ? (
                      <span className="text-xs text-text-muted">logged</span>
                    ) : (
                      <Switch
                        checked={e.isPaid}
                        onCheckedChange={() => toggleEntryPaid(e.id)}
                        label={e.isPaid ? 'Paid' : 'Mark paid'}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )
      })}
    </div>
  )
}
