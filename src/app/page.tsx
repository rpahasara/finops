'use client'
import { useState, useEffect } from 'react'
import AuthScreen from '@/components/AuthScreen'
import Dashboard from '@/components/Dashboard'
import { User } from '@/lib/types'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('finops_user')
    if (stored) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  const handleLogin = (u: User) => {
    setUser(u)
    localStorage.setItem('finops_user', JSON.stringify(u))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('finops_user')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="mono text-sm" style={{ color: 'var(--green)' }}>
        <span className="pulse">█</span> initializing finops...
      </div>
    </div>
  )

  return (
    <main className="scanlines">
      {!user ? <AuthScreen onLogin={handleLogin} /> : <Dashboard user={user} onLogout={handleLogout} onUserUpdate={setUser} />}
    </main>
  )
}