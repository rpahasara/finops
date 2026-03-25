'use client'
import { useState } from 'react'
import { User } from '@/lib/types'

export default function AuthScreen({ onLogin }: { onLogin: (u: User) => void }) {
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [name, setName] = useState('')
    const [pin, setPin] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const submit = async () => {
        if (!name || pin.length < 4) return setError('Name + 4-digit PIN required')
        setLoading(true); setError('')
        const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: mode, name, pin })
        })
        const data = await res.json()
        setLoading(false)
        if (data.error) return setError(data.error)
        onLogin(data.user)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="mono text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                        ● system ready // v1.0.0
                    </div>
                    <h1 className="mono font-bold mb-1" style={{ fontSize: '2.5rem', color: 'var(--green)', letterSpacing: '-0.02em' }}>
                        FIN<span style={{ color: 'var(--text)' }}>OPS</span>
                    </h1>
                    <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                        personal finance
                    </p>
                </div>

                {/* Terminal card */}
                <div className="card glow-green" style={{ borderColor: 'rgba(0,255,136,0.2)' }}>
                    {/* Terminal header */}
                    <div className="flex items-center gap-2 mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
                        <span className="mono text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                            {mode === 'login' ? 'auth --login' : 'auth --register'}
                        </span>
                    </div>

                    <div className="flex gap-2 mb-6">
                        {(['login', 'register'] as const).map(m => (
                            <button key={m} onClick={() => { setMode(m); setError('') }}
                                className={mode === m ? 'btn-primary' : 'btn-ghost'}
                                style={{ flex: 1, fontSize: '0.8rem' }}>
                                {m === 'login' ? '→ login' : '+ register'}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="mono text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>$ username</label>
                            <input className="input" placeholder="your_handle" value={name}
                                onChange={e => setName(e.target.value)} />
                        </div>
                        <div>
                            <label className="mono text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>$ pin (4+ digits)</label>
                            <input className="input" type="password" placeholder="••••" maxLength={8}
                                value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                                onKeyDown={e => e.key === 'Enter' && submit()} />
                        </div>
                    </div>

                    {error && (
                        <div className="mono text-xs mt-3 p-2 rounded" style={{ background: 'rgba(255,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(255,68,68,0.2)' }}>
                            ✗ {error}
                        </div>
                    )}

                    <button className="btn-primary w-full mt-5" onClick={submit} disabled={loading}
                        style={{ width: '100%', opacity: loading ? 0.7 : 1 }}>
                        {loading ? '[ connecting... ]' : mode === 'login' ? '[ authenticate ]' : '[ create account ]'}
                    </button>
                </div>

                <div className="mono text-center mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                    AI-powered • DevOps-minded • Built for hackers
                </div>
            </div>
        </div>
    )
}