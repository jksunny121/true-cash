import * as ProgressPrimitive from '@radix-ui/react-progress'
import clsx from 'clsx'

export function ProgressBar({
  value,
  max,
  colorClass = 'bg-accent',
}: {
  value: number
  max: number
  colorClass?: string
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const overBudget = value > max

  return (
    <ProgressPrimitive.Root className="relative h-2 w-full overflow-hidden rounded-full bg-surface-raised">
      <ProgressPrimitive.Indicator
        className={clsx('h-full rounded-full transition-all', overBudget ? 'bg-negative' : colorClass)}
        style={{ width: `${pct}%` }}
      />
    </ProgressPrimitive.Root>
  )
}
