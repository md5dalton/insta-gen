"use client"
import { useEffect, useState } from "react"

export default function ProcessingPage() {
  const [filter, setFilter] = useState('new')
  const [items, setItems] = useState([])

  useEffect(() => { load() }, [filter])

  async function load() {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/processing?filter=${filter}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setItems(data.items || [])
    } catch (e) { console.error(e) }
  }

  const [selected, setSelected] = useState(new Set())

  function toggle(id) {
    const s = new Set(selected)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    setSelected(s)
  }

  async function assignProfile(profileId) {
    try {
      const token = localStorage.getItem('token')
      const ids = Array.from(selected)
      await fetch('/api/admin/media/bulk-assign-profile', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, profileId }) })
      load()
      setSelected(new Set())
    } catch (e) { console.error(e) }
  }

  async function triggerProcessing() {
    try {
      const token = localStorage.getItem('token')
      const ids = Array.from(selected)
      const res = await fetch('/api/admin/media/bulk-trigger-processing', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })
      const data = await res.json()
      console.log('Processing results', data)
      load()
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Processing</h2>
      <div className="mb-4 space-x-2">
        {['new','needsProcessing','processing','ready','failed'].map(f => (
          <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1 rounded ${filter===f ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{f}</button>
        ))}
      </div>

      <div className="mb-3">
        <button onClick={triggerProcessing} className="px-3 py-1 bg-blue-600 text-white rounded mr-2">Process selected</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(it => (
          <div key={it.id} className="bg-white rounded shadow p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">{it.path.split('/').pop()}</div>
              <input type="checkbox" checked={selected.has(it.id)} onChange={()=>toggle(it.id)} />
            </div>
            <div className="text-xs text-gray-600">{new Date(it.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
