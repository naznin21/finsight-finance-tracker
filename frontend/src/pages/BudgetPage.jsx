import { useEffect, useState } from 'react'
import { getBudgets, saveBudget, deleteBudget, getCategories } from '../services/api'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import CopilotWidget from '../components/CopilotWidget'
import { PiggyBank, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react'

const empty = { categoryId: '', amount: '', month: new Date().toISOString().slice(0, 7), rollover: false }

export default function BudgetPage() {
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(empty)

  const load = (month) => getBudgets(month).then(r => setBudgets(r.data))

  useEffect(() => {
    load(form.month)
    getCategories().then(r => setCategories(r.data))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await saveBudget({ ...form, amount: parseFloat(form.amount), categoryId: parseInt(form.categoryId) })
      toast.success('Budget saved')
      load(form.month)
    } catch { toast.error('Failed to save budget') }
  }

  const handleDelete = async (id) => {
    await deleteBudget(id)
    toast.success('Deleted')
    load(form.month)
  }

  return (
    <Layout title="Smart Budget Management" subtitle="Category spending limits, burn-rate projections, and data-driven recommendations">
      <form onSubmit={handleSubmit} className="card grid grid-cols-2 gap-3">
        <input className="input text-xs" type="month" value={form.month}
          onChange={e => { setForm({ ...form, month: e.target.value }); load(e.target.value) }} />

        <select className="input text-xs" value={form.categoryId}
          onChange={e => setForm({ ...form, categoryId: e.target.value })} required>
          <option value="">Select Category</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>

        <input className="input text-xs" type="number" placeholder="Budget Amount (₹)" value={form.amount}
          onChange={e => setForm({ ...form, amount: e.target.value })} required />

        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input type="checkbox" checked={form.rollover}
            onChange={e => setForm({ ...form, rollover: e.target.checked })} />
          Roll over unspent budget
        </label>
        <button className="btn-primary col-span-2 text-xs" type="submit">Save Budget</button>
      </form>

      <div className="space-y-4">
        {budgets.map(b => (
          <div key={b.id} className="card space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm">{b.categoryName}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  b.status === 'SAFE' ? 'bg-income/20 text-income' :
                  b.status === 'WATCH' ? 'bg-accent/20 text-accent' :
                  b.status === 'AT_RISK' ? 'bg-amber-400/20 text-amber-400' :
                  'bg-expense/20 text-expense'
                }`}>
                  {b.status}
                </span>
              </div>
              <div className="flex gap-3 items-center text-xs">
                <span className="text-muted">Spent: <b className="text-slate-100">₹{b.spent}</b> / ₹{b.amount}</span>
                <button onClick={() => handleDelete(b.id)} className="btn-danger-link">Remove</button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-line rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  b.percentUsed >= 100 ? 'bg-expense' :
                  b.percentUsed >= 80 ? 'bg-amber-400' : 'bg-income'
                }`}
                style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-muted">
              <span>{b.percentUsed.toFixed(1)}% used</span>
              <span>Remaining: <b className="text-slate-200">₹{b.remaining}</b></span>
              <span>Projected Month-End: <b className="text-accent">₹{b.projectedMonthEnd}</b></span>
            </div>

            {/* Recommendation Box */}
            {b.recommendationMin && (
              <div className="p-2.5 rounded-lg bg-panel2/60 border border-line text-[11px] text-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-accent shrink-0" />
                  <span>Recommendation: <b>₹{b.recommendationMin} – ₹{b.recommendationMax}</b></span>
                </div>
                <span className="text-muted text-[10px]">{b.recommendationReason}</span>
              </div>
            )}
          </div>
        ))}
        {budgets.length === 0 && <p className="text-center text-muted text-xs py-8">No budgets set for this month.</p>}
      </div>

      <CopilotWidget />
    </Layout>
  )
}
