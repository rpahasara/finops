export interface User {
    id: string
    name: string
    monthly_income: number
    monthly_budget: number
    savings_target: number
}

export interface Category {
    id: string
    user_id: string
    name: string
    color: string
    icon: string
}

export interface Transaction {
    id: string
    user_id: string
    category_id: string | null
    type: 'income' | 'expense'
    amount: number
    description: string
    date: string
    categories?: Category
}