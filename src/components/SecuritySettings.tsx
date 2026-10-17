import { useEffect, useState } from 'react'
import {
  attemptPin,
  biometricName,
  biometricSupported,
  isValidPin,
  registerBiometric,
  removeBiometric,
  removeLock,
  setPin,
  useLockConfig,
} from '../lib/lock'
import { Card, CardHeader } from './ui/Card'
import { Button } from './ui/Button'

type Mode = 'idle' | 'enable' | 'change' | 'disable'

const pinInputClass =
  'w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-center text-lg tracking-[0.4em] text-text focus:border-accent focus:outline-none'

function PinField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={8}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        className={pinInputClass}
      />
    </label>
  )
}

export function SecuritySettings() {
  const config = useLockConfig()
  const enabled = config !== null
  const hasBiometric = !!config?.credentialId
  const bio = biometricName()

  const [canBiometric, setCanBiometric] = useState(false)
  const [mode, setMode] = useState<Mode>('idle')
  const [current, setCurrent] = useState('')
  const [pin1, setPin1] = useState('')
  const [pin2, setPin2] = useState('')
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    void biometricSupported().then(setCanBiometric)
  }, [])

  const close = () => {
    setMode('idle')
    setCurrent('')
    setPin1('')
    setPin2('')
  }

  const checkCurrent = async () => {
    const result = await attemptPin(current)
    if (result.ok) return true
    setMessage({
      kind: 'error',
      text: result.waitSeconds > 0 ? `Too many tries. Wait ${result.waitSeconds}s.` : 'Current PIN is wrong.',
    })
    return false
  }

  const needsCurrent = mode === 'change' || mode === 'disable'
  const needsNew = mode === 'enable' || mode === 'change'
  const newOk = !needsNew || (isValidPin(pin1) && pin1 === pin2)
  const currentOk = !needsCurrent || current.length >= 4
  const canSubmit = newOk && currentOk && mode !== 'idle'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!canSubmit) return
    if (needsCurrent && !(await checkCurrent())) return
    if (mode === 'disable') {
      removeLock()
      setMessage({ kind: 'ok', text: 'App lock is off.' })
    } else {
      await setPin(pin1)
      setMessage({
        kind: 'ok',
        text: mode === 'enable' ? 'App lock is on. It locks when you leave the app.' : 'PIN changed.',
      })
    }
    close()
  }

  const toggleBiometric = async () => {
    setMessage(null)
    if (hasBiometric) {
      removeBiometric()
      setMessage({ kind: 'ok', text: `${bio} turned off. The PIN still works.` })
      return
    }
    const error = await registerBiometric()
    setMessage(error ? { kind: 'error', text: error } : { kind: 'ok', text: `${bio} is on.` })
  }

  return (
    <Card>
      <CardHeader
        title="App Lock"
        subtitle={
          enabled
            ? `On. Locks after you leave the app for a minute.${hasBiometric ? ` ${bio} enabled.` : ''}`
            : 'Off. Anyone who opens this app can see your numbers.'
        }
      />

      {mode === 'idle' ? (
        <div className="flex flex-col gap-2">
          {!enabled ? (
            <Button type="button" onClick={() => setMode('enable')}>
              Turn on app lock
            </Button>
          ) : (
            <>
              <Button type="button" onClick={() => window.dispatchEvent(new Event('true-cash:lock'))}>
                Lock now
              </Button>
              {canBiometric && (
                <Button type="button" variant="ghost" onClick={() => void toggleBiometric()}>
                  {hasBiometric ? `Turn off ${bio}` : `Use ${bio} to unlock`}
                </Button>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setMode('change')}>
                  Change PIN
                </Button>
                <Button type="button" variant="danger" className="flex-1" onClick={() => setMode('disable')}>
                  Turn off
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          {needsCurrent && <PinField label="Current PIN" value={current} onChange={setCurrent} />}
          {needsNew && (
            <>
              <PinField label={mode === 'change' ? 'New PIN (4 to 8 digits)' : 'Choose a PIN (4 to 8 digits)'} value={pin1} onChange={setPin1} />
              <PinField label="Repeat PIN" value={pin2} onChange={setPin2} />
              {pin2.length > 0 && pin1 !== pin2 && <p className="text-xs text-negative">The PINs do not match.</p>}
            </>
          )}
          {mode === 'disable' && <p className="text-xs text-text-muted">Enter your PIN to turn the lock off.</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" variant={mode === 'disable' ? 'danger' : 'primary'} disabled={!canSubmit}>
              {mode === 'disable' ? 'Turn off' : 'Save PIN'}
            </Button>
          </div>
        </form>
      )}

      {message && (
        <p className={'mt-3 text-center text-sm ' + (message.kind === 'ok' ? 'text-positive' : 'text-negative')}>
          {message.text}
        </p>
      )}

      <p className="mt-3 text-xs text-text-muted">
        This keeps casual snoopers out. It stays on this device only and is not part of backups. If you forget the PIN,
        the only way back in is to clear this app's data and re-import a backup.
      </p>
    </Card>
  )
}
