"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AdminLayout({ children }) {
  const router = useRouter()
  const [token, setToken] = useState(null)

  useEffect(() => {
    const t = localStorage.getItem("token")
    setToken(t)
  }, [])

  function signOut() {
    localStorage.removeItem("token")
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Media Manager (Admin)</h1>
          <nav className="space-x-4">
            <a href="/admin" className="text-sm text-gray-700">Dashboard</a>
            <a href="/admin/media" className="text-sm text-gray-700">Media</a>
            <a href="/admin/processing" className="text-sm text-gray-700">Processing</a>
            <a href="/admin/collections" className="text-sm text-gray-700">Collections</a>
            <a href="/admin/access" className="text-sm text-gray-700">Access</a>
            <a href="/admin/settings" className="text-sm text-gray-700">Settings</a>
            {token ? (
              <button onClick={signOut} className="ml-4 text-sm text-red-600">Sign out</button>
            ) : (
              <a href="/admin/login" className="ml-4 text-sm text-blue-600">Sign in</a>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
