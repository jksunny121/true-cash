export type BucketType = 'Fixed' | 'Variable' | 'Buffer' | 'Income'

export interface LedgerEntry {
  id: string
  date: string // YYYY-MM-DD
  bucket: BucketType
  desc: string
  /** Outflows are positive, inflows (Income) are negative. */
  amount: number
  isPaid: boolean
  /** true for entries added via the rapid-entry form rather than the seed forecast. */
  logged?: boolean
}

export interface MonthlyTargets {
  Variable: number
  Buffer: number
}

export interface AccountState {
  liquidCash: number
  creditCardBalance: number
  creditCardLimit: number
  monthlyTargets: MonthlyTargets
}

export interface DebtState {
  name: string
  principal: number
  monthlyPayment: number
  targetPayoffDate: string // YYYY-MM-DD
}
