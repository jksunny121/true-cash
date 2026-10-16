import { useFinance } from '../lib/useFinance'
import { formatCurrency, formatDateShort } from '../lib/format'
import { Card, CardHeader } from './ui/Card'
import { BucketBadge } from './ui/Badge'
import { RapidEntryForm } from './RapidEntryForm'
import { ReconcileBalancesModal } from './ReconcileBalancesModal'
import { useStore } from '../store/useStore'
import { Button } from './ui/Button'

export function LiveDashboard() {
  const { trueCash, safeToSpend, creditUtil, creditWarning, account, ledger, todayStr } = useFinance()
  const deleteLoggedEntry = useStore((s) => s.deleteLoggedEntry)

  const todaysLogged = ledger
    .filter((e) => e.logged && e.date === todayStr)
    .sort((a, b) => (a.id < b.id ? 1 : -1))

  return (
    <div className="flex flex-col gap-6">
      {creditWarning && (
        <div className="rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          Credit card at {(creditUtil * 100).toFixed(0)}% of limit ({formatCurrency(account.creditCardBalance)} of{' '}
          {formatCurrency(account.creditCardLimit)}) — above the 30% threshold.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="bg-surface-raised">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium uppercase tracking-wide text-text-muted">True Cash Now</p>
            <ReconcileBalancesModal />
          </div>
          <p className="mt-2 text-5xl font-semibold tabular tracking-tight text-text">
            {formatCurrency(trueCash)}
          </p>
          <p className="mt-2 text-xs text-text-muted">
            {formatCurrency(account.liquidCash)} liquid &minus; {formatCurrency(account.creditCardBalance)} credit card
          </p>
        </Card>

        <Card className="bg-surface-raised">
          <p className="text-sm font-medium uppercase tracking-wide text-text-muted">Safe to Spend Today</p>
          <p className="mt-2 text-5xl font-semibold tabular tracking-tight text-buffer">
            {formatCurrency(safeToSpend)}
          </p>
          <p className="mt-2 text-xs text-text-muted">
            Buffer envelope &middot; {formatCurrency(account.monthlyTargets.Buffer)} monthly target, paced across
            remaining days
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Log Today's Spend" subtitle="Variable or Buffer — deducts live from True Cash" />
        <RapidEntryForm />
      </Card>

      {todaysLogged.length > 0 && (
        <Card>
          <CardHeader title="Logged Today" />
          <ul className="flex flex-col gap-2">
            {todaysLogged.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-surface-raised px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <BucketBadge bucket={e.bucket} />
                  <span className="truncate text-sm text-text">{e.desc}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="tabular text-sm text-text">{formatCurrency(e.amount)}</span>
                  <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => deleteLoggedEntry(e.id)}>
                    Undo
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="text-center text-xs text-text-muted">{formatDateShort(todayStr)} &middot; updated live</p>
    </div>
  )
}
