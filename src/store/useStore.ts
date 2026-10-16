import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { SEED_LEDGER, PROJECTION_END_DATE } from '../data/seedLedger'
import { todayKey } from '../lib/engine'
import type { AccountState, DebtState, LedgerEntry } from '../types'

interface StoreState {
  account: AccountState
  debt: DebtState
  ledger: LedgerEntry[]
  projectionEndDate: string

  toggleEntryPaid: (id: string) => void
  updateEntry: (id: string, updates: { desc?: string; amount?: number }) => void
  logSpend: (entry: { bucket: 'Variable' | 'Buffer'; desc: string; amount: number; date?: string }) => void
  deleteLoggedEntry: (id: string) => void
  setLiquidCash: (value: number) => void
  setCreditCardBalance: (value: number) => void
  exportData: () => string
  importData: (raw: string) => string | null
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isDateKey = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const BUCKETS = ['Fixed', 'Variable', 'Buffer', 'Income']

const initialAccount: AccountState = {
  liquidCash: 5000.0,
  creditCardBalance: 0,
  creditCardLimit: 1000.0,
  monthlyTargets: { Variable: 600.0, Buffer: 150.0 },
}

const initialDebt: DebtState = {
  name: 'Loan',
  principal: 4500.0,
  monthlyPayment: 300.0,
  targetPayoffDate: '2027-12-31',
}

let idCounter = 0
const nextId = () => `logged-${Date.now()}-${idCounter++}`

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      account: initialAccount,
      debt: initialDebt,
      ledger: SEED_LEDGER,
      projectionEndDate: PROJECTION_END_DATE,

      toggleEntryPaid: (id) => {
        const entry = get().ledger.find((e) => e.id === id)
        if (!entry) return
        const nowPaid = !entry.isPaid
        // Marking paid bakes the entry's effect into liquidCash and removes it
        // from the forward projection; un-marking reverses that.
        const sign = nowPaid ? -1 : 1
        set((state) => ({
          ledger: state.ledger.map((e) => (e.id === id ? { ...e, isPaid: nowPaid } : e)),
          account: { ...state.account, liquidCash: state.account.liquidCash + sign * entry.amount },
        }))
      },

      updateEntry: (id, updates) => {
        const entry = get().ledger.find((e) => e.id === id)
        if (!entry) return
        const nextAmount = updates.amount ?? entry.amount
        // If already paid, its old amount is already baked into liquidCash —
        // apply just the difference so the actual isn't double-counted.
        const liquidCashDelta = entry.isPaid ? entry.amount - nextAmount : 0
        set((state) => ({
          ledger: state.ledger.map((e) =>
            e.id === id ? { ...e, desc: updates.desc ?? e.desc, amount: nextAmount } : e,
          ),
          account: { ...state.account, liquidCash: state.account.liquidCash + liquidCashDelta },
        }))
      },

      logSpend: ({ bucket, desc, amount, date }) => {
        const entry: LedgerEntry = {
          id: nextId(),
          date: date ?? todayKey(),
          bucket,
          desc,
          amount,
          isPaid: true,
          logged: true,
        }
        set((state) => ({
          ledger: [...state.ledger, entry],
          account: { ...state.account, liquidCash: state.account.liquidCash - amount },
        }))
      },

      deleteLoggedEntry: (id) => {
        const entry = get().ledger.find((e) => e.id === id && e.logged)
        if (!entry) return
        set((state) => ({
          ledger: state.ledger.filter((e) => e.id !== id),
          account: { ...state.account, liquidCash: state.account.liquidCash + entry.amount },
        }))
      },

      exportData: () => {
        const { account, debt, ledger } = get()
        return JSON.stringify({ app: 'true-cash', version: 1, account, debt, ledger }, null, 2)
      },

      importData: (raw) => {
        let data: any
        try {
          data = JSON.parse(raw)
        } catch {
          return 'That is not valid data. Paste the full contents of the file.'
        }
        const a = data?.account
        const d = data?.debt
        const l = data?.ledger
        const accountOk =
          a &&
          isNum(a.liquidCash) &&
          isNum(a.creditCardBalance) &&
          isNum(a.creditCardLimit) &&
          isNum(a.monthlyTargets?.Variable) &&
          isNum(a.monthlyTargets?.Buffer)
        const debtOk =
          d &&
          typeof d.name === 'string' &&
          isNum(d.principal) &&
          isNum(d.monthlyPayment) &&
          isDateKey(d.targetPayoffDate)
        const ledgerOk =
          Array.isArray(l) &&
          l.length > 0 &&
          l.every(
            (e: any) =>
              typeof e?.id === 'string' &&
              isDateKey(e.date) &&
              BUCKETS.includes(e.bucket) &&
              typeof e.desc === 'string' &&
              isNum(e.amount) &&
              typeof e.isPaid === 'boolean',
          )
        if (data?.app !== 'true-cash' || !accountOk || !debtOk || !ledgerOk) {
          return 'This does not look like True Cash data, so nothing was changed.'
        }
        set({ account: a, debt: d, ledger: l })
        return null
      },

      setLiquidCash: (value) => set((state) => ({ account: { ...state.account, liquidCash: value } })),
      setCreditCardBalance: (value) =>
        set((state) => ({ account: { ...state.account, creditCardBalance: value } })),
    }),
    {
      name: 'true-cash-store',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)
