'use client'
import { useState, useEffect, useCallback } from 'react'
import { User, Transaction, Category } from '@/lib/types'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

interface AIInsight {
    health_score: number
    status: string
    headline: string
    insights: { type: string; title: string; detail: string }[]
    top_category: string
    savings_rate: number
    recommendation: string
}

export default function Dashboard({ user, onLogout, onUserUpdate }: {
    user: User; onLogout: () => void; onUserUpdate: (u: User) => void
}) {
    const [view, setView] = useState<'home' | 'transactions' | 'analytics' | 'ai' | 'settings'>('home')
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [showAddTx, setShowAddTx] = useState(false)
    const [editTx, setEditTx] = useState<Transaction | null>(null)
    const [aiData, setAiData] = useState<AIInsight | null>(null)
    const [aiLoading, setAiLoading] = useState(false)
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        const [txRes, catRes] = await Promise.all([
            fetch(`/api/transactions?userId=${user.id}&month=${currentMonth}`),
            fetch(`/api/categories?userId=${user.id}`)
        ])
        const [txData, catData] = await Promise.all([txRes.json(), catRes.json()])
        setTransactions(Array.isArray(txData) ? txData : [])
        setCategories(Array.isArray(catData) ? catData : [])
        setLoading(false)
    }, [user.id, currentMonth])

    useEffect(() => { fetchData() }, [fetchData])

    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    const balance = income - expenses
    const budgetUsed = user.monthly_budget > 0 ? (expenses / user.monthly_budget) * 100 : 0

    const categoryTotals = categories.map(cat => ({
        name: cat.name, color: cat.color, icon: cat.icon,
        total: transactions.filter(t => t.category_id === cat.id && t.type === 'expense')
            .reduce((s, t) => s + Number(t.amount), 0)
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

    const fetchAI = async () => {
        setAiLoading(true)
        const allTx = await fetch(`/api/transactions?userId=${user.id}`)
        const allData = await allTx.json()
        const res = await fetch('/api/ai-insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transactions: allData, categories,
                budget: user.monthly_budget, income: user.monthly_income
            })
        })
        setAiData(await res.json())
        setAiLoading(false)
    }

    useEffect(() => { if (view === 'ai' && !aiData) fetchAI() }, [view])

    const statusColor = (s: string) => s === 'healthy' ? 'var(--green)' : s === 'warning' ? 'var(--yellow)' : 'var(--red)'

    const navItems = [
        { id: 'home', icon: '⬡', label: 'HOME' },
        { id: 'transactions', icon: '⟐', label: 'LEDGER' },
        { id: 'analytics', icon: '◈', label: 'METRICS' },
        { id: 'ai', icon: '◉', label: 'AI OPS' },
        { id: 'settings', icon: '⚙', label: 'CONFIG' },
    ]

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            {/* Top bar */}
            <header style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '0 1rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
                <div className="flex items-center gap-3">
                    <span className="mono font-bold" style={{ color: 'var(--green)', fontSize: '1.1rem' }}>FIN<span style={{ color: 'var(--text)' }}>OPS</span></span>
                    <span className="mono text-xs" style={{ color: 'var(--text-muted)', display: 'none' }}>//</span>
                    <span className="mono text-xs" style={{ color: 'var(--text-dim)', display: 'none' }}>{user.name}@local</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>{user.name}</span>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)', display: 'inline-block' }} className="pulse" />
                    <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={onLogout}>exit</button>
                </div>
            </header>

            {/* Bottom nav (mobile) + Side nav (desktop) */}
            <div style={{ display: 'flex', minHeight: 'calc(100vh - 52px)' }}>
                {/* Desktop sidebar */}
                <nav style={{ width: '200px', background: 'var(--bg2)', borderRight: '1px solid var(--border)', padding: '1rem 0', display: 'none', flexDirection: 'column', gap: '4px' }} className="desktop-nav">
                    {navItems.map(n => (
                        <button key={n.id} onClick={() => setView(n.id as any)}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: view === n.id ? 'rgba(0,255,136,0.08)' : 'transparent', borderLeft: view === n.id ? '2px solid var(--green)' : '2px solid transparent', color: view === n.id ? 'var(--green)' : 'var(--text-dim)', cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left', transition: 'all 0.15s' }}>
                            <span style={{ fontSize: '1rem' }}>{n.icon}</span>
                            <span className="mono" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>{n.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Main content */}
                <main style={{ flex: 1, padding: '1.25rem', paddingBottom: '80px', maxWidth: '100%', overflowX: 'hidden' }}>
                    {loading ? (
                        <div className="mono text-sm" style={{ color: 'var(--green)' }}>
                            <span className="pulse">█</span> loading data...
                        </div>
                    ) : (
                        <>
                            {view === 'home' && <HomeView user={user} transactions={transactions} categories={categories} income={income} expenses={expenses} balance={balance} budgetUsed={budgetUsed} categoryTotals={categoryTotals} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} onAdd={() => setShowAddTx(true)} />}
                            {view === 'transactions' && <TransactionsView transactions={transactions} categories={categories} onAdd={() => setShowAddTx(true)} onEdit={setEditTx} onDelete={async (id: string) => { await fetch('/api/transactions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); fetchData() }} />}
                            {view === 'analytics' && <AnalyticsView transactions={transactions} categories={categories} user={user} categoryTotals={categoryTotals} expenses={expenses} income={income} />}
                            {view === 'ai' && <AIView aiData={aiData} loading={aiLoading} onRefresh={fetchAI} statusColor={statusColor} />}
                            {view === 'settings' && <SettingsView user={user} categories={categories} onUserUpdate={async (updates: Partial<User>) => { const res = await fetch('/api/user', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: user.id, ...updates }) }); const d = await res.json(); onUserUpdate(d); localStorage.setItem('finops_user', JSON.stringify(d)) }} onAddCategory={async (cat: Omit<Category, 'id' | 'user_id'>) => { await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...cat, user_id: user.id }) }); fetchData() }} />}
                        </>
                    )}
                </main>
            </div>

            {/* Mobile bottom nav */}
            <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg2)', borderTop: '1px solid var(--border)', display: 'flex', zIndex: 100 }}>
                {navItems.map(n => (
                    <button key={n.id} onClick={() => setView(n.id as any)}
                        style={{ flex: 1, padding: '10px 4px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: view === n.id ? 'var(--green)' : 'var(--text-muted)', transition: 'color 0.15s' }}>
                        <span style={{ fontSize: '1.1rem' }}>{n.icon}</span>
                        <span className="mono" style={{ fontSize: '0.6rem', letterSpacing: '0.05em' }}>{n.label}</span>
                    </button>
                ))}
            </nav>

            {/* Add/Edit Transaction Modal */}
            {(showAddTx || editTx) && (
                <TransactionModal
                    tx={editTx}
                    categories={categories}
                    userId={user.id}
                    onClose={() => { setShowAddTx(false); setEditTx(null) }}
                    onSave={async (data: Partial<Transaction>) => {
                        if (editTx) await fetch('/api/transactions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editTx.id, ...data }) })
                        else await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, user_id: user.id }) })
                        fetchData(); setShowAddTx(false); setEditTx(null)
                    }}
                />
            )}

            <style>{`
        @media(min-width:768px){
          .desktop-nav{display:flex!important;}
          main{padding-bottom:1.25rem!important;}
          nav:last-child{display:none!important;}
        }
      `}</style>
        </div>
    )
}

// ─── HOME VIEW ───────────────────────────────────────────────────
function HomeView({ user, transactions, categories, income, expenses, balance, budgetUsed, categoryTotals, currentMonth, setCurrentMonth, onAdd }: any) {
    const fmt = (n: number) => `$${Number(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    const budgetColor = budgetUsed > 90 ? 'var(--red)' : budgetUsed > 70 ? 'var(--yellow)' : 'var(--green)'

    const months = Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(new Date(), i)
        return { value: format(d, 'yyyy-MM'), label: format(d, 'MMM yyyy') }
    })

    return (
        <div className="fade-in">
            {/* Month selector + Add */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="mono text-xs mb-1" style={{ color: 'var(--text-muted)' }}>// financial overview</div>
                    <select className="select" style={{ width: 'auto', fontSize: '0.8rem' }} value={currentMonth} onChange={e => setCurrentMonth(e.target.value)}>
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                </div>
                <button className="btn-primary" onClick={onAdd}>+ ADD TX</button>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '12px', marginBottom: '16px' }}>
                {[
                    { label: 'INCOME', value: fmt(income), color: 'var(--green)', icon: '↑' },
                    { label: 'EXPENSES', value: fmt(expenses), color: 'var(--red)', icon: '↓' },
                    { label: 'BALANCE', value: fmt(balance), color: balance >= 0 ? 'var(--green)' : 'var(--red)', icon: '◈' },
                ].map(k => (
                    <div key={k.label} className="card card-hover">
                        <div className="mono text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{k.icon} {k.label}</div>
                        <div className="mono font-bold" style={{ fontSize: '1.3rem', color: k.color }}>{k.value}</div>
                    </div>
                ))}
            </div>

            {/* Budget Progress */}
            {user.monthly_budget > 0 && (
                <div className="card mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>◐ BUDGET UTILIZATION</span>
                        <span className="mono text-sm font-bold" style={{ color: budgetColor }}>{budgetUsed.toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min(budgetUsed, 100)}%`, background: budgetColor }} />
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>$0</span>
                        <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>${user.monthly_budget.toLocaleString()}</span>
                    </div>
                </div>
            )}

            {/* Category breakdown */}
            <div className="card mb-4">
                <div className="mono text-xs mb-3" style={{ color: 'var(--text-muted)' }}>◎ EXPENSE BREAKDOWN</div>
                {categoryTotals.length === 0 ? (
                    <div className="mono text-xs" style={{ color: 'var(--text-muted)' }}>no expenses yet — add transactions</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {categoryTotals.map((c: any) => (
                            <div key={c.name}>
                                <div className="flex justify-between items-center mb-1">
                                    <span style={{ fontSize: '0.85rem' }}>{c.icon} {c.name}</span>
                                    <span className="mono text-sm font-bold" style={{ color: 'var(--text)' }}>${c.total.toLocaleString('en', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${expenses > 0 ? (c.total / expenses) * 100 : 0}%`, background: c.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent transactions */}
            <div className="card">
                <div className="mono text-xs mb-3" style={{ color: 'var(--text-muted)' }}>⟐ RECENT TRANSACTIONS</div>
                {transactions.slice(0, 5).map((t: Transaction) => (
                    <div key={t.id} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem' }}>{t.description || 'Untitled'}</div>
                            <div className="mono text-xs" style={{ color: 'var(--text-muted)' }}>{t.date} · {t.categories?.name || '—'}</div>
                        </div>
                        <div className="mono font-bold" style={{ color: t.type === 'income' ? 'var(--green)' : 'var(--red)', fontSize: '0.9rem' }}>
                            {t.type === 'income' ? '+' : '-'}${Number(t.amount).toFixed(2)}
                        </div>
                    </div>
                ))}
                {transactions.length === 0 && <div className="mono text-xs" style={{ color: 'var(--text-muted)' }}>no transactions this month</div>}
            </div>
        </div>
    )
}

// ─── TRANSACTIONS VIEW ─────────────────────────────────────────
function TransactionsView({ transactions, categories, onAdd, onEdit, onDelete }: any) {
    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
    const filtered = filter === 'all' ? transactions : transactions.filter((t: Transaction) => t.type === filter)

    return (
        <div className="fade-in">
            <div className="flex items-center justify-between mb-4">
                <div className="mono text-xs" style={{ color: 'var(--text-muted)' }}>// transaction ledger</div>
                <button className="btn-primary" onClick={onAdd}>+ ADD TX</button>
            </div>
            <div className="flex gap-2 mb-4">
                {(['all', 'income', 'expense'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={filter === f ? 'btn-primary' : 'btn-ghost'}
                        style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
                        {f.toUpperCase()}
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filtered.map((t: Transaction) => (
                    <div key={t.id} className="card card-hover" style={{ padding: '12px 16px' }}>
                        <div className="flex justify-between items-start">
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500, marginBottom: '2px' }}>{t.description || 'Untitled'}</div>
                                <div className="mono text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {t.date} · {t.categories?.icon} {t.categories?.name || 'Uncategorized'}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="mono font-bold" style={{ color: t.type === 'income' ? 'var(--green)' : 'var(--red)', fontSize: '0.95rem' }}>
                                    {t.type === 'income' ? '+' : '-'}${Number(t.amount).toFixed(2)}
                                </span>
                                <button onClick={() => onEdit(t)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '2px 4px' }}>✎</button>
                                <button onClick={() => onDelete(t.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '0.8rem', padding: '2px 4px' }}>✕</button>
                            </div>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && <div className="card mono text-xs" style={{ color: 'var(--text-muted)' }}>no transactions found</div>}
            </div>
        </div>
    )
}

// ─── ANALYTICS VIEW ────────────────────────────────────────────
function AnalyticsView({ transactions, categories, user, categoryTotals, expenses, income }: any) {
    const RCOLORS = ['#00ff88', '#00d4ff', '#ffd700', '#ff6b6b', '#a855f7', '#ff9f43']

    const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(new Date(), 5 - i)
        const m = format(d, 'yyyy-MM')
        const label = format(d, 'MMM')
        const monthTx = transactions.filter((t: Transaction) => t.date.startsWith(m))
        return {
            month: label,
            income: monthTx.filter((t: Transaction) => t.type === 'income').reduce((s: number, t: Transaction) => s + Number(t.amount), 0),
            expenses: monthTx.filter((t: Transaction) => t.type === 'expense').reduce((s: number, t: Transaction) => s + Number(t.amount), 0),
        }
    })

    return (
        <div className="fade-in">
            <div className="mono text-xs mb-4" style={{ color: 'var(--text-muted)' }}>// metrics & analytics</div>

            {/* Monthly bar chart */}
            <div className="card mb-4">
                <div className="mono text-xs mb-3" style={{ color: 'var(--text-muted)' }}>◈ MONTHLY TREND</div>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={last6Months} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                        <XAxis dataKey="month" tick={{ fill: '#6b8f89', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b8f89', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#0f1517', border: '1px solid #1e2d30', borderRadius: '6px', fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                        <Bar dataKey="income" fill="#00ff88" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="expenses" fill="#ff4444" radius={[3, 3, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2 justify-center">
                    <span className="mono text-xs" style={{ color: 'var(--green)' }}>■ income</span>
                    <span className="mono text-xs" style={{ color: 'var(--red)' }}>■ expenses</span>
                </div>
            </div>

            {/* Pie chart */}
            {categoryTotals.length > 0 && (
                <div className="card mb-4">
                    <div className="mono text-xs mb-3" style={{ color: 'var(--text-muted)' }}>◎ CATEGORY DISTRIBUTION</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <ResponsiveContainer width={160} height={160}>
                            <PieChart>
                                <Pie data={categoryTotals} dataKey="total" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                                    {categoryTotals.map((c: any, i: number) => (
                                        <Cell key={c.name} fill={c.color || RCOLORS[i % RCOLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#0f1517', border: '1px solid #1e2d30', borderRadius: '6px', fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {categoryTotals.map((c: any) => (
                                <div key={c.name} className="flex justify-between items-center">
                                    <span style={{ fontSize: '0.8rem' }}><span style={{ color: c.color }}>■</span> {c.icon} {c.name}</span>
                                    <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                                        {expenses > 0 ? ((c.total / expenses) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                    { label: 'AVG DAILY SPEND', value: `$${(expenses / (new Date().getDate())).toFixed(2)}` },
                    { label: 'SAVINGS RATE', value: income > 0 ? `${(((income - expenses) / income) * 100).toFixed(1)}%` : 'N/A' },
                    { label: 'LARGEST EXPENSE', value: transactions.filter((t: Transaction) => t.type === 'expense').sort((a: Transaction, b: Transaction) => Number(b.amount) - Number(a.amount))[0]?.description || '—' },
                    { label: 'TX COUNT', value: transactions.length },
                ].map(s => (
                    <div key={s.label} className="card">
                        <div className="mono text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                        <div className="mono font-bold" style={{ color: 'var(--green)', fontSize: '1.1rem' }}>{s.value}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── AI VIEW ──────────────────────────────────────────────────
function AIView({ aiData, loading, onRefresh, statusColor }: any) {
    const insightIcon = (type: string) => type === 'anomaly' ? '⚠' : type === 'alert' ? '✗' : type === 'positive' ? '✓' : '→'
    const insightColor = (type: string) => type === 'anomaly' ? 'var(--yellow)' : type === 'alert' ? 'var(--red)' : type === 'positive' ? 'var(--green)' : 'var(--blue)'

    return (
        <div className="fade-in">
            <div className="flex items-center justify-between mb-4">
                <div className="mono text-xs" style={{ color: 'var(--text-muted)' }}>// ai-ops financial intelligence</div>
                <button className="btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 12px' }} onClick={onRefresh}>↺ refresh</button>
            </div>

            {loading && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="mono text-sm mb-2" style={{ color: 'var(--green)' }}>
                        <span className="pulse">█</span> running financial analysis...
                    </div>
                    <div className="mono text-xs" style={{ color: 'var(--text-muted)' }}>querying ai model // please wait</div>
                </div>
            )}

            {!loading && !aiData && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="mono text-sm mb-3" style={{ color: 'var(--text-dim)' }}>no analysis yet</div>
                    <button className="btn-primary" onClick={onRefresh}>[ run analysis ]</button>
                </div>
            )}

            {!loading && aiData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Health score */}
                    <div className="card glow-green" style={{ borderColor: `rgba(${aiData.status === 'healthy' ? '0,255,136' : aiData.status === 'warning' ? '255,215,0' : '255,68,68'},0.2)` }}>
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="mono text-xs mb-1" style={{ color: 'var(--text-muted)' }}>◉ FINANCIAL HEALTH SCORE</div>
                                <div className="mono font-bold" style={{ fontSize: '3rem', color: statusColor(aiData.status), lineHeight: 1 }}>{aiData.health_score}</div>
                                <div className="mono text-xs" style={{ color: 'var(--text-muted)' }}>/100 SLA</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="tag" style={{ background: `rgba(${aiData.status === 'healthy' ? '0,255,136' : aiData.status === 'warning' ? '255,215,0' : '255,68,68'},0.15)`, color: statusColor(aiData.status) }}>
                                    {aiData.status.toUpperCase()}
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '0.8rem', maxWidth: '150px', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                                    {aiData.headline}
                                </div>
                            </div>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${aiData.health_score}%`, background: statusColor(aiData.status) }} />
                        </div>
                    </div>

                    {/* Insights */}
                    <div className="card">
                        <div className="mono text-xs mb-3" style={{ color: 'var(--text-muted)' }}>◎ ANOMALY DETECTION / INSIGHTS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {aiData.insights?.map((ins: any, i: number) => (
                                <div key={i} className="slide-in" style={{ display: 'flex', gap: '10px', padding: '10px', background: 'var(--bg3)', borderRadius: '6px', borderLeft: `3px solid ${insightColor(ins.type)}` }}>
                                    <span style={{ color: insightColor(ins.type), fontSize: '1rem', marginTop: '1px' }}>{insightIcon(ins.type)}</span>
                                    <div>
                                        <div style={{ fontWeight: 500, marginBottom: '2px', fontSize: '0.85rem' }}>{ins.title}</div>
                                        <div className="mono text-xs" style={{ color: 'var(--text-dim)', lineHeight: 1.5 }}>{ins.detail}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="card">
                            <div className="mono text-xs mb-1" style={{ color: 'var(--text-muted)' }}>TOP CATEGORY</div>
                            <div style={{ fontWeight: 600, color: 'var(--blue)' }}>{aiData.top_category}</div>
                        </div>
                        <div className="card">
                            <div className="mono text-xs mb-1" style={{ color: 'var(--text-muted)' }}>SAVINGS RATE</div>
                            <div className="mono font-bold" style={{ color: 'var(--green)' }}>{aiData.savings_rate}%</div>
                        </div>
                    </div>

                    {/* Recommendation */}
                    <div className="card" style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
                        <div className="mono text-xs mb-2" style={{ color: 'var(--blue)' }}>→ AI RECOMMENDATION</div>
                        <div style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>{aiData.recommendation}</div>
                    </div>

                    <div className="mono text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                        powered by claude ai // devops-grade financial intelligence
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── SETTINGS VIEW ────────────────────────────────────────────
function SettingsView({ user, categories, onUserUpdate, onAddCategory }: any) {
    const [income, setIncome] = useState(user.monthly_income || 0)
    const [budget, setBudget] = useState(user.monthly_budget || 0)
    const [savings, setSavings] = useState(user.savings_target || 0)
    const [saved, setSaved] = useState(false)
    const [catName, setCatName] = useState('')
    const [catIcon, setCatIcon] = useState('💰')
    const [catColor, setCatColor] = useState('#00ff88')

    const saveSettings = async () => {
        await onUserUpdate({ monthly_income: Number(income), monthly_budget: Number(budget), savings_target: Number(savings) })
        setSaved(true); setTimeout(() => setSaved(false), 2000)
    }

    return (
        <div className="fade-in">
            <div className="mono text-xs mb-4" style={{ color: 'var(--text-muted)' }}>// configuration</div>
            <div className="card mb-4">
                <div className="mono text-xs mb-3" style={{ color: 'var(--text-muted)' }}>⚙ FINANCIAL PARAMETERS</div>
                {[
                    { label: 'Monthly Income ($)', value: income, set: setIncome },
                    { label: 'Monthly Budget ($)', value: budget, set: setBudget },
                    { label: 'Savings Target ($)', value: savings, set: setSavings },
                ].map(f => (
                    <div key={f.label} className="mb-3">
                        <label className="mono text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                        <input type="number" className="input" value={f.value} onChange={e => f.set(Number(e.target.value))} />
                    </div>
                ))}
                <button className="btn-primary" onClick={saveSettings} style={{ width: '100%' }}>
                    {saved ? '[ ✓ saved ]' : '[ save config ]'}
                </button>
            </div>

            <div className="card mb-4">
                <div className="mono text-xs mb-3" style={{ color: 'var(--text-muted)' }}>◎ CATEGORIES</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {categories.map((c: Category) => (
                        <span key={c.id} className="tag" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: c.color, padding: '4px 10px' }}>
                            {c.icon} {c.name}
                        </span>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input className="input" placeholder="Category name" value={catName} onChange={e => setCatName(e.target.value)} style={{ flex: 1, minWidth: '120px' }} />
                    <input className="input" value={catIcon} onChange={e => setCatIcon(e.target.value)} style={{ width: '60px', textAlign: 'center' }} />
                    <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} style={{ width: '44px', height: '38px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg3)', cursor: 'pointer', padding: '2px' }} />
                    <button className="btn-ghost" onClick={async () => { if (catName) { await onAddCategory({ name: catName, icon: catIcon, color: catColor }); setCatName('') } }}>+ add</button>
                </div>
            </div>
        </div>
    )
}

// ─── TRANSACTION MODAL ────────────────────────────────────────
function TransactionModal({ tx, categories, userId, onClose, onSave }: any) {
    const [type, setType] = useState<'income' | 'expense'>(tx?.type || 'expense')
    const [amount, setAmount] = useState(tx?.amount || '')
    const [desc, setDesc] = useState(tx?.description || '')
    const [categoryId, setCategoryId] = useState(tx?.category_id || '')
    const [date, setDate] = useState(tx?.date || format(new Date(), 'yyyy-MM-dd'))
    const [loading, setLoading] = useState(false)

    const save = async () => {
        if (!amount) return
        setLoading(true)
        await onSave({ type, amount: Number(amount), description: desc, category_id: categoryId || null, date })
        setLoading(false)
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="card fade-in" style={{ width: '100%', maxWidth: '440px', borderColor: 'rgba(0,255,136,0.2)' }}>
                <div className="flex items-center justify-between mb-4">
                    <span className="mono text-sm font-bold" style={{ color: 'var(--green)' }}>{tx ? '✎ edit transaction' : '+ new transaction'}</span>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>✕</button>
                </div>

                <div className="flex gap-2 mb-4">
                    {(['expense', 'income'] as const).map(t => (
                        <button key={t} onClick={() => setType(t)}
                            className={type === t ? 'btn-primary' : 'btn-ghost'}
                            style={{ flex: 1, fontSize: '0.8rem', background: type === t && t === 'expense' ? 'var(--red)' : undefined, color: type === t && t === 'expense' ? '#0a0e0f' : undefined }}>
                            {t === 'expense' ? '↓ expense' : '↑ income'}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                        <label className="mono text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>amount ($)</label>
                        <input type="number" className="input" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <div>
                        <label className="mono text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>description</label>
                        <input className="input" placeholder="what was this for?" value={desc} onChange={e => setDesc(e.target.value)} />
                    </div>
                    <div>
                        <label className="mono text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>category</label>
                        <select className="select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                            <option value="">— select category —</option>
                            {categories.map((c: Category) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mono text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>date</label>
                        <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>cancel</button>
                    <button className="btn-primary" onClick={save} disabled={loading} style={{ flex: 2, opacity: loading ? 0.7 : 1 }}>
                        {loading ? '[ saving... ]' : '[ save transaction ]'}
                    </button>
                </div>
            </div>
        </div>
    )
}