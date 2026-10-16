import {
  addMonths,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  parseISO,
} from 'date-fns'
import type { AccountState, BucketType, LedgerEntry } from '../types'

/**
 * Sign convention (fixed at the data layer, never branched on here):
 * outflows are positive amounts, Income is negative. Every balance walk is
 * therefore just `balance -= entry.amount` regardless of bucket.
 */

export const todayKey = (d: Date = new Date()) => format(d, 'yyyy-MM-dd')

export function trueCashNow(account: AccountState): number {
  return account.liquidCash - account.creditCardBalance
}

export function creditUtilization(account: AccountState): number {
  if (account.creditCardLimit <= 0) return 0
  return account.creditCardBalance / account.creditCardLimit
}

/** Unpaid entries strictly after `fromKeyExclusive`, up to and including `toKeyInclusive`. */
function unpaidBetween(ledger: LedgerEntry[], fromKeyExclusive: string, toKeyInclusive: string) {
  return ledger.filter((e) => !e.isPaid && e.date > fromKeyExclusive && e.date <= toKeyInclusive)
}

export function projectedBalanceOn(
  account: AccountState,
  ledger: LedgerEntry[],
  fromKeyStr: string,
  targetDateKey: string,
): number {
  const base = trueCashNow(account)
  if (targetDateKey <= fromKeyStr) return base
  const delta = unpaidBetween(ledger, fromKeyStr, targetDateKey).reduce((sum, e) => sum + e.amount, 0)
  return base - delta
}

export interface ProjectionPoint {
  date: string
  balance: number
}

export function buildDailyProjection(
  account: AccountState,
  ledger: LedgerEntry[],
  fromKeyStr: string,
  endDateKey: string,
): ProjectionPoint[] {
  const start = parseISO(fromKeyStr)
  const end = parseISO(endDateKey)
  if (isAfter(start, end)) return []

  const days = eachDayOfInterval({ start, end })
  const sortedUnpaid = unpaidBetween(ledger, fromKeyStr, endDateKey).sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  )

  let running = trueCashNow(account)
  let idx = 0
  const points: ProjectionPoint[] = []
  for (const day of days) {
    const key = format(day, 'yyyy-MM-dd')
    while (idx < sortedUnpaid.length && sortedUnpaid[idx].date === key) {
      running -= sortedUnpaid[idx].amount
      idx++
    }
    points.push({ date: key, balance: running })
  }
  return points
}

export function lowestInWindow(points: ProjectionPoint[], startKey: string, endKey: string): ProjectionPoint | null {
  const within = points.filter((p) => p.date >= startKey && p.date <= endKey)
  if (within.length === 0) return null
  return within.reduce((min, p) => (p.balance < min.balance ? p : min), within[0])
}

export function upcomingInWindow(ledger: LedgerEntry[], fromKeyExclusive: string, toKeyInclusive: string): LedgerEntry[] {
  return unpaidBetween(ledger, fromKeyExclusive, toKeyInclusive).sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  )
}

export function monthKeyOf(dateStr: string): string {
  return dateStr.slice(0, 7)
}

export function sumBucketForMonth(
  ledger: LedgerEntry[],
  bucket: BucketType,
  monthKey: string,
  opts?: { onlyPaid?: boolean },
): number {
  return ledger
    .filter((e) => e.bucket === bucket && monthKeyOf(e.date) === monthKey && (!opts?.onlyPaid || e.isPaid))
    .reduce((sum, e) => sum + e.amount, 0)
}

export function safeToSpendToday(account: AccountState, ledger: LedgerEntry[], today: Date): number {
  const mKey = format(today, 'yyyy-MM')
  const spent = sumBucketForMonth(ledger, 'Buffer', mKey, { onlyPaid: true })
  const remaining = account.monthlyTargets.Buffer - spent
  const daysLeftInMonth = differenceInCalendarDays(endOfMonth(today), today) + 1
  if (daysLeftInMonth <= 0) return Math.max(0, remaining)
  return Math.max(0, remaining / daysLeftInMonth)
}

export interface DebtTrajectory {
  monthsAtCurrentPace: number
  projectedPayoffDate: string
  monthsAvailableToTarget: number
  onTrack: boolean
  requiredMonthlyPayment: number
  extraMonthlyDelta: number
}

export function computeDebtTrajectory(
  principal: number,
  monthlyPayment: number,
  targetDateKey: string,
  today: Date,
): DebtTrajectory {
  const monthsAtCurrentPace = Math.max(1, Math.ceil(principal / monthlyPayment))
  const payoffDate = addMonths(today, monthsAtCurrentPace)
  const target = parseISO(targetDateKey)
  const monthsAvailable = Math.max(1, differenceInCalendarMonths(target, today) + 1)
  const requiredMonthlyPayment = principal / monthsAvailable
  const onTrack = monthsAtCurrentPace <= monthsAvailable
  const extraMonthlyDelta = onTrack ? 0 : requiredMonthlyPayment - monthlyPayment

  return {
    monthsAtCurrentPace,
    projectedPayoffDate: format(payoffDate, 'yyyy-MM-dd'),
    monthsAvailableToTarget: monthsAvailable,
    onTrack,
    requiredMonthlyPayment,
    extraMonthlyDelta,
  }
}
