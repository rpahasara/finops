# FinOps 💰

A personal finance tracker with AI-powered spending insights.
Built for RSL Mini-Hack '26.

🔗 **Live App**: [FinOps.app](https://finops-vl25.vercel.app/)

## Features
- Track income & expenses with categories
- Budget monitoring with real-time utilization
- Spending analytics with charts
- AI-powered financial health score & insights (Claude API)
- PIN-based authentication
- Mobile responsive

## Stack
Next.js · Supabase · Anthropic Claude · Recharts · Vercel

## Setup
1. Clone the repo and run `npm install`
2. Add `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `ANTHROPIC_API_KEY`
3. Run the SQL schema in Supabase (see `/docs/schema.sql`)
4. `npm run dev`

## Demo
Register any username + 4-digit PIN on the login screen.

---
Built with Claude AI · RSL Mini-Hack '26
