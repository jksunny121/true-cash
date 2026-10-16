import type { LedgerEntry } from '../types'

// Generic sample data only. Real figures are loaded on-device via the Data tab.
// Outflows are positive, Income is negative — the projection engine relies on this.
type Raw = Omit<LedgerEntry, 'id' | 'isPaid'>

const MONTHS: Array<{ key: string; lastDay: number; salaryDay: number | null }> = [
  { key: '2026-10', lastDay: 31, salaryDay: 29 },
  { key: '2026-11', lastDay: 30, salaryDay: 26 },
  { key: '2026-12', lastDay: 31, salaryDay: 30 },
  { key: '2027-01', lastDay: 31, salaryDay: null },
]

const day = (month: string, d: number) => `${month}-${String(d).padStart(2, '0')}`

const raw: Raw[] = MONTHS.flatMap(({ key, lastDay, salaryDay }) => {
  const entries: Raw[] = [
    { date: day(key, 1), bucket: 'Fixed', desc: 'Rent', amount: 500 },
    { date: day(key, 5), bucket: 'Fixed', desc: 'Council Tax', amount: 100 },
    { date: day(key, 5), bucket: 'Variable', desc: 'Utilities', amount: 100 },
    { date: day(key, 12), bucket: 'Fixed', desc: 'Subscription', amount: 10 },
    { date: day(key, 15), bucket: 'Variable', desc: 'Unplanned Spend', amount: 0 },
    { date: day(key, 15), bucket: 'Buffer', desc: 'Unplanned Spend', amount: 0 },
    { date: day(key, 22), bucket: 'Fixed', desc: 'Transport Pass', amount: 50 },
    { date: day(key, 25), bucket: 'Fixed', desc: 'Family Transfer', amount: 0 },
    { date: day(key, 26), bucket: 'Fixed', desc: 'Phone', amount: 20 },
    { date: day(key, 28), bucket: 'Fixed', desc: 'Loan Payment', amount: 300 },
    { date: day(key, lastDay), bucket: 'Variable', desc: 'Household & Personal', amount: 100 },
  ]
  ;[4, 11, 18, 25].forEach((d, i) => {
    entries.push({ date: day(key, d), bucket: 'Variable', desc: `Food (weekly) ${i + 1}/4`, amount: 80 })
    entries.push({ date: day(key, d), bucket: 'Buffer', desc: `Buffer (weekly) ${i + 1}/4`, amount: 25 })
  })
  if (salaryDay) entries.push({ date: day(key, salaryDay), bucket: 'Income', desc: 'Salary', amount: -2000 })
  return entries
})

export const SEED_LEDGER: LedgerEntry[] = raw.map((entry, i) => ({
  ...entry,
  id: `seed-${i}-${entry.date}`,
  isPaid: false,
}))

export const PROJECTION_END_DATE = '2027-01-31'
