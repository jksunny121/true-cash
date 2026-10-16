import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTrigger } from './ui/Dialog'
import { Button } from './ui/Button'
import type { LedgerEntry } from '../types'

export function EditEntryDialog({ entry }: { entry: LedgerEntry }) {
  const updateEntry = useStore((s) => s.updateEntry)
  const [open, setOpen] = useState(false)
  const [desc, setDesc] = useState(entry.desc)
  const [amount, setAmount] = useState(entry.amount.toFixed(2))

  useEffect(() => {
    if (open) {
      setDesc(entry.desc)
      setAmount(entry.amount.toFixed(2))
    }
  }, [open, entry.desc, entry.amount])

  const parsedAmount = Number(amount)
  const canSubmit = desc.trim() !== '' && Number.isFinite(parsedAmount) && parsedAmount >= 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    updateEntry(entry.id, { desc: desc.trim(), amount: parsedAmount })
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
        <DialogHeader title="Edit Entry" description="Log the actual amount if it differed from the plan." />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Description</span>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              autoFocus
              className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Amount</span>
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
          <div className="mt-1 flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!canSubmit}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
