import { useFinance } from '../lib/useFinance'
import { formatCurrency, formatDateLong } from '../lib/format'
import { Card, CardHeader } from './ui/Card'
import { ProgressBar } from './ui/ProgressBar'

export function DebtEngineCard() {
  const { debt, debtTrajectory } = useFinance()

  return (
    <Card>
      <CardHeader title={debt.name} subtitle={`${formatCurrency(debt.principal)} remaining principal`} />

      <div className="mb-5">
        <div className="mb-1 flex items-baseline justify-between text-sm">
          <span className="text-text-muted">Current pace vs. target window</span>
          <span className="tabular text-text">
            {debtTrajectory.monthsAtCurrentPace} of {debtTrajectory.monthsAvailableToTarget} mo
          </span>
        </div>
        <ProgressBar
          value={debtTrajectory.monthsAtCurrentPace}
          max={debtTrajectory.monthsAvailableToTarget}
          colorClass="bg-positive"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-text-muted">Projected payoff</p>
          <p className="mt-1 tabular text-text">{formatDateLong(debtTrajectory.projectedPayoffDate)}</p>
          <p className="text-xs text-text-muted">at current pace ({debtTrajectory.monthsAtCurrentPace} mo)</p>
        </div>
        <div>
          <p className="text-text-muted">Target</p>
          <p className="mt-1 tabular text-text">{formatDateLong(debt.targetPayoffDate)}</p>
          <p className="text-xs text-text-muted">{debtTrajectory.monthsAvailableToTarget} months available</p>
        </div>
      </div>

      <div
        className={
          'mt-5 rounded-xl px-4 py-3 text-sm ' +
          (debtTrajectory.onTrack ? 'bg-positive/10 text-positive' : 'bg-warning/10 text-warning')
        }
      >
        {debtTrajectory.onTrack ? (
          <>On track to clear before {formatDateLong(debt.targetPayoffDate)} at the current payment.</>
        ) : (
          <>
            Behind target — pay <strong className="tabular">{formatCurrency(debtTrajectory.requiredMonthlyPayment)}</strong>{' '}
            /month (an extra <strong className="tabular">{formatCurrency(debtTrajectory.extraMonthlyDelta)}</strong>) to
            clear by {formatDateLong(debt.targetPayoffDate)}.
          </>
        )}
      </div>

      <p className="mt-3 text-xs text-text-muted">
        Simplified model: assumes each payment reduces principal 1:1 (no interest breakdown supplied).
      </p>
    </Card>
  )
}
