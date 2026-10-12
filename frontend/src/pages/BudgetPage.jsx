import { useEffect, useState, useMemo } from 'react'
import { getBudgets, saveBudget, deleteBudget, getCategories } from '../services/api'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import {
  PiggyBank, Plus, Trash2, Calendar, CheckCircle2,
  Utensils, Car, ShoppingBag, Zap, Film, HeartPulse,
  Folder, X
} from 'lucide-react'

const getCategoryIcon = (name = '') => {
  const n = name.toLowerCase()
  if (n.includes('food') || n.includes('dining')) return <Utensils size={18} className="text-emerald-400" />
  if (n.includes('trans') || n.includes('cab') || n.includes('fuel')) return <Car size={18} className="text-cyan-400" />
  if (n.includes('shop')) return <ShoppingBag size={18} className="text-rose-400" />
  if (n.includes('bill') || n.includes('util')) return <Zap size={18} className="text-amber-400" />
  if (n.includes('enter') || n.includes('movie')) return <Film size={18} className="text-indigo-400" />
  if (n.includes('health') || n.includes('med')) return <HeartPulse size={18} className="text-pink-400" />
  return <Folder size={18} className="text-slate-400" />
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    categoryId: '',
    amount: '',
    rollover: false
  })

  const load = async (month) => {
    setLoading(true)
    try {
      const [bRes, cRes] = await Promise.all([
        getBudgets(month),
        getCategories()
      ])
      setBudgets(bRes.data || [])
      setCategories(cRes.data || [])
    } catch {
      toast.error('Failed to load budgets.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(selectedMonth)
  }, [selectedMonth])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Please enter a valid budget amount.')
      return
    }
    try {
      await saveBudget({
        ...form,
        amount: parseFloat(form.amount),
        categoryId: parseInt(form.categoryId),
        month: selectedMonth
      })
      toast.success('Budget saved successfully!')
      setModalOpen(false)
      setForm({ categoryId: '', amount: '', rollover: false })
      load(selectedMonth)
    } catch {
      toast.error('Failed to save budget.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category budget?')) return
    try {
      await deleteBudget(id)
      toast.success('Budget deleted.')
      load(selectedMonth)
    } catch {
      toast.error('Failed to delete budget.')
    }
  }

  // Summary aggregation
  const { totalBudget, totalSpent, overallPct } = useMemo(() => {
    let bTot = 0
    let sTot = 0
    budgets.forEach(b => {
      bTot += Number(b.amount || 0) + Number(b.rolledOverAmount || 0)
      sTot += Number(b.spent || 0)
    })
    const pct = bTot > 0 ? Math.round((sTot / bTot) * 100) : 0
    return { totalBudget: bTot, totalSpent: sTot, overallPct: pct }
  }, [budgets])

  // Calendar dates around today
  const calendarDays = useMemo(() => {
    const today = new Date()
    const days = []
    for (let i = -3; i <= 3; i++) {
      const d = new Date()
      d.setDate(today.getDate() + i)
      days.push({
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNumber: d.getDate(),
        isToday: i === 0
      })
    }
    return days
  }, [])

  return (
    <Layout
      title="Monthly Budgets"
      subtitle="Set and track your spending limits"
      onQuickAdd={() => setModalOpen(true)}
    >
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Month:</span>
            <div className="flex items-center gap-2 bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <Calendar size={14} className="text-indigo-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-2"
          >
            <Plus size={15} />
            <span>+ Create Budget</span>
          </button>
        </div>

        {/* Budget Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(b => {
            const totalAllowed = Number(b.amount || 0) + Number(b.rolledOverAmount || 0)
            const spent = Number(b.spent || 0)
            const pct = totalAllowed > 0 ? Math.min(100, Math.round((spent / totalAllowed) * 100)) : 0
            const isExceeded = spent > totalAllowed

            return (
              <div key={b.id} className="card flex flex-col justify-between hover:border-slate-700 transition">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#111c35] border border-[#1e2a47] flex items-center justify-center shrink-0">
                        {getCategoryIcon(b.categoryName)}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{b.categoryName}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          ₹{spent.toLocaleString('en-IN')} / ₹{totalAllowed.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      isExceeded ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      pct >= 80 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {pct}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#111c35] rounded-full h-2.5 overflow-hidden my-3 border border-[#1e293b]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isExceeded ? 'bg-rose-500' :
                        pct >= 80 ? 'bg-amber-400' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
                  <span>Remaining: <b className={isExceeded ? 'text-rose-400' : 'text-slate-200'}>
                    ₹{Math.max(0, totalAllowed - spent).toLocaleString('en-IN')}
                  </b></span>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}

          {budgets.length === 0 && !loading && (
            <div className="card col-span-full py-16 text-center text-slate-500 text-xs">
              No category budgets set for this month. Click "+ Create Budget" to establish your spending targets.
            </div>
          )}
        </div>

        {/* Budget Calendar & Status Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendar Strip */}
          <div className="card lg:col-span-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Budget Calendar</h3>
            <div className="flex items-center justify-between gap-2 overflow-x-auto py-1">
              {calendarDays.map((d, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border min-w-[56px] text-center transition ${
                    d.isToday
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-[#111c35] border-[#1e2a47] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-semibold">{d.dayName}</span>
                  <span className="text-base font-extrabold mt-0.5">{d.dateNumber}</span>
                  {d.isToday && <span className="w-1.5 h-1.5 bg-white rounded-full mt-1"></span>}
                </div>
              ))}
            </div>
          </div>

          {/* On Track Banner */}
          <div className="card flex items-center gap-4 bg-gradient-to-br from-[#0f172a] to-[#122345] border-indigo-500/30">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {overallPct <= 100 ? "You're on track!" : "Budget Exceeded!"}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                You've used {overallPct}% of your total budget (₹{totalSpent.toLocaleString('en-IN')} / ₹{totalBudget.toLocaleString('en-IN')}) this month.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Budget Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-[#1e2a47] rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-5 border-b border-[#1e293b] pb-3">
              <h3 className="text-base font-bold text-white">Create Monthly Budget</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="label">Category</label>
                <select
                  required
                  value={form.categoryId}
                  onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  className="input cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Budget Spending Limit (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 10000"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="input font-bold text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rollover"
                  checked={form.rollover}
                  onChange={e => setForm({ ...form, rollover: e.target.checked })}
                  className="rounded border-slate-700 bg-[#111c35] text-indigo-600 focus:ring-0"
                />
                <label htmlFor="rollover" className="text-xs text-slate-300 cursor-pointer">
                  Roll over unspent budget to the next month
                </label>
              </div>

              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-5"
                >
                  Save Budget Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
