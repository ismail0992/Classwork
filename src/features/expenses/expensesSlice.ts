import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type ExpenseCategory = 'Food & drink' | 'Transport' | 'Shopping' | 'Bills' | 'Entertainment' | 'Health' | 'Other'
export type Expense = { id: string; description: string; amount: number; category: ExpenseCategory; date: string }
type ExpensesState = { items: Expense[] }

const today = new Date().toISOString().slice(0, 10)
const exampleExpenses: Expense[] = [
  { id: 'seed-1', description: 'Morning coffee', amount: 5.75, category: 'Food & drink', date: today },
  { id: 'seed-2', description: 'Weekly groceries', amount: 64.28, category: 'Food & drink', date: today },
  { id: 'seed-3', description: 'Metro card refill', amount: 25, category: 'Transport', date: today },
  { id: 'seed-4', description: 'Bookshop find', amount: 18.5, category: 'Shopping', date: today },
]

function loadExpenses(): Expense[] {
  try {
    const saved = localStorage.getItem('pennywise-expenses')
    if (!saved) return exampleExpenses
    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return exampleExpenses
    return parsed.filter((item): item is Expense => Boolean(item) && typeof item.id === 'string' && typeof item.description === 'string' && Number.isFinite(item.amount) && item.amount > 0 && typeof item.date === 'string' && ['Food & drink', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'].includes(item.category))
  } catch { return exampleExpenses }
}

const initialState: ExpensesState = { items: loadExpenses() }

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    addExpense(state, action: PayloadAction<Omit<Expense, 'id'>>) {
      state.items.unshift({ ...action.payload, id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}` })
    },
    deleteExpense(state, action: PayloadAction<string>) {
      state.items = state.items.filter((expense) => expense.id !== action.payload)
    },
    clearExpenses(state) {
      state.items = []
    },
  },
})

export const { addExpense, deleteExpense, clearExpenses } = expensesSlice.actions
export default expensesSlice.reducer
