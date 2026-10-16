import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTrigger } from './ui/Dialog'
import { Button } from './ui/Button'

export function ReconcileBalancesModal() {
  const account = useStore((s) => s.account)
  const setLiquidCash = useStore((s) => s.setLiquidCash)
  const setCreditCardBalance = useStore((s) => s.setCreditCardBalance)

  const [open, setOpen] = useState(false)
  const [liquidCash, setLiquidCashInput] = useState('')
  const [creditCardBalance, setCreditCardBalanceInput] = useState('')

  // Re-sync the form with the live store values every time the dialog opens.
  useEffect(() => {
    if (open) {
      setLiquidCashInput(account.liquidCash.toFixed(2))
      setCreditCardBalanceInput(account.creditCardBalance.toFixed(2))
    }
  }, [open, account.liquidCash, account.creditCardBalance])

  const parsedLiquidCash = Number(liquidCash)
  const parsedCreditCardBalance = Number(creditCardBalance)
  const canSubmit =
    liquidCash.trim() !== '' &&
    creditCardBalance.trim() !== '' &&
    Number.isFinite(parsedLiquidCash) &&
    Number.isFinite(parsedCreditCardBalance)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLiquidCash(parsedLiquidCash)
    setCreditCardBalance(parsedCreditCardBalance)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="shrink-0 rounded-lg border border-border bg-surface-raised px-2.5 py-1 text-xs font-medium text-text-muted transition-colors hover:text-text">
          Reconcile
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader
          title="Reconcile Balances"
          description="Overwrite with the real numbers from your bank and card statements."
        />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Liquid Cash</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                £
              </span>
              <input
                value={liquidCash}
                onChange={(e) => setLiquidCashInput(e.target.value)}
                inputMode="decimal"
                autoFocus
                className="w-full rounded-xl border border-border bg-surface-raised py-2 pl-7 pr-3 text-sm tabular text-text focus:border-accent focus:outline-none"
              />
            </div>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">Credit Card Balance</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                £
              </span>
              <input
                value={creditCardBalance}
                onChange={(e) => setCreditCardBalanceInput(e.target.value)}
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
