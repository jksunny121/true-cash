import { useMemo } from 'react'
import { addDays, format } from 'date-fns'
import { useStore } from '../store/useStore'
import {
  buildDailyProjection,
  computeDebtTrajectory,
  creditUtilization,
  lowestInWindow,
  safeToSpendToday,
  todayKey,
  trueCashNow,
  upcomingInWindow,
} from './engine'

const RADAR_WINDOW_DAYS = 30

export function useFinance() {
  const account = useStore((s) => s.account)
  const debt = useStore((s) => s.debt)
  const ledger = useStore((s) => s.ledger)
  const projectionEndDate = useStore((s) => s.projectionEndDate)

  return useMemo(() => {
    const today = new Date()
    const todayStr = todayKey(today)
    const radarEnd = format(addDays(today, RADAR_WINDOW_DAYS), 'yyyy-MM-dd')

    const trueCash = trueCashNow(account)
    const safeToSpend = safeToSpendToday(account, ledger, today)
    const util = creditUtilization(account)

    const dailyProjection = buildDailyProjection(account, ledger, todayStr, projectionEndDate)
    const radarLowest = lowestInWindow(dailyProjection, todayStr, radarEnd)
    const overallLowest = lowestInWindow(dailyProjection, todayStr, projectionEndDate)
    const upcoming30 = upcomingInWindow(ledger, todayStr, radarEnd)

    const debtTrajectory = computeDebtTrajectory(debt.principal, debt.monthlyPayment, debt.targetPayoffDate, today)

    return {
      today,
      todayStr,
      radarEnd,
      account,
      debt,
      ledger,
      trueCash,
      safeToSpend,
      creditUtil: util,
      creditWarning: util > 0.3,
      dailyProjection,
      radarLowest,
      overallLowest,
      neverHitsZero: overallLowest ? overallLowest.balance > 0 : true,
      upcoming30,
      debtTrajectory,
    }
  }, [account, debt, ledger, projectionEndDate])
}
