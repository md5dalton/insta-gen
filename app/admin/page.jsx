"use client"
import React, { useEffect, useState } from "react"

export default function AdminPage() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        // Placeholder: backend endpoints will supply real stats
        const res = await fetch('/api/admin/stats')
        if (res.ok) setStats(await res.json())
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [])

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">Media Root<br/><span className="text-sm text-gray-600">/mnt/media (placeholder)</span></div>
        <div className="p-4 bg-white rounded shadow">Total Media<br/><span className="text-sm text-gray-600">{stats?.total ?? '—'}</span></div>
        <div className="p-4 bg-white rounded shadow">Needs Processing<br/><span className="text-sm text-gray-600">{stats?.needsProcessing ?? '—'}</span></div>
      </div>

      <section className="mt-8">
        <h3 className="text-lg font-medium">Needs attention</h3>
        <p className="text-sm text-gray-600">This is a minimal scaffold — more dashboard widgets will be added.</p>
      </section>
    </div>
  )
}
