import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Delete, ScanFace } from 'lucide-react'
import {
  attemptPin,
  biometricName,
  isLockEnabled,
  lockoutSecondsLeft,
  unlockWithBiometric,
  useLockConfig,
} from '../lib/lock'

const GRACE_MS = 60_000
const MAX_PIN = 8

type GateState = 'unlocked' | 'covered' | 'locked'

function LockScreen({ covered, hasBiometric, onUnlock }: { covered: boolean; hasBiometric: boolean; onUnlock: () => void }) {
  const [pin, setPin] = useState('')
  const [message, setMessage] = useState('')
  const [wait, setWait] = useState(() => lockoutSecondsLeft())
  const busy = useRef(false)

  useEffect(() => {
    if (wait <= 0) return
    const id = setInterval(() => {
      const left = lockoutSecondsLeft()
      setWait(left)
      if (left <= 0) setMessage('')
    }, 1000)
    return () => clearInterval(id)
  }, [wait])

  const tryBiometric = useCallback(async () => {
    if (await unlockWithBiometric()) onUnlock()
  }, [onUnlock])

  useEffect(() => {
    if (!covered && hasBiometric) void tryBiometric()
  }, [covered, hasBiometric, tryBiometric])

  const submit = useCallback(
    async (value: string) => {
      if (busy.current || value.length < 4) return
      busy.current = true
      const result = await attemptPin(value)
      busy.current = false
      if (result.ok) {
        onUnlock()
        return
      }
      setPin('')
      setWait(result.waitSeconds)
      setMessage(result.waitSeconds > 0 ? 'Too many tries.' : 'Wrong PIN. Try again.')
    },
    [onUnlock],
  )

  const press = useCallback(
    (digit: string) => {
      if (wait > 0) return
      setMessage('')
      setPin((p) => (p.length < MAX_PIN ? p + digit : p))
    },
    [wait],
  )

  useEffect(() => {
    if (covered) return
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') setPin((p) => p.slice(0, -1))
      else if (e.key === 'Enter') void submit(pin)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [covered, press, submit, pin])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg px-6">
      <p className="text-xs font-medium uppercase tracking-widest text-text-muted">Zero-Based Net Liquidity</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">True Cash</h1>

      {!covered && (
        <>
          <div className="mt-8 flex h-4 items-center gap-3" aria-label="PIN entry">
            {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
              <span
                key={i}
                className={'h-3 w-3 rounded-full border border-text-muted ' + (i < pin.length ? 'bg-text' : '')}
              />
            ))}
          </div>
          <p className="mt-4 h-5 text-sm text-negative">
            {wait > 0 ? `${message} Wait ${wait}s.` : message}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button
                key={d}
                type="button"
                disabled={wait > 0}
                onClick={() => press(d)}
                className="h-16 w-16 rounded-full bg-surface-raised text-xl font-medium text-text transition-colors active:bg-border disabled:opacity-40"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              disabled={!hasBiometric}
              onClick={() => void tryBiometric()}
              aria-label={`Unlock with ${biometricName()}`}
              className="flex h-16 w-16 items-center justify-center rounded-full text-text-muted disabled:opacity-0"
            >
              <ScanFace size={26} />
            </button>
            <button
              type="button"
              disabled={wait > 0}
              onClick={() => press('0')}
              className="h-16 w-16 rounded-full bg-surface-raised text-xl font-medium text-text transition-colors active:bg-border disabled:opacity-40"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setPin((p) => p.slice(0, -1))}
              aria-label="Delete digit"
              className="flex h-16 w-16 items-center justify-center rounded-full text-text-muted"
            >
              <Delete size={24} />
            </button>
          </div>

          <button
            type="button"
            disabled={wait > 0 || pin.length < 4}
            onClick={() => void submit(pin)}
            className="mt-6 w-52 rounded-xl bg-accent py-3 text-sm font-medium text-bg transition-colors hover:brightness-110 disabled:opacity-40"
          >
            Unlock
          </button>
        </>
      )}
    </div>
  )
}

export function LockGate({ children }: { children: ReactNode }) {
  const config = useLockConfig()
  const enabled = config !== null
  const [state, setState] = useState<GateState>(() => (isLockEnabled() ? 'locked' : 'unlocked'))
  const hiddenAt = useRef<number | null>(null)

  useEffect(() => {
    const onHide = () => {
      if (hiddenAt.current === null) hiddenAt.current = Date.now()
      setState((s) => (s === 'unlocked' ? 'covered' : s))
    }
    const onShow = () => {
      const away = hiddenAt.current === null ? 0 : Date.now() - hiddenAt.current
      hiddenAt.current = null
      setState((s) => (s === 'covered' ? (away > GRACE_MS ? 'locked' : 'unlocked') : s))
    }
    const onVisibility = () => (document.hidden ? onHide() : onShow())
    const onLockNow = () => setState('locked')

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onHide)
    window.addEventListener('pageshow', onShow)
    window.addEventListener('true-cash:lock', onLockNow)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onHide)
      window.removeEventListener('pageshow', onShow)
      window.removeEventListener('true-cash:lock', onLockNow)
    }
  }, [])

  const locked = enabled && state !== 'unlocked'

  return (
    <>
      <div style={{ visibility: locked ? 'hidden' : 'visible' }} aria-hidden={locked}>
        {children}
      </div>
      {locked && (
        <LockScreen
          covered={state === 'covered'}
          hasBiometric={!!config?.credentialId}
          onUnlock={() => setState('unlocked')}
        />
      )}
    </>
  )
}
