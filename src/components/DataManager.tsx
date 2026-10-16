import { useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { Card, CardHeader } from './ui/Card'
import { Button } from './ui/Button'

export function DataManager() {
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const fileRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const runImport = (raw: string) => {
    const error = importData(raw)
    if (error) {
      setMessage({ kind: 'error', text: error })
    } else {
      setText('')
      setMessage({ kind: 'ok', text: 'Imported. All screens now show your data.' })
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

  const handleDownload = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'true-cash-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    runImport(await file.text())
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader
          title="Import Your Data"
          subtitle="Load your real numbers from a backup file. This replaces what is on this device."
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
          <Button type="button" variant="ghost" disabled={text.trim() === ''} onClick={() => runImport(text)}>
            Import pasted text
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Back Up This Device"
          subtitle="Your data lives only on this device. Save a copy to move it to another device."
        />
        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={handleCopy}>
            Copy
          </Button>
          <Button type="button" variant="ghost" className="flex-1" onClick={handleDownload}>
            Download
          </Button>
        </div>
      </Card>

      {message && (
        <p className={'text-center text-sm ' + (message.kind === 'ok' ? 'text-positive' : 'text-negative')}>
          {message.text}
        </p>
      )}
    </div>
  )
}
