import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { useStore } from '../store/useStore'
import { formatDateLong } from '../lib/format'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTrigger } from './ui/Dialog'
import { Button } from './ui/Button'
import type { LedgerEntry } from '../types'

const isDateKey = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))

export function EditEntryDialog({ entry }: { entry: LedgerEntry }) {
  const updateEntry = useStore((s) => s.updateEntry)
  const deleteEntry = useStore((s) => s.deleteEntry)
  const endDate = useStore((s) => s.projectionEndDate)
  const isIncome = entry.bucket === 'Income'
  // Income is stored negative so the projection maths stays uniform; show it as a normal positive figure.
  const shownAmount = Math.abs(entry.amount)

  const [open, setOpen] = useState(false)
  const [desc, setDesc] = useState(entry.desc)
  const [amount, setAmount] = useState(shownAmount.toFixed(2))
  const [date, setDate] = useState(entry.date)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (open) {
      setDesc(entry.desc)
      setAmount(shownAmount.toFixed(2))
      setDate(entry.date)
      setConfirmDelete(false)
    }
  }, [open, entry.desc, entry.date, shownAmount])

  const parsedAmount = Number(amount)
  const dateOk = isDateKey(date) && date <= endDate
  const canSubmit = desc.trim() !== '' && amount.trim() !== '' && Number.isFinite(parsedAmount) && parsedAmount >= 0 && dateOk

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    updateEntry(entry.id, {
      desc: desc.trim(),
      amount: isIncome ? -parsedAmount : parsedAmount,
      date,
    })
    setOpen(false)
  }

  const handleDelete = () => {
    deleteEntry(entry.id)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Edit ${entry.desc}`}
          className="shrink-0 rounded-lg p-1 text-text-muted transition-colors hover:bg-surface hover:text-text"
        >
          <Pencil size={14} />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader
          title="Edit Entry"
          description={
            entry.isPaid
              ? 'Already marked paid. Changing the amount adjusts your cash by the difference.'
              : 'Change the date or the real amount if it differs from the plan.'
          }
        />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Description</span>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-muted">{isIncome ? 'Amount received' : 'Amount'}</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                  £
                </span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  className="w-full rounded-xl border border-border bg-surface-raised py-2 pl-7 pr-3 text-sm tabular text-text focus:border-accent focus:outline-none"
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
          {!dateOk && (
            <p className="-mt-2 text-xs text-negative">Pick a date up to {formatDateLong(endDate)}.</p>
          )}

          {confirmDelete ? (
            <div className="rounded-xl border border-negative/40 bg-negative/10 px-3 py-2 text-xs text-negative">
              <p>
                Delete this entry?
                {entry.isPaid ? ' Its amount will be added back to your cash.' : ''}
              </p>
              <div className="mt-2 flex gap-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setConfirmDelete(false)}>
                  Keep it
                </Button>
                <Button type="button" variant="danger" className="flex-1" onClick={handleDelete}>
                  Yes, delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-1 flex items-center justify-between gap-2">
              <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={!canSubmit}>
                  Save
                </Button>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
