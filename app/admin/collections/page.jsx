"use client"
import { useEffect, useState } from "react"

export default function CollectionsPage() {
  const [roots, setRoots] = useState([])

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/root-collections', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setRoots(data || [])
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Collections</h2>
      <div className="space-y-3">
        {roots.map(r => (
          <div key={r.id} className="p-3 bg-white rounded shadow flex justify-between items-center">
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-sm text-gray-600">{r.path}</div>
            </div>
            <div className="text-sm text-gray-600">{r.collections} collections</div>
          </div>
        ))}
      </div>
    </div>
  )
}
