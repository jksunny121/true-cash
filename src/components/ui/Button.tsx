import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        'rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'primary' && 'bg-accent text-bg hover:brightness-110',
        variant === 'ghost' && 'bg-surface-raised text-text hover:bg-border',
        variant === 'danger' && 'bg-negative/15 text-negative hover:bg-negative/25',
        className,
      )}
      {...props}
    />
  )
}
