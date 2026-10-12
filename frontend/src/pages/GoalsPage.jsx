import { useEffect, useState, useMemo } from 'react'
import { getGoals, createGoal, addSavings, deleteGoal } from '../services/api'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import {
  Target, Plus, Trash2, Home, Plane, Laptop,
  Shield, PiggyBank, Calendar, X, Sparkles
} from 'lucide-react'

const getGoalIcon = (name = '', icon = '') => {
  if (icon) return <span className="text-xl">{icon}</span>
  const n = name.toLowerCase()
  if (n.includes('home') || n.includes('house')) return <Home size={22} className="text-amber-400" />
  if (n.includes('trip') || n.includes('vacation') || n.includes('travel')) return <Plane size={22} className="text-cyan-400" />
  if (n.includes('laptop') || n.includes('phone') || n.includes('tech')) return <Laptop size={22} className="text-indigo-400" />
  if (n.includes('emergency') || n.includes('fund')) return <Shield size={22} className="text-emerald-400" />
  return <PiggyBank size={22} className="text-violet-400" />
}

export default function GoalsPage() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [addFundsGoal, setAddFundsGoal] = useState(null)
  const [fundAmount, setFundAmount] = useState('')

  const [form, setForm] = useState({
    name: '',
    icon: '',
    targetAmount: '',
    targetDate: ''
  })

  const load = async () => {
    setLoading(true)
    try {
      const res = await getGoals()
      setGoals(res.data || [])
    } catch {
      toast.error('Failed to load savings goals.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.targetAmount || Number(form.targetAmount) <= 0) {
      toast.error('Please enter a valid goal name and target amount.')
      return
    }
    try {
      await createGoal({
        ...form,
        targetAmount: parseFloat(form.targetAmount),
        savedAmount: 0
      })
      toast.success('Savings goal created!')
      setModalOpen(false)
      setForm({ name: '', icon: '', targetAmount: '', targetDate: '' })
      load()
    } catch {
      toast.error('Failed to create savings goal.')
    }
  }

  const handleAddSavings = async (e) => {
    e.preventDefault()
    const amt = parseFloat(fundAmount)
    if (!amt || amt <= 0) {
      toast.error('Enter a valid contribution amount.')
      return
    }
    try {
      await addSavings(addFundsGoal.id, amt)
      toast.success(`Added ₹${amt.toLocaleString('en-IN')} to ${addFundsGoal.name}!`)
      setAddFundsGoal(null)
      setFundAmount('')
      load()
    } catch {
      toast.error('Failed to record savings.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this savings goal?')) return
    try {
      await deleteGoal(id)
      toast.success('Savings goal removed.')
      load()
    } catch {
      toast.error('Failed to delete goal.')
    }
  }

  // Monthly needed calculation
  const calculateMonthlyNeeded = (g) => {
    if (!g.targetDate) return null
    const target = new Date(g.targetDate)
    const now = new Date()
    const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
    if (months <= 0) return null
    const remaining = Math.max(0, Number(g.targetAmount) - Number(g.savedAmount))
    return Math.round(remaining / months)
  }

  return (
    <Layout
      title="Savings Goals"
      subtitle="Turn your dreams into reality"
      onQuickAdd={() => setModalOpen(true)}
    >
      <div className="space-y-6">
        {/* Action Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Active Targets: <span className="text-white font-bold">{goals.length}</span>
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-2"
          >
            <Plus size={15} />
            <span>+ Create Goal</span>
          </button>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {goals.map(g => {
            const target = Number(g.targetAmount || 0)
            const saved = Number(g.savedAmount || 0)
            const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0
            const monthlyPace = calculateMonthlyNeeded(g)
            const isDone = g.status === 'COMPLETED' || saved >= target

            return (
              <div key={g.id} className="card flex flex-col justify-between hover:border-slate-700 transition">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#111c35] border border-[#1e2a47] flex items-center justify-center shrink-0 shadow-sm">
                        {getGoalIcon(g.name, g.icon)}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">{g.name}</h3>
                        <p className="text-xs text-slate-300 font-semibold mt-0.5">
                          ₹{saved.toLocaleString('en-IN')} / <span className="text-slate-400 font-normal">₹{target.toLocaleString('en-IN')}</span>
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      isDone ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      pct >= 50 ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {pct}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#111c35] rounded-full h-3 overflow-hidden my-3 border border-[#1e293b]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone ? 'bg-emerald-500' :
                        pct >= 50 ? 'bg-indigo-500' :
                        'bg-cyan-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Target & Monthly Recommendation Row */}
                  <div className="flex items-center justify-between text-xs text-slate-400 py-1">
                    <span>
                      Target: <b className="text-slate-200">{g.targetDate ? new Date(g.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Flexible'}</b>
                    </span>
                    {monthlyPace ? (
                      <span className="text-indigo-400 font-semibold">
                        ₹{monthlyPace.toLocaleString('en-IN')}/month
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        {isDone ? 'Goal Achieved! 🎉' : g.completionPrediction || 'In progress'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-[#1e293b] mt-3 flex items-center justify-between">
                  <button
                    onClick={() => { setAddFundsGoal(g); setFundAmount('') }}
                    className="btn-secondary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>Add Funds</span>
                  </button>
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}

          {goals.length === 0 && !loading && (
            <div className="card col-span-full py-16 text-center text-slate-500 text-xs">
              No savings goals configured. Click "+ Create Goal" to set financial milestones (Emergency Fund, Dream Vacation, New Home, etc.).
            </div>
          )}
        </div>
      </div>

      {/* Create Goal Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-[#1e2a47] rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-5 border-b border-[#1e293b] pb-3">
              <h3 className="text-base font-bold text-white">Create Savings Goal</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="label">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dream Home, Europe Trip, New Laptop, Emergency Fund"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Icon / Emoji (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 🏠, ✈️, 💻, 🛡️"
                  value={form.icon}
                  onChange={e => setForm({ ...form, icon: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Target Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 2500000"
                  value={form.targetAmount}
                  onChange={e => setForm({ ...form, targetAmount: e.target.value })}
                  className="input font-bold text-white"
                />
              </div>

              <div>
                <label className="label">Target Completion Date</label>
                <input
                  type="date"
                  value={form.targetDate}
                  onChange={e => setForm({ ...form, targetDate: e.target.value })}
                  className="input"
                />
              </div>

              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary text-xs py-2 px-4">
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-2 px-5">
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      {addFundsGoal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-[#1e2a47] rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-4 border-b border-[#1e293b] pb-3">
              <h3 className="text-base font-bold text-white">Contribute to {addFundsGoal.name}</h3>
              <button onClick={() => setAddFundsGoal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSavings} className="space-y-4 text-xs">
              <div>
                <label className="label">Contribution Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 5000"
                  value={fundAmount}
                  onChange={e => setFundAmount(e.target.value)}
                  className="input font-bold text-white text-base"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setAddFundsGoal(null)} className="btn-secondary text-xs py-2 px-4">
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-2 px-5">
                  Confirm Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
