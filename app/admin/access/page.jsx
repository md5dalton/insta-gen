"use client"
import { useEffect, useState } from "react"

export default function AccessPage() {
  const [users, setUsers] = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/access/users', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setUsers(data || [])
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Access</h2>
      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id} className="p-3 bg-white rounded shadow flex items-center justify-between">
            <div>
              <div className="font-medium">{u.name}</div>
              <div className="text-sm text-gray-600">{u.email}</div>
            </div>
            <div className="text-sm text-gray-600">Joined {new Date(u.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
