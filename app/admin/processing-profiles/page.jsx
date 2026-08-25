"use client"
import { useEffect, useState } from "react"

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState([])
  const [name, setName] = useState("")
  const [feedImage, setFeedImage] = useState(false)
  const [hls, setHls] = useState(false)
  const [lowQuality, setLowQuality] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/processing-profiles', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setProfiles(data || [])
    } catch (e) { console.error(e) }
  }

  async function create(e) {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/processing-profiles', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name, feedImage, hls, lowQuality }) })
      const data = await res.json()
      if (res.ok) {
        setName('')
        setFeedImage(false)
        setHls(false)
        setLowQuality(false)
        load()
      }
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Processing Profiles</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <form onSubmit={create} className="space-y-3">
            <input className="w-full p-2 border rounded" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
            <label className="flex items-center"><input type="checkbox" checked={feedImage} onChange={e=>setFeedImage(e.target.checked)} className="mr-2"/> Feed image</label>
            <label className="flex items-center"><input type="checkbox" checked={hls} onChange={e=>setHls(e.target.checked)} className="mr-2"/> HLS</label>
            <label className="flex items-center"><input type="checkbox" checked={lowQuality} onChange={e=>setLowQuality(e.target.checked)} className="mr-2"/> Low quality</label>
            <div><button className="px-3 py-1 bg-green-600 text-white rounded">Create</button></div>
          </form>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Existing Profiles</h3>
          <div className="space-y-2">
            {profiles.map(p => (
              <div key={p.id} className="p-2 border rounded">
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-gray-600">Feed: {p.feedImage ? '✓' : '—'}  HLS: {p.hls ? '✓' : '—'}  Low: {p.lowQuality ? '✓' : '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
