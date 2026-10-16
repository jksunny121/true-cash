import { parseISO, format } from 'date-fns'

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })
const gbpSigned = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  signDisplay: 'always',
})

export function formatCurrency(n: number): string {
  return gbp.format(n)
}

export function formatCurrencySigned(n: number): string {
  return gbpSigned.format(n)
}

export function formatDateLong(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM yyyy')
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM')
}

export function formatMonthLabel(monthKey: string): string {
  return format(parseISO(`${monthKey}-01`), 'MMMM yyyy')
}
