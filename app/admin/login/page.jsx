"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Sign in failed')
      localStorage.setItem('token', data.token)
      router.push('/admin')
    } catch (err) {
      setError('Sign in failed')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Admin Sign In</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block text-sm font-medium">Email</label>
          <input className="mt-1 block w-full p-2 border rounded" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium">Password</label>
          <input type="password" className="mt-1 block w-full p-2 border rounded" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        {error && <div className="text-red-600 mb-3">{error}</div>}
        <div className="flex items-center justify-between">
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Sign in</button>
          <a href="/admin/setup" className="text-sm text-gray-600">Initial setup</a>
        </div>
      </form>
    </div>
  )
}
