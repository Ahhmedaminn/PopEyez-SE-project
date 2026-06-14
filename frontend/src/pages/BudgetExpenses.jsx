import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPut } from '../api'
import DateSelect from '../components/DateSelect'

const commonCategories = ['Venue', 'Catering', 'Audio Visual', 'Decor', 'Staff', 'Marketing', 'Transport', 'Other']
const emptyBudgetForm = { category: '', planned_amount: '', notes: '' }
const emptyExpenseForm = { title: '', amount: '', category: '', spent_at: '' }

function formatAmount(value) {
  return `${Number(value || 0).toLocaleString()} EGP`
}

function formatDate(value) {
  return value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString() : 'No date'
}

function isPositiveAmount(value) {
  return value !== '' && Number.isFinite(Number(value)) && Number(value) > 0
}

function BudgetExpenses({ currentUser }) {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [budgets, setBudgets] = useState([])
  const [expenses, setExpenses] = useState([])
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [editingBudgetId, setEditingBudgetId] = useState(null)
  const [editingExpenseId, setEditingExpenseId] = useState(null)
  const [budgetForm, setBudgetForm] = useState(emptyBudgetForm)
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm)

  useEffect(() => {
    let ignore = false

    async function loadEvents() {
      try {
        const eventsData = await apiGet(`/events?organizer_id=${currentUser.id}`)
        if (!ignore) {
          setEvents(eventsData)
          setSelectedEventId((current) => current || String(eventsData[0]?.id || ''))
          setMessage('')
          setIsError(false)
        }
      } catch (error) {
        if (!ignore) {
          setMessage(error.message || 'Could not load organizer events.')
          setIsError(true)
        }
      }
    }

    loadEvents()
    return () => {
      ignore = true
    }
  }, [currentUser.id])

  async function loadFinancialData(eventId = selectedEventId) {
    if (!eventId) {
      setBudgets([])
      setExpenses([])
      return
    }

    const [budgetsData, expensesData] = await Promise.all([
      apiGet(`/budgets/event/${eventId}?organizer_id=${currentUser.id}`),
      apiGet(`/expenses/event/${eventId}?organizer_id=${currentUser.id}`),
    ])
    setBudgets(budgetsData)
    setExpenses(expensesData)
  }

  useEffect(() => {
    let ignore = false

    async function loadSelectedEvent() {
      try {
        if (!selectedEventId) {
          setBudgets([])
          setExpenses([])
          return
        }

        const [budgetsData, expensesData] = await Promise.all([
          apiGet(`/budgets/event/${selectedEventId}?organizer_id=${currentUser.id}`),
          apiGet(`/expenses/event/${selectedEventId}?organizer_id=${currentUser.id}`),
        ])

        if (!ignore) {
          setBudgets(budgetsData)
          setExpenses(expensesData)
          setMessage('')
          setIsError(false)
        }
      } catch (error) {
        if (!ignore) {
          setMessage(error.message || 'Could not load budget data.')
          setIsError(true)
        }
      }
    }

    loadSelectedEvent()
    return () => {
      ignore = true
    }
  }, [selectedEventId, currentUser.id])

  const selectedEvent = events.find((event) => String(event.id) === selectedEventId)
  const plannedTotal = budgets.reduce((total, item) => total + Number(item.planned_amount || 0), 0)
  const actualTotal = expenses.reduce((total, item) => total + Number(item.amount || 0), 0)
  const difference = plannedTotal - actualTotal

  function resetBudgetForm() {
    setBudgetForm(emptyBudgetForm)
    setEditingBudgetId(null)
  }

  function resetExpenseForm() {
    setExpenseForm(emptyExpenseForm)
    setEditingExpenseId(null)
  }

  async function saveBudget(event) {
    event.preventDefault()

    if (!selectedEventId || !budgetForm.category.trim() || !isPositiveAmount(budgetForm.planned_amount)) {
      setMessage('Choose an event and enter a category with a planned amount greater than zero.')
      setIsError(true)
      return
    }

    try {
      const body = {
        event_id: selectedEventId,
        category: budgetForm.category.trim(),
        planned_amount: Number(budgetForm.planned_amount),
        notes: budgetForm.notes.trim() || null,
        organizer_id: currentUser.id,
      }

      if (editingBudgetId) {
        await apiPut(`/budgets/${editingBudgetId}`, body)
        setMessage('Budget category updated.')
      } else {
        await apiPost('/budgets', body)
        setMessage('Budget category added.')
      }

      setIsError(false)
      resetBudgetForm()
      await loadFinancialData()
    } catch (error) {
      setMessage(error.message || 'Could not save budget category.')
      setIsError(true)
    }
  }

  async function saveExpense(event) {
    event.preventDefault()

    if (!selectedEventId || !expenseForm.title.trim() || !isPositiveAmount(expenseForm.amount)) {
      setMessage('Choose an event and enter an expense title with an amount greater than zero.')
      setIsError(true)
      return
    }

    try {
      const body = {
        event_id: selectedEventId,
        title: expenseForm.title.trim(),
        amount: Number(expenseForm.amount),
        category: expenseForm.category.trim() || null,
        spent_at: expenseForm.spent_at || null,
        organizer_id: currentUser.id,
      }

      if (editingExpenseId) {
        await apiPut(`/expenses/${editingExpenseId}`, body)
        setMessage('Expense updated.')
      } else {
        await apiPost('/expenses', body)
        setMessage('Expense recorded.')
      }

      setIsError(false)
      resetExpenseForm()
      await loadFinancialData()
    } catch (error) {
      setMessage(error.message || 'Could not save expense.')
      setIsError(true)
    }
  }

  function editBudget(item) {
    setEditingBudgetId(item.id)
    setBudgetForm({
      category: item.category,
      planned_amount: String(item.planned_amount),
      notes: item.notes || '',
    })
    setMessage(`Editing ${item.category}.`)
    setIsError(false)
  }

  function editExpense(item) {
    setEditingExpenseId(item.id)
    setExpenseForm({
      title: item.title,
      amount: String(item.amount),
      category: item.category || '',
      spent_at: item.spent_at?.slice(0, 10) || '',
    })
    setMessage(`Editing ${item.title}.`)
    setIsError(false)
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
          Selected event
          <select
            value={selectedEventId}
            onChange={(event) => {
              setSelectedEventId(event.target.value)
              resetBudgetForm()
              resetExpenseForm()
            }}
            disabled={events.length === 0}
          >
            {events.length === 0 && <option value="">No organizer events found</option>}
            {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
          </select>
        </label>
        {selectedEvent && (
          <p className="selected-event-summary">
            Managing budget for <strong>{selectedEvent.name}</strong> · {formatDate(selectedEvent.event_date)}
          </p>
        )}
      </div>

      {message && <p className={isError ? 'error-text' : 'status-message'}>{message}</p>}

      <section className="stats-grid">
        <article><span>Total planned budget</span><strong>{formatAmount(plannedTotal)}</strong></article>
        <article><span>Total actual expenses</span><strong>{formatAmount(actualTotal)}</strong></article>
        <article>
          <span>{difference >= 0 ? 'Remaining budget' : 'Over budget'}</span>
          <strong className={difference < 0 ? 'negative-amount' : ''}>{formatAmount(Math.abs(difference))}</strong>
        </article>
        <article><span>Expense records</span><strong>{expenses.length}</strong></article>
      </section>

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header"><h2>Planned Budget Breakdown</h2><span>{budgets.length}</span></div>
          {budgets.length === 0 ? (
            <p className="empty-state">No budget categories have been added for this event.</p>
          ) : (
            <ul className="list data-list">
              {budgets.map((item) => (
                <li key={item.id}>
                  <strong>{item.category}</strong>
                  <span>{formatAmount(item.planned_amount)} planned · {item.notes || 'No notes'}</span>
                  <button className="secondary-button" type="button" onClick={() => editBudget(item)}>Edit</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="page-panel">
          <div className="panel-header"><h2>{editingBudgetId ? 'Edit Budget Category' : 'Add Budget Category'}</h2></div>
          <form className="form compact-form" onSubmit={saveBudget}>
            <input
              list="budget-categories"
              placeholder="Category, e.g. Catering"
              value={budgetForm.category}
              onChange={(event) => setBudgetForm({ ...budgetForm, category: event.target.value })}
              required
            />
            <datalist id="budget-categories">
              {commonCategories.map((category) => <option key={category} value={category} />)}
            </datalist>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Planned amount"
              value={budgetForm.planned_amount}
              onChange={(event) => setBudgetForm({ ...budgetForm, planned_amount: event.target.value })}
              required
            />
            <input placeholder="Notes" value={budgetForm.notes} onChange={(event) => setBudgetForm({ ...budgetForm, notes: event.target.value })} />
            <button disabled={!selectedEventId} type="submit">{editingBudgetId ? 'Save Budget Changes' : 'Add Budget Category'}</button>
            {editingBudgetId && <button className="secondary-button" type="button" onClick={resetBudgetForm}>Cancel Edit</button>}
          </form>
        </section>
      </div>

      <div className="two-column">
        <section className="page-panel">
          <div className="panel-header"><h2>Actual Expense Records</h2><span>{expenses.length}</span></div>
          {expenses.length === 0 ? (
            <p className="empty-state">No actual expenses have been recorded for this event.</p>
          ) : (
            <ul className="list data-list">
              {expenses.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{formatAmount(item.amount)} · {item.category || 'Uncategorized'} · {formatDate(item.spent_at)}</span>
                  <button className="secondary-button" type="button" onClick={() => editExpense(item)}>Edit</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="page-panel">
          <div className="panel-header"><h2>{editingExpenseId ? 'Edit Actual Expense' : 'Add Actual Expense'}</h2></div>
          <form className="form compact-form" onSubmit={saveExpense}>
            <input placeholder="Expense title" value={expenseForm.title} onChange={(event) => setExpenseForm({ ...expenseForm, title: event.target.value })} required />
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount"
              value={expenseForm.amount}
              onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })}
              required
            />
            <input
              list="expense-categories"
              placeholder="Category, e.g. Venue"
              value={expenseForm.category}
              onChange={(event) => setExpenseForm({ ...expenseForm, category: event.target.value })}
            />
            <datalist id="expense-categories">
              {[...new Set([...commonCategories, ...budgets.map((item) => item.category)])]
                .map((category) => <option key={category} value={category} />)}
            </datalist>
            <DateSelect value={expenseForm.spent_at} onChange={(date) => setExpenseForm({ ...expenseForm, spent_at: date })} minYear={2024} maxYear={2035} />
            <button disabled={!selectedEventId} type="submit">{editingExpenseId ? 'Save Expense Changes' : 'Add Expense'}</button>
            {editingExpenseId && <button className="secondary-button" type="button" onClick={resetExpenseForm}>Cancel Edit</button>}
          </form>
        </section>
      </div>
    </div>
  )
}

export default BudgetExpenses
