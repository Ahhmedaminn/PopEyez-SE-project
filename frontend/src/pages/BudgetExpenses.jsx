/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api'

function BudgetExpenses() {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('1')
  const [budgets, setBudgets] = useState([])
  const [expenses, setExpenses] = useState([])
  const [message, setMessage] = useState('')
  const [budgetForm, setBudgetForm] = useState({ category: '', planned_amount: '', notes: '' })
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', category: '', spent_at: '' })

  async function loadData() {
    const [eventsData, budgetsData, expensesData] = await Promise.all([
      apiGet('/events'),
      apiGet(`/budgets/event/${selectedEventId}`),
      apiGet(`/expenses/event/${selectedEventId}`),
    ])
    setEvents(eventsData)
    setBudgets(budgetsData)
    setExpenses(expensesData)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData().catch(() => setMessage('Could not load budget data.'))
  }, [selectedEventId])

  const plannedTotal = budgets.reduce((total, item) => total + Number(item.planned_amount || 0), 0)
  const actualTotal = expenses.reduce((total, item) => total + Number(item.amount || 0), 0)

  async function createBudget(event) {
    event.preventDefault()
    try {
      await apiPost('/budgets', {
        event_id: selectedEventId,
        category: budgetForm.category,
        planned_amount: budgetForm.planned_amount,
        notes: budgetForm.notes || null,
      })
      setBudgetForm({ category: '', planned_amount: '', notes: '' })
      setMessage('Budget row created.')
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not create budget row.')
    }
  }

  async function createExpense(event) {
    event.preventDefault()
    try {
      await apiPost('/expenses', {
        event_id: selectedEventId,
        title: expenseForm.title,
        amount: expenseForm.amount,
        category: expenseForm.category || null,
        spent_at: expenseForm.spent_at || null,
      })
      setExpenseForm({ title: '', amount: '', category: '', spent_at: '' })
      setMessage('Expense recorded.')
      await loadData()
    } catch (err) {
      setMessage(err.message || 'Could not record expense.')
    }
  }

  return (
    <div className="workspace-section">
      <div className="section-heading">
        <p className="eyebrow">Budget management</p>
        <h1>Budgets and Expenses</h1>
        <p>Plan event spending, record actual costs, and compare the difference.</p>
      </div>

      <div className="page-panel toolbar-panel">
        <label>
          Event
          <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
            {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
          </select>
        </label>
      </div>

      {message && <p className="status-message">{message}</p>}

      <section className="stats-grid">
        <article><span>Planned budget</span><strong>{plannedTotal.toLocaleString()}</strong></article>
        <article><span>Actual expenses</span><strong>{actualTotal.toLocaleString()}</strong></article>
        <article><span>Difference</span><strong>{(plannedTotal - actualTotal).toLocaleString()}</strong></article>
        <article><span>Expense records</span><strong>{expenses.length}</strong></article>
      </section>

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header"><h2>Budget Breakdown</h2><span>{budgets.length}</span></div>
          <ul className="list data-list">
            {budgets.map((item) => (
              <li key={item.id}>
                <strong>{item.category}</strong>
                <span>{Number(item.planned_amount).toLocaleString()} planned · {item.notes || 'No notes'}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="page-panel">
          <div className="panel-header"><h2>Add Budget Row</h2></div>
          <form className="form compact-form" onSubmit={createBudget}>
            <input placeholder="Category" value={budgetForm.category} onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })} required />
            <input type="number" placeholder="Planned amount" value={budgetForm.planned_amount} onChange={(e) => setBudgetForm({ ...budgetForm, planned_amount: e.target.value })} required />
            <input placeholder="Notes" value={budgetForm.notes} onChange={(e) => setBudgetForm({ ...budgetForm, notes: e.target.value })} />
            <button type="submit">Add Budget</button>
          </form>
        </section>
      </div>

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header"><h2>Actual Expenses</h2><span>{expenses.length}</span></div>
          <ul className="list data-list">
            {expenses.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <span>{Number(item.amount).toLocaleString()} · {item.category || 'Uncategorized'} · {item.spent_at ? new Date(item.spent_at).toLocaleDateString() : 'No date'}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="page-panel">
          <div className="panel-header"><h2>Record Expense</h2></div>
          <form className="form compact-form" onSubmit={createExpense}>
            <input placeholder="Expense title" value={expenseForm.title} onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })} required />
            <input type="number" placeholder="Amount" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
            <input placeholder="Category" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} />
            <input type="date" value={expenseForm.spent_at} onChange={(e) => setExpenseForm({ ...expenseForm, spent_at: e.target.value })} />
            <button type="submit">Record Expense</button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default BudgetExpenses
