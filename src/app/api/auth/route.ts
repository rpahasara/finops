import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import crypto from 'crypto'

function hashPin(pin: string) {
    return crypto.createHash('sha256').update(pin + 'finops-salt').digest('hex')
}

export async function POST(req: NextRequest) {
    const { action, name, pin } = await req.json()
    const pinHash = hashPin(pin)

    if (action === 'register') {
        const { data: existing } = await supabase
            .from('users').select('id').eq('name', name).single()
        if (existing) return NextResponse.json({ error: 'Username taken' }, { status: 400 })

        const { data, error } = await supabase
            .from('users').insert({ name, pin_hash: pinHash }).select().single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Insert default categories
        const defaults = [
            { user_id: data.id, name: 'Food', color: '#ff6b6b', icon: '🍔', is_default: true },
            { user_id: data.id, name: 'Transport', color: '#ffd700', icon: '🚗', is_default: true },
            { user_id: data.id, name: 'Bills', color: '#00d4ff', icon: '📄', is_default: true },
            { user_id: data.id, name: 'Entertainment', color: '#a855f7', icon: '🎮', is_default: true },
            { user_id: data.id, name: 'Health', color: '#00ff88', icon: '💊', is_default: true },
            { user_id: data.id, name: 'Shopping', color: '#ff9f43', icon: '🛒', is_default: true },
        ]
        await supabase.from('categories').insert(defaults)
        return NextResponse.json({ user: data })
    }

    if (action === 'login') {
        const { data, error } = await supabase
            .from('users').select('*').eq('name', name).eq('pin_hash', pinHash).single()
        if (error || !data) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        return NextResponse.json({ user: data })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}