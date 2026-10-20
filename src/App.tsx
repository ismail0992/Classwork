import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from './app/store'
import { addExpense, clearExpenses, deleteExpense, type Expense, type ExpenseCategory } from './features/expenses/expensesSlice'
import './App.css'

const categories: ExpenseCategory[] = ['Food & drink', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other']
const icons: Record<ExpenseCategory, string> = { 'Food & drink': '☕', Transport: '↗', Shopping: '◇', Bills: '▤', Entertainment: '♫', Health: '✚', Other: '•••' }
const money = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
const localToday = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
const monthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
const isThisMonth = (date: string) => { const value = new Date(`${date}T12:00:00`); const now = new Date(); return value.getMonth() === now.getMonth() && value.getFullYear() === now.getFullYear() }
const loadProfileName = () => { try { return localStorage.getItem('pennywise-profile-name') ?? '' } catch { return '' } }
const initialsFor = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'ME'

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const expenses = useSelector((state: RootState) => state.expenses.items)
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<'This month' | 'All time'>('This month')
  const [showForm, setShowForm] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Food & drink')
  const [date, setDate] = useState(localToday())
  const [profileName, setProfileName] = useState(loadProfileName)
  const [profileDraft, setProfileDraft] = useState(profileName)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const displayName = profileName.trim() || 'My account'
  const initials = initialsFor(profileName)
  const pageTitle = location.pathname === '/transactions' ? 'Transactions' : location.pathname === '/budgets' ? 'Budgets' : 'Overview'

  const filtered = useMemo(() => expenses.filter((expense) => {
    const matchesQuery = `${expense.description} ${expense.category}`.toLowerCase().includes(query.toLowerCase().trim())
    return matchesQuery && (period === 'All time' || isThisMonth(expense.date))
  }), [expenses, period, query])
  const total = filtered.reduce((sum, expense) => sum + expense.amount, 0)
  const categoryTotals = categories.map((name) => ({ name, amount: filtered.filter((item) => item.category === name).reduce((sum, item) => sum + item.amount, 0) })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount)
  const maxCategory = Math.max(...categoryTotals.map((item) => item.amount), 1)

  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedAmount = Number(amount)
    if (!description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || !date) return
    dispatch(addExpense({ description: description.trim(), amount: parsedAmount, category, date }))
    setDescription(''); setAmount(''); setCategory('Food & drink'); setDate(localToday()); setShowForm(false)
  }

  function resetExpenses() {
    if (expenses.length && window.confirm('Delete all expenses? This cannot be undone.')) dispatch(clearExpenses())
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextName = profileDraft.trim()
    if (!nextName) return
    setProfileName(nextName)
    try { localStorage.setItem('pennywise-profile-name', nextName) } catch { /* The name remains available for this session. */ }
    setShowAccountMenu(false)
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <NavLink className="brand" to="/"><span className="brand-mark">p</span><span>pennywise</span></NavLink>
      <div className="workspace-label">WORKSPACE</div>
      <nav aria-label="Main navigation">
        <NavLink end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/"><span className="nav-icon">▦</span>Overview</NavLink>
        <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/transactions"><span className="nav-icon">↔</span>Transactions</NavLink>
        <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/budgets"><span className="nav-icon">◷</span>Budgets</NavLink>
      </nav>
      <div className="sidebar-bottom"><div className="upgrade-card"><div className="upgrade-spark">✦</div><strong>Make money mindful.</strong><p>Small habits add up to big change.</p><button type="button" onClick={() => setShowForm(true)}>Add an expense <span>↗</span></button></div><div className="profile"><div className="avatar">{initials}</div><div><strong>{displayName}</strong><span>Personal account</span></div></div></div>
    </aside>

    <main id="top" className="main-content">
      <header className="topbar"><div className="breadcrumbs"><NavLink className="workspace-link" to="/">Workspace</NavLink><span>/</span> <strong>{pageTitle}</strong></div><div className="topbar-right"><span className="date-label">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span><div className="account-control"><button className="account-trigger" type="button" aria-label={`Open account settings for ${displayName}`} aria-expanded={showAccountMenu} onClick={() => { setProfileDraft(profileName); setShowAccountMenu((open) => !open) }}><span className="avatar small">{initials}</span><span className="account-chevron">⌄</span></button>{showAccountMenu && <form className="account-menu" onSubmit={saveProfile}><div className="account-menu-title">Personal account</div><label htmlFor="profile-name">Display name</label><input id="profile-name" autoFocus maxLength={40} value={profileDraft} onChange={(event) => setProfileDraft(event.target.value)} placeholder="Enter your name" required /><button className="primary-button account-save" type="submit">Save name</button><button className="account-close" type="button" onClick={() => setShowAccountMenu(false)}>Close</button></form>}</div></div></header>
      <div className="page-wrap">
        <Routes>
          <Route path="/" element={<OverviewPage openForm={() => setShowForm(true)} expenses={filtered} total={total} categoryTotals={categoryTotals} maxCategory={maxCategory} period={period} setPeriod={setPeriod} onDelete={(id) => dispatch(deleteExpense(id))} />} />
          <Route path="/transactions" element={<TransactionsPage openForm={() => setShowForm(true)} expenses={filtered} total={total} totalCount={filtered.length} query={query} setQuery={setQuery} period={period} setPeriod={setPeriod} onDelete={(id) => dispatch(deleteExpense(id))} onReset={resetExpenses} />} />
          <Route path="/budgets" element={<BudgetsPage expenses={filtered} total={total} categoryTotals={categoryTotals} maxCategory={maxCategory} period={period} setPeriod={setPeriod} onReset={resetExpenses} />} />
          <Route path="*" element={<OverviewPage openForm={() => setShowForm(true)} expenses={filtered} total={total} categoryTotals={categoryTotals} maxCategory={maxCategory} period={period} setPeriod={setPeriod} onDelete={(id) => dispatch(deleteExpense(id))} />} />
        </Routes>
        <footer className="page-footer"><span>Made for mindful money moments.</span><span>✦ &nbsp; One step at a time</span></footer>
      </div>
    </main>

    {showForm && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false) }}><form className="expense-modal" onSubmit={submitExpense}>
      <div className="modal-heading"><div><p className="eyebrow">TRACK YOUR SPENDING</p><h2>Add an expense</h2></div><button type="button" aria-label="Close" className="close-button" onClick={() => setShowForm(false)}>×</button></div>
      <label>Description<input autoFocus value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. Coffee with Alex" required /></label>
      <div className="form-row"><label>Amount<input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="$0.00" required /></label><label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label></div>
      <label>Category<select value={category} onChange={(event) => setCategory(event.target.value as ExpenseCategory)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <button className="primary-button modal-submit" type="submit">Save expense <span>→</span></button>
    </form></div>}
  </div>
}

type SharedPageProps = { expenses: Expense[]; total: number; categoryTotals: { name: ExpenseCategory; amount: number }[]; maxCategory: number; period: 'This month' | 'All time'; setPeriod: (period: 'This month' | 'All time') => void; onDelete: (id: string) => void }

function PageHeading({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: ReactNode }) {
  return <section className="welcome-row"><div><p className="eyebrow">{eyebrow}</p><h1>{title} <span>✦</span></h1><p className="welcome-sub">{subtitle}</p></div>{action}</section>
}

function SummaryCards({ expenses, total, categoryTotals, period }: Pick<SharedPageProps, 'expenses' | 'total' | 'categoryTotals' | 'period'>) {
  return <section className="summary-grid" aria-label="Spending summary">
    <article className="summary-card featured"><div className="card-top"><span className="card-label">Total spending</span><span className="period-pill">● &nbsp;{period}</span></div><div className="total-value">{money(total)}</div><div className="summary-foot"><span className="trend-down">↘</span><span><strong>{expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}</strong> in this period</span></div><div className="sparkline" aria-hidden="true"><svg viewBox="0 0 310 45" preserveAspectRatio="none"><path d="M0 35 C22 34 22 27 44 30 S70 42 91 24 S123 31 144 18 S166 29 187 17 S216 23 235 11 S266 23 283 9 S299 11 310 2" /></svg></div></article>
    <article className="summary-card"><div className="card-top"><span className="card-label">Transactions</span><span className="stat-icon mint">↕</span></div><div className="stat-value">{expenses.length}</div><div className="stat-caption">{period === 'This month' ? 'expenses this month' : 'all recorded expenses'}</div><div className="mini-bars" aria-hidden="true">{[35,57,44,73,52,86,63,48,71,56,78,60,92,67,81,51,70,42].map((height,index)=><i key={index} style={{height:`${height}%`}} />)}</div></article>
    <article className="summary-card"><div className="card-top"><span className="card-label">Top category</span><span className="stat-icon lilac">◈</span></div><div className="stat-value category-name">{categoryTotals[0]?.name ?? '—'}</div><div className="stat-caption">{categoryTotals[0] ? `${money(categoryTotals[0].amount)} in this period` : 'Add an expense to get started'}</div><div className="category-progress"><span style={{width:`${categoryTotals[0] && total ? categoryTotals[0].amount/total*100 : 0}%`}} /></div></article>
  </section>
}

function OverviewPage(props: SharedPageProps & { openForm: () => void }) {
  return <><PageHeading eyebrow="YOUR MONEY, IN FOCUS" title="Good morning" subtitle={`Here's your spending snapshot for ${monthName}.`} action={<button className="primary-button" onClick={props.openForm}><span>＋</span> Add expense</button>} /><SummaryCards {...props} /><section className="content-grid">
    <TransactionsPanel expenses={props.expenses.slice(0,8)} onDelete={props.onDelete} title="Recent transactions" subtitle="Your latest spending activity" />
    <CategoryPanel categoryTotals={props.categoryTotals} maxCategory={props.maxCategory} period={props.period} setPeriod={props.setPeriod} />
  </section></>
}

function TransactionsPage(props: Pick<SharedPageProps, 'expenses' | 'total' | 'period' | 'setPeriod' | 'onDelete'> & { openForm: () => void; totalCount: number; query: string; setQuery: (query: string) => void; onReset: () => void }) {
  return <><PageHeading eyebrow="YOUR SPENDING, ALL IN ONE PLACE" title="Transactions" subtitle="Add, search, and manage every expense." action={<button className="primary-button" onClick={props.openForm}><span>＋</span> Add expense</button>} />
    <section className="summary-grid"><article className="summary-card featured"><div className="card-top"><span className="card-label">Total spending</span><span className="period-pill">● &nbsp;{props.period}</span></div><div className="total-value">{money(props.total)}</div><div className="summary-foot"><span><strong>{props.totalCount} {props.totalCount === 1 ? 'transaction' : 'transactions'}</strong> shown</span></div></article><article className="summary-card"><div className="card-top"><span className="card-label">Time period</span><span className="stat-icon mint">◷</span></div><button className="period-toggle" onClick={() => props.setPeriod(props.period === 'This month' ? 'All time' : 'This month')}>{props.period}<span>⌄</span></button><div className="stat-caption">Click to change period</div></article><article className="summary-card"><div className="card-top"><span className="card-label">Quick action</span><span className="stat-icon lilac">↺</span></div><button className="reset-inline" onClick={props.onReset}>Reset all expenses</button><div className="stat-caption">Permanently clear saved entries</div></article></section>
    <div className="transaction-toolbar"><label className="search-box"><span>⌕</span><input value={props.query} onChange={(event)=>props.setQuery(event.target.value)} placeholder="Search by description or category..." /></label><button className="filter-button" onClick={()=>props.setPeriod(props.period==='This month'?'All time':'This month')}>◷ <span>{props.period}</span></button><button className="reset-button" onClick={props.onReset}>Reset data</button></div>
    <TransactionsPanel expenses={props.expenses} onDelete={props.onDelete} title="All transactions" subtitle={props.period === 'This month' ? monthName : 'All dates'} full />
  </>
}

function BudgetsPage({ expenses, total, categoryTotals, maxCategory, period, setPeriod, onReset }: Pick<SharedPageProps, 'expenses' | 'total' | 'categoryTotals' | 'maxCategory' | 'period' | 'setPeriod'> & { onReset: () => void }) {
  return <><PageHeading eyebrow="SPENDING BREAKDOWN" title="Budgets" subtitle="See how your spending is distributed by category." action={<button className="filter-button page-period" onClick={()=>setPeriod(period==='This month'?'All time':'This month')}>◷ &nbsp;{period}</button>} />
    <section className="budget-summary"><div><span className="card-label">Total spending · {period}</span><strong>{money(total)}</strong><small>{expenses.length} {expenses.length===1?'expense':'expenses'} included</small></div><div className="budget-summary-icon">◷</div></section>
    <section className="panel budgets-panel"><div className="panel-heading"><div><h2>Category budgets</h2><p>Actual spending by category for {period==='This month'?'this month':'all time'}</p></div></div>
      {categoryTotals.length ? <div className="budget-list">{categoryTotals.map((item,index)=><div className="budget-item" key={item.name}><div className="budget-item-label"><span className={`category-icon color-${index%5}`}>{icons[item.name]}</span><strong>{item.name}</strong><span>{money(item.amount)} <small>spent</small></span></div><div className="progress-track budget-track"><span className={`progress-color-${index%5}`} style={{width:`${item.amount/maxCategory*100}%`}} /></div><div className="budget-share">{total ? Math.round(item.amount/total*100):0}% of expenses</div></div>)}</div> : <div className="empty-state"><div className="empty-icon">◷</div><strong>No expenses to break down yet</strong><p>Add an expense and it will appear here.</p></div>}
    </section>
    <section className="reset-card"><div><strong>Want to start fresh?</strong><p>Reset removes all saved expenses from this browser. This cannot be undone.</p></div><button className="reset-button" onClick={onReset}>Reset all expenses</button></section>
  </>
}

function TransactionsPanel({ expenses, onDelete, title, subtitle, full=false }: { expenses: Expense[]; onDelete: (id:string)=>void; title:string; subtitle:string; full?:boolean }) {
  return <article className={`panel transactions-panel${full?' full-panel':''}`}><div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{!full&&<span className="text-button">Latest first</span>}</div><div className="transaction-table"><div className="table-header"><span>TRANSACTION</span><span>CATEGORY</span><span>DATE</span><span className="amount-col">AMOUNT</span><span /></div>
    {expenses.length ? expenses.map((expense)=><TransactionRow key={expense.id} expense={expense} onDelete={()=>onDelete(expense.id)} />) : <div className="empty-state"><div className="empty-icon">＋</div><strong>No expenses found</strong><p>Try another search or add an expense.</p></div>}
  </div></article>
}

function CategoryPanel({ categoryTotals, maxCategory, period, setPeriod }: Pick<SharedPageProps,'categoryTotals'|'maxCategory'|'period'|'setPeriod'>) {
  return <aside className="right-column"><article className="panel breakdown-panel"><div className="panel-heading"><div><h2>Spending by category</h2><p>Where your money goes</p></div></div>{categoryTotals.length?<div className="breakdown-list">{categoryTotals.slice(0,5).map((item,index)=><div className="breakdown-item" key={item.name}><div className="breakdown-label"><span className={`category-icon color-${index%5}`}>{icons[item.name]}</span><span className="breakdown-name">{item.name}</span><strong>{money(item.amount)}</strong></div><div className="progress-track"><span className={`progress-color-${index%5}`} style={{width:`${item.amount/maxCategory*100}%`}} /></div></div>)}</div>:<div className="mini-empty">Your category breakdown will show up here.</div>}<button className="category-link" onClick={()=>setPeriod(period==='This month'?'All time':'This month')}>Switch to {period==='This month'?'all time':'this month'} <span>→</span></button></article><article className="tip-card"><span className="tip-icon">✦</span><div><p className="tip-label">A LITTLE MONEY NOTE</p><strong>Awareness is the first step.</strong><p>Tracking small purchases can reveal big patterns.</p></div><span className="tip-decoration">✳</span></article></aside>
}

function TransactionRow({ expense, onDelete }: { expense: Expense; onDelete: () => void }) {
  return <div className="transaction-row"><div className="transaction-name"><span className="merchant-icon">{icons[expense.category]}</span><div><strong>{expense.description}</strong><small>Expense</small></div></div><div><span className="category-chip">{expense.category}</span></div><div className="date-cell">{new Date(`${expense.date}T12:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div><div className="amount-cell">−{money(expense.amount)}</div><button className="delete-button" onClick={onDelete} aria-label={`Delete ${expense.description}`}>×</button></div>
}

export default App
