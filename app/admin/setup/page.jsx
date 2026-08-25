"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function SetupPage() {
  const [exists, setExists] = useState(true)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/admin/exists')
        const data = await res.json()
        setExists(data.exists)
        if (data.exists) router.push('/admin/login')
      } catch (e) {
        console.error(e)
      }
    }
    check()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Failed')
      localStorage.setItem('token', data.token)
      router.push('/admin')
    } catch (err) {
      setError('Failed to create admin')
    }
  }

  if (exists) return <p>Redirecting...</p>

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Initial Admin Setup</h2>
      <form onSubmit={handleCreate}>
        <div className="mb-3">
          <label className="block text-sm font-medium">Name</label>
          <input className="mt-1 block w-full p-2 border rounded" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium">Email</label>
          <input className="mt-1 block w-full p-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium">Password</label>
          <input type="password" className="mt-1 block w-full p-2 border rounded" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        {error && <div className="text-red-600 mb-3">{error}</div>}
        <div>
          <button className="px-4 py-2 bg-green-600 text-white rounded">Create Admin</button>
        </div>
      </form>
    </div>
  )
}
