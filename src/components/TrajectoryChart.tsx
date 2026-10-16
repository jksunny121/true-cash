import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFinance } from '../lib/useFinance'
import { formatCurrency, formatDateLong, formatDateShort } from '../lib/format'
import { Card, CardHeader } from './ui/Card'

export function TrajectoryChart() {
  const { dailyProjection, overallLowest, neverHitsZero } = useFinance()

  return (
    <div className="flex flex-col gap-6">
      {!neverHitsZero && (
        <div className="rounded-2xl border border-negative/40 bg-negative/10 px-4 py-3 text-sm text-negative">
          Projection dips to or below £0
          {overallLowest ? ` on ${formatDateLong(overallLowest.date)} (${formatCurrency(overallLowest.balance)})` : ''}
          . Adjust spend or mark bills paid to restore the cushion.
        </div>
      )}

      <Card>
        <CardHeader
          title="Trajectory to 31 Jan 2027"
          subtitle="Daily projected True Cash — must stay strictly above £0"
        />
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyProjection} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="trajectoryFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateShort}
                interval="preserveStartEnd"
                minTickGap={40}
                stroke="var(--color-border)"
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              />
              <YAxis
                tickFormatter={(v: number) => formatCurrency(v)}
                width={80}
                stroke="var(--color-border)"
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              />
              <Tooltip
                formatter={(v) => formatCurrency(Number(v))}
                labelFormatter={(l) => formatDateLong(String(l))}
                contentStyle={{
                  background: 'var(--color-surface-raised)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  color: 'var(--color-text)',
                }}
              />
              <ReferenceLine y={0} stroke="var(--color-negative)" strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="var(--color-accent)"
                strokeWidth={2}
                fill="url(#trajectoryFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
