import { useEffect, useState } from 'react'
import { getRecurring, createRecurring, updateRecurring, deleteRecurring } from '../services/api'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'

const empty = {
  type: 'EXPENSE', amount: '', description: '', frequency: 'MONTHLY',
  startDate: '', endDate: '', reminderDaysBefore: 3
}

export default function RecurringPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)

  const load = () => getRecurring().then(r => setItems(r.data))
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form, amount: parseFloat(form.amount) }
      if (editId) { await updateRecurring(editId, payload); toast.success('Updated') }
      else { await createRecurring(payload); toast.success('Created') }
      setForm(empty); setEditId(null); load()
    } catch { toast.error('Failed to save') }
  }

  const handleEdit = (r) => {
    setEditId(r.id)
    setForm({ ...r, endDate: r.endDate || '' })
  }

  const handleDelete = async (id) => {
    await deleteRecurring(id); toast.success('Removed'); load()
  }

  return (
    <Layout title="Recurring Transactions" subtitle="Subscriptions and bills on autopilot">
      <form onSubmit={handleSubmit} className="card grid grid-cols-2 gap-3">
        <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>
        <input className="input" type="number" placeholder="Amount" value={form.amount}
          onChange={e => setForm({ ...form, amount: e.target.value })} required />
        <input className="input" placeholder="Description (e.g. Netflix)" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })} required />
        <select className="input" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="MONTHLY">Monthly</option>
          <option value="YEARLY">Yearly</option>
        </select>
        <div>
          <label className="label">Start Date</label>
          <input className="input" type="date" value={form.startDate}
            onChange={e => setForm({ ...form, startDate: e.target.value })} required />
        </div>
        <div>
          <label className="label">End Date (optional)</label>
          <input className="input" type="date" value={form.endDate}
            onChange={e => setForm({ ...form, endDate: e.target.value })} />
        </div>
        <div>
          <label className="label">Remind me (days before)</label>
          <input className="input" type="number" value={form.reminderDaysBefore}
            onChange={e => setForm({ ...form, reminderDaysBefore: parseInt(e.target.value) })} />
        </div>
        <div className="flex gap-2 items-end">
          <button className="btn-primary flex-1" type="submit">{editId ? 'Update' : 'Add'}</button>
          {editId && <button type="button" className="btn-secondary flex-1"
            onClick={() => { setForm(empty); setEditId(null) }}>Cancel</button>}
        </div>
      </form>

      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Frequency</th>
              <th className="p-3 text-left">Next Due</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(r => (
              <tr key={r.id} className="table-row">
                <td className="p-3 text-slate-200">{r.description}</td>
                <td className="p-3">
                  <span className={r.type === 'INCOME' ? 'badge-income' : 'badge-expense'}>
                    {r.type}
                  </span>
                </td>
                <td className="p-3 text-muted">{r.frequency}</td>
                <td className="p-3 text-accent">{r.nextDueDate}</td>
                <td className="p-3 text-right font-medium text-slate-100">₹{r.amount}</td>
                <td className="p-3 flex gap-3 justify-end">
                  <button onClick={() => handleEdit(r)} className="btn-edit-link">Edit</button>
                  <button onClick={() => handleDelete(r.id)} className="btn-danger-link">Remove</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted">No recurring transactions.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
