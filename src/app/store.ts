import { configureStore } from '@reduxjs/toolkit'
import expensesReducer from '../features/expenses/expensesSlice'

export const store = configureStore({ reducer: { expenses: expensesReducer } })
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

store.subscribe(() => {
  try { localStorage.setItem('pennywise-expenses', JSON.stringify(store.getState().expenses.items)) } catch { /* Storage can be unavailable in private browsing. */ }
})
