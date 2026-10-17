import { useRef, useState } from 'react'
import { peekBackupTime, useStore } from '../store/useStore'
import { todayKey } from '../lib/engine'
import { Card, CardHeader } from './ui/Card'
import { Button } from './ui/Button'
import { SecuritySettings } from './SecuritySettings'

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

export function DataManager() {
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const updatedAt = useStore((s) => s.updatedAt)
  const fileRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [pending, setPending] = useState<{ raw: string; backupTime: string | null } | null>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const applyImport = (raw: string) => {
    const error = importData(raw)
    setPending(null)
    if (error) {
      setMessage({ kind: 'error', text: error })
    } else {
      setText('')
      setMessage({ kind: 'ok', text: 'Imported. All screens now show your data.' })
    }
  }

  const requestImport = (raw: string) => {
    setMessage(null)
    const backupTime = peekBackupTime(raw)
    const backupIsOlder = backupTime !== null && updatedAt !== null && Date.parse(backupTime) < Date.parse(updatedAt)
    const backupIsUndated = backupTime === null && updatedAt !== null
    if (backupIsOlder || backupIsUndated) {
      setPending({ raw, backupTime })
    } else {
      applyImport(raw)
    }
  }

  const fileName = () => `true-cash-${todayKey()}.json`

  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName()
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    const file = new File([exportData()], fileName(), { type: 'application/json' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'True Cash backup' })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setMessage({ kind: 'error', text: 'Sharing failed. Use Download instead.' })
        }
      }
    } else {
      download()
      setMessage({ kind: 'ok', text: 'Sharing is not available here, so the file was downloaded instead.' })
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportData())
      setMessage({ kind: 'ok', text: 'Copied to clipboard.' })
    } catch {
      setMessage({ kind: 'error', text: 'Copy was blocked. Use Download instead.' })
    }
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    requestImport(await file.text())
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-6">
      <SecuritySettings />

      <Card>
        <CardHeader
          title="Back Up and Move Data"
          subtitle={
            updatedAt
              ? `Last changed on this device: ${formatTime(updatedAt)}`
              : 'No changes on this device yet (still showing sample data).'
          }
        />
        <div className="flex flex-col gap-2">
          <Button type="button" onClick={handleShare}>
            Share backup (AirDrop, WhatsApp, Files)
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={download}>
              Download file
            </Button>
            <Button type="button" variant="ghost" className="flex-1" onClick={handleCopy}>
              Copy text
            </Button>
          </div>
          <p className="text-xs text-text-muted">
            Your data lives only on this device. Save a backup, then import it on your other device.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Import Data"
          subtitle="Replaces everything on this device with the backup. It does not merge."
        />
        <div className="flex flex-col gap-3">
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleFile} className="hidden" />
          <Button type="button" onClick={() => fileRef.current?.click()}>
            Choose backup file
          </Button>
          <p className="text-center text-xs text-text-muted">or paste the contents below</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Paste backup text here"
            className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
          <Button type="button" variant="ghost" disabled={text.trim() === ''} onClick={() => requestImport(text)}>
            Import pasted text
          </Button>
        </div>
      </Card>

      {pending && (
        <div className="rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          <p className="font-medium">This backup looks older than what is on this device.</p>
          <p className="mt-1 text-xs">
            Backup: {pending.backupTime ? formatTime(pending.backupTime) : 'no date'}. This device:{' '}
            {updatedAt ? formatTime(updatedAt) : 'no changes'}. Importing will overwrite your newer changes.
          </p>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" className="flex-1" onClick={() => applyImport(pending.raw)}>
              Import anyway
            </Button>
          </div>
        </div>
      )}

      {message && (
        <p className={'text-center text-sm ' + (message.kind === 'ok' ? 'text-positive' : 'text-negative')}>
          {message.text}
        </p>
      )}
    </div>
  )
}
