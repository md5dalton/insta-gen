"use client"
import { useEffect, useState } from "react"

export default function SettingsPage() {
  const [mediaRoot, setMediaRoot] = useState("")
  const [status, setStatus] = useState(null)
  const [input, setInput] = useState("")
  const [message, setMessage] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await fetch('/api/admin/media-root')
      if (!res.ok) return
      const data = await res.json()
      setMediaRoot(data.path)
      setInput(data.path || "")
      setStatus(data.status)
    } catch (e) {
      console.error(e)
    }
  }

  async function save(e) {
    e.preventDefault()
    setMessage(null)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/media-root', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ path: input })
      })
      const data = await res.json()
      if (!res.ok) return setMessage({ type: 'error', text: data.error || 'Failed' })
      setMessage({ type: 'success', text: 'Saved' })
      setMediaRoot(data.path)
      load()
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed' })
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>

      <section className="bg-white p-4 rounded shadow max-w-2xl">
        <h3 className="font-medium">Media Root</h3>
        <p className="text-sm text-gray-600 mb-2">Configure the filesystem media root used by the backend.</p>
        <form onSubmit={save} className="space-y-3">
          <input className="w-full p-2 border rounded" value={input} onChange={e=>setInput(e.target.value)} />
          <div className="flex items-center space-x-3">
            <button className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
            <button type="button" onClick={load} className="px-3 py-1 bg-gray-200 rounded">Refresh</button>
          </div>
        </form>

        <div className="mt-4">
          <div>Current: <span className="font-mono">{mediaRoot ?? '—'}</span></div>
          {status && (
            <ul className="mt-2">
              <li>Exists: {status.exists ? '✓' : '✗'}</li>
              <li>Readable: {status.readable ? '✓' : '✗'}</li>
              <li>Writable: {status.writable ? '✓' : '✗'}</li>
            </ul>
          )}
        </div>

        {message && <div className={`mt-3 ${message.type==='error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</div>}
      </section>
    </div>
  )
}
