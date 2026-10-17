import { useState } from 'react'
import { addMonths, format, parseISO } from 'date-fns'
import { Plus } from 'lucide-react'
import { useStore } from '../store/useStore'
import { todayKey } from '../lib/engine'
import { formatDateLong } from '../lib/format'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTrigger } from './ui/Dialog'
import { Button } from './ui/Button'
import type { BucketType } from '../types'

const TYPES: { value: BucketType; label: string; active: string }[] = [
  { value: 'Fixed', label: 'Fixed', active: 'border-fixed bg-fixed/15 text-fixed' },
  { value: 'Variable', label: 'Variable', active: 'border-variable bg-variable/15 text-variable' },
  { value: 'Buffer', label: 'Buffer', active: 'border-buffer bg-buffer/15 text-buffer' },
  { value: 'Income', label: 'Income', active: 'border-income bg-income/15 text-income' },
]

const isDateKey = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))

export function AddEntryDialog() {
  const addEntries = useStore((s) => s.addEntries)
  const endDate = useStore((s) => s.projectionEndDate)

  const [open, setOpen] = useState(false)
  const [bucket, setBucket] = useState<BucketType>('Fixed')
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayKey())
  const [repeat, setRepeat] = useState(false)

  const reset = () => {
    setBucket('Fixed')
    setDesc('')
    setAmount('')
    setDate(todayKey())
    setRepeat(false)
  }

  const parsedAmount = Number(amount)
  const dateOk = isDateKey(date) && date <= endDate
  const canSubmit = desc.trim() !== '' && amount.trim() !== '' && Number.isFinite(parsedAmount) && parsedAmount >= 0 && dateOk

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const signed = bucket === 'Income' ? -parsedAmount : parsedAmount
    const dates = [date]
    if (repeat) {
      const base = parseISO(date)
      for (let i = 1; i < 60; i++) {
        const next = format(addMonths(base, i), 'yyyy-MM-dd')
        if (next > endDate) break
        dates.push(next)
      }
    }
    addEntries(dates.map((d) => ({ date: d, bucket, desc: desc.trim(), amount: signed })))
    reset()
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) reset()
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-border"
        >
          <Plus size={14} />
          Add item
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader
          title="Add Item"
          description="A new bill, spend or income. It starts unpaid; mark it paid once it clears."
        />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setBucket(t.value)}
                className={
                  'rounded-xl border px-2 py-2 text-xs font-medium transition-colors ' +
                  (bucket === t.value
                    ? t.active
                    : 'border-border bg-surface-raised text-text-muted hover:text-text')
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Description</span>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Gym membership"
              className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-muted">{bucket === 'Income' ? 'Amount received' : 'Amount'}</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                  £
                </span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-border bg-surface-raised py-2 pl-7 pr-3 text-sm tabular text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-muted">Date</span>
              <input
                type="date"
                value={date}
                max={endDate}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-text [color-scheme:dark] focus:border-accent focus:outline-none"
              />
            </label>
          </div>
          {!dateOk && <p className="-mt-2 text-xs text-negative">Pick a date up to {formatDateLong(endDate)}.</p>}
          <label className="flex cursor-pointer items-center gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={repeat}
              onChange={(e) => setRepeat(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            Repeat every month until {formatDateLong(endDate)}
          </label>
          <div className="mt-1 flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!canSubmit}>
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
