import { useMemo, useSyncExternalStore } from 'react'

const KEY = 'true-cash-lock'
const ATTEMPTS_KEY = 'true-cash-lock-attempts'
const ITERATIONS = 150_000

export interface LockConfig {
  salt: string
  hash: string
  iterations: number
  credentialId?: string
}

const enc = new TextEncoder()
const toB64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)))
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

const safeGet = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const safeSet = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* storage unavailable */
  }
}

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((cb) => cb())

function subscribe(cb: () => void) {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}

export function readLockConfig(): LockConfig | null {
  const raw = safeGet(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as LockConfig
  } catch {
    return null
  }
}

export const isLockEnabled = () => readLockConfig() !== null

export function useLockConfig(): LockConfig | null {
  const raw = useSyncExternalStore(subscribe, () => safeGet(KEY) ?? '', () => '')
  return useMemo(() => (raw ? (JSON.parse(raw) as LockConfig) : null), [raw])
}

async function derive(pin: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    256,
  )
  return toB64(bits)
}

export const isValidPin = (pin: string) => /^\d{4,8}$/.test(pin)

export async function setPin(pin: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derive(pin, salt, ITERATIONS)
  const previous = readLockConfig()
  const config: LockConfig = { salt: toB64(salt), hash, iterations: ITERATIONS, credentialId: previous?.credentialId }
  safeSet(KEY, JSON.stringify(config))
  safeSet(ATTEMPTS_KEY, null)
  emit()
}

export function removeLock() {
  safeSet(KEY, null)
  safeSet(ATTEMPTS_KEY, null)
  emit()
}

interface Attempts {
  fails: number
  until: number
}

const readAttempts = (): Attempts => {
  try {
    return JSON.parse(safeGet(ATTEMPTS_KEY) ?? '') as Attempts
  } catch {
    return { fails: 0, until: 0 }
  }
}

export function lockoutSecondsLeft() {
  return Math.max(0, Math.ceil((readAttempts().until - Date.now()) / 1000))
}

/** Checks a PIN. After 5 wrong tries in a row, entry is paused for longer each time. */
export async function attemptPin(pin: string): Promise<{ ok: boolean; waitSeconds: number }> {
  const wait = lockoutSecondsLeft()
  if (wait > 0) return { ok: false, waitSeconds: wait }
  const config = readLockConfig()
  if (!config) return { ok: true, waitSeconds: 0 }
  const hash = await derive(pin, fromB64(config.salt), config.iterations)
  if (hash === config.hash) {
    safeSet(ATTEMPTS_KEY, null)
    return { ok: true, waitSeconds: 0 }
  }
  const prev = readAttempts()
  const fails = (prev.fails || 0) + 1
  const pause = fails >= 5 ? Math.min(30 * 2 ** (fails - 5), 900) : 0
  safeSet(ATTEMPTS_KEY, JSON.stringify({ fails, until: Date.now() + pause * 1000 }))
  return { ok: false, waitSeconds: pause }
}

export const biometricName = () => (/iPhone|iPad|iPod/.test(navigator.userAgent) ? 'Face ID' : 'Windows Hello')

export async function biometricSupported(): Promise<boolean> {
  try {
    return !!window.PublicKeyCredential && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
  } catch {
    return false
  }
}

/** Returns null on success, or a message to show the user. */
export async function registerBiometric(): Promise<string | null> {
  const config = readLockConfig()
  if (!config) return 'Turn on the PIN first.'
  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'True Cash', id: location.hostname },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: 'owner',
          displayName: 'True Cash owner',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'discouraged',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null
    if (!cred) return 'It was cancelled.'
    safeSet(KEY, JSON.stringify({ ...config, credentialId: toB64(cred.rawId) }))
    emit()
    return null
  } catch (err) {
    return (err as Error).name === 'NotAllowedError'
      ? 'It was cancelled or not allowed on this device.'
      : 'This device could not set it up. The PIN still works.'
  }
}

export function removeBiometric() {
  const config = readLockConfig()
  if (!config) return
  const { credentialId: _removed, ...rest } = config
  safeSet(KEY, JSON.stringify(rest))
  emit()
}

export async function unlockWithBiometric(): Promise<boolean> {
  const config = readLockConfig()
  if (!config?.credentialId) return false
  try {
    const result = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: location.hostname,
        allowCredentials: [
          { type: 'public-key', id: fromB64(config.credentialId) as BufferSource, transports: ['internal'] },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    })
    if (result) safeSet(ATTEMPTS_KEY, null)
    return !!result
  } catch {
    return false
  }
}
