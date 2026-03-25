import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    const { transactions, categories, budget, income } = await req.json()

    const summary = transactions.slice(0, 50).map((t: any) => ({
        type: t.type,
        amount: t.amount,
        category: t.categories?.name || 'Uncategorized',
        date: t.date,
        desc: t.description
    }))

    const prompt = `You are a personal finance AI assistant with a DevOps/SRE mindset. Analyze this user's financial data and provide insights.

Financial Data:
- Monthly Income: $${income}
- Monthly Budget: $${budget}  
- Recent Transactions (last 50): ${JSON.stringify(summary)}

Provide a JSON response with exactly this structure:
{
  "health_score": <number 0-100, like an uptime SLA>,
  "status": <"healthy" | "warning" | "critical">,
  "headline": <one punchy line about their finances, DevOps flavor>,
  "insights": [
    { "type": "anomaly" | "tip" | "alert" | "positive", "title": "...", "detail": "..." }
  ],
  "top_category": <category spending most on>,
  "savings_rate": <estimated % of income saved>,
  "recommendation": <one concrete actionable recommendation>
}

Limit insights to 4 max. Be direct, use metrics. Respond ONLY with valid JSON, no markdown.`

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY!,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1000,
                messages: [{ role: 'user', content: prompt }]
            })
        })

        const data = await response.json()
        const text = data.content[0].text
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
        return NextResponse.json(parsed)
    } catch (e) {
        return NextResponse.json({
            health_score: 75,
            status: 'warning',
            headline: 'Insufficient data for full analysis',
            insights: [{ type: 'tip', title: 'Add more transactions', detail: 'Log your expenses to get AI insights.' }],
            top_category: 'N/A',
            savings_rate: 0,
            recommendation: 'Start logging transactions to unlock AI analysis.'
        })
    }
}