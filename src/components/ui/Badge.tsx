import clsx from 'clsx'
import type { BucketType } from '../../types'

const BUCKET_STYLES: Record<BucketType, string> = {
  Fixed: 'bg-fixed/15 text-fixed',
  Variable: 'bg-variable/15 text-variable',
  Buffer: 'bg-buffer/15 text-buffer',
  Income: 'bg-income/15 text-income',
}

export function BucketBadge({ bucket, className }: { bucket: BucketType; className?: string }) {
  return (
    <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-medium', BUCKET_STYLES[bucket], className)}>
      {bucket}
    </span>
  )
}
