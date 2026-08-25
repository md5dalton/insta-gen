"use client"
import { useEffect, useState } from "react"

export default function MediaPage() {
  const [items, setItems] = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/media?take=20', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setItems(data.items || [])
    } catch (e) { console.error(e) }
  }

  async function markDeleted(id) {
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/admin/media/${id}/mark-deleted`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      load()
    } catch (e) { console.error(e) }
  }

  async function restore(id) {
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/admin/media/${id}/restore`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      load()
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Media</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(it => (
          <div key={it.id} className="bg-white rounded shadow p-2">
            <div className="h-40 bg-gray-100 mb-2 flex items-center justify-center text-sm text-gray-500">Preview</div>
            <div className="text-sm font-medium">{it.path.split('/').pop()}</div>
            <div className="text-xs text-gray-600">{it.owner.name}</div>
            <div className="mt-2">
              {it.deletedAt ? (
                <button onClick={()=>restore(it.id)} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Restore</button>
              ) : (
                <button onClick={()=>markDeleted(it.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Mark Deleted</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
