import { useEffect, useState } from 'react'
import { getSubscriptionsSummary, getRecurring, createRecurring, deleteRecurring } from '../services/api'
import Layout from '../components/Layout'
import CopilotWidget from '../components/CopilotWidget'
import { CalendarCheck, Repeat, AlertCircle, Sparkles, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SubscriptionsPage() {
  const [summary, setSummary] = useState(null)
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    type: 'EXPENSE', amount: '', description: '', frequency: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0], reminderDaysBefore: 3
  })

  const load = () => {
    getSubscriptionsSummary().then(r => setSummary(r.data)).catch(() => {})
    getRecurring().then(r => setItems(r.data)).catch(() => {})
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createRecurring({ ...form, amount: parseFloat(form.amount) })
      toast.success('Subscription added')
      setShowForm(false)
      load()
    } catch {
      toast.error('Failed to add subscription')
    }
  }

  const handleDelete = async (id) => {
    await deleteRecurring(id)
    toast.success('Removed')
    load()
  }

  return (
    <Layout title="Subscription & Cash-Flow Intelligence" subtitle="Track recurring obligations, subscriptions, and future money movements">
      {summary && (
        <>
          {/* Top Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card">
              <p className="text-muted text-xs font-semibold uppercase">Total Monthly Subscriptions</p>
              <p className="text-3xl font-extrabold text-expense mt-2">₹{summary.totalMonthlyCost.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted mt-1">Monthly commitment</p>
            </div>

            <div className="card">
              <p className="text-muted text-xs font-semibold uppercase">Total Annual Cost</p>
              <p className="text-3xl font-extrabold text-slate-100 mt-2">₹{summary.totalAnnualCost.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted mt-1">12-month projected total</p>
            </div>

            <div className="card">
              <p className="text-muted text-xs font-semibold uppercase">Active Obligations</p>
              <p className="text-3xl font-extrabold text-accent mt-2">{summary.totalActiveSubscriptions}</p>
              <p className="text-xs text-muted mt-1">Tracked recurring services</p>
            </div>
          </div>

          {/* Savings Opportunities */}
          {summary.savingsOpportunities && summary.savingsOpportunities.length > 0 && (
            <div className="card bg-panel2 border-line space-y-2">
              <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase">
                <Sparkles size={16} />
                <span>Subscription Optimization Insight</span>
              </div>
              <p className="text-xs text-slate-200">{summary.savingsOpportunities[0]}</p>
            </div>
          )}

          {/* Add Subscription Form Toggle */}
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-100 text-sm">Recurring Payments & Subscriptions</h2>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs flex items-center gap-1.5">
              <Plus size={14} />
              <span>{showForm ? 'Cancel' : 'Add Recurring Payment'}</span>
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleCreate} className="card grid grid-cols-2 gap-3">
              <input className="input" placeholder="Service / Description (e.g. Netflix)" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} required />
              <input className="input" type="number" placeholder="Amount (₹)" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })} required />
              <select className="input" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
                <option value="WEEKLY">Weekly</option>
              </select>
              <input className="input" type="date" value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })} required />
              <button className="btn-primary col-span-2" type="submit">Save Subscription</button>
            </form>
          )}

          {/* Table */}
          <div className="card !p-0 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="table-head">
                <tr>
                  <th className="p-3 text-left">Service</th>
                  <th className="p-3 text-left">Frequency</th>
                  <th className="p-3 text-left">Next Due</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Classification</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {summary.items.map(s => (
                  <tr key={s.id} className="table-row">
                    <td className="p-3 font-semibold text-slate-100">{s.name}</td>
                    <td className="p-3 text-muted">{s.frequency}</td>
                    <td className="p-3 text-accent font-medium">{s.nextDueDate}</td>
                    <td className="p-3 text-slate-300">{s.category}</td>
                    <td className="p-3 text-right font-bold text-slate-100">₹{s.amount}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.isEssential ? 'bg-income/20 text-income' : 'bg-accent/20 text-accent'
                      }`}>
                        {s.isEssential ? 'ESSENTIAL' : 'OPTIONAL'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleDelete(s.id)} className="btn-danger-link">Remove</button>
                    </td>
                  </tr>
                ))}
                {summary.items.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-muted">No subscriptions registered.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <CopilotWidget />
    </Layout>
  )
}
