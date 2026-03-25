import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const month = searchParams.get('month') // YYYY-MM

    let query = supabase
        .from('transactions')
        .select('*, categories(*)')
        .eq('user_id', userId)
        .order('date', { ascending: false })

    if (month) {
        query = query
            .gte('date', `${month}-01`)
            .lte('date', `${month}-31`)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { data, error } = await supabase
        .from('transactions').insert(body).select('*, categories(*)').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
    const { id, ...updates } = await req.json()
    const { data, error } = await supabase
        .from('transactions').update(updates).eq('id', id).select('*, categories(*)').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
    const { id } = await req.json()
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}