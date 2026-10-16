import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Button } from './ui/Button'
import type { BucketType } from '../types'

const BUCKETS: Extract<BucketType, 'Variable' | 'Buffer'>[] = ['Variable', 'Buffer']

export function RapidEntryForm() {
  const logSpend = useStore((s) => s.logSpend)
  const [bucket, setBucket] = useState<'Variable' | 'Buffer'>('Buffer')
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')

  const parsedAmount = Number(amount)
  const canSubmit = desc.trim().length > 0 && Number.isFinite(parsedAmount) && parsedAmount > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    logSpend({ bucket, desc: desc.trim(), amount: parsedAmount })
    setDesc('')
    setAmount('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        {BUCKETS.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBucket(b)}
            className={
              'flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ' +
              (bucket === b
                ? b === 'Buffer'
                  ? 'border-buffer bg-buffer/15 text-buffer'
                  : 'border-variable bg-variable/15 text-variable'
                : 'border-border bg-surface-raised text-text-muted hover:text-text')
            }
          >
            {b}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="What was it?"
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
        <div className="relative w-28 shrink-0">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
            £
          </span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className="w-full rounded-xl border border-border bg-surface-raised py-2 pl-6 pr-3 text-sm tabular text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      <Button type="submit" disabled={!canSubmit}>
        Log {bucket} spend
      </Button>
    </form>
  )
}
