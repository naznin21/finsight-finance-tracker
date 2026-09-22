import { useEffect, useState } from 'react'
import { getGoals, createGoal, addSavings, deleteGoal } from '../services/api'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import CopilotWidget from '../components/CopilotWidget'
import { Target, Sparkles, Scale } from 'lucide-react'

const empty = { name: '', icon: '', targetAmount: '', targetDate: '' }

export default function GoalsPage() {
  const [goals, setGoals] = useState([])
  const [form, setForm] = useState(empty)
  const [addAmount, setAddAmount] = useState({})
  const [tradeoffAmount, setTradeoffAmount] = useState('20000')

  const load = () => getGoals().then(r => setGoals(r.data))
  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createGoal({ ...form, targetAmount: parseFloat(form.targetAmount) })
      toast.success('Goal created'); setForm(empty); load()
    } catch { toast.error('Failed to create goal') }
  }

  const handleAddSavings = async (id) => {
    const amt = parseFloat(addAmount[id])
    if (!amt || amt <= 0) return toast.error('Enter a valid amount')
    try {
      await addSavings(id, amt)
      toast.success('Savings added'); setAddAmount({ ...addAmount, [id]: '' }); load()
    } catch { toast.error('Failed') }
  }

  const handleDelete = async (id) => {
    await deleteGoal(id); toast.success('Goal removed'); load()
  }

  return (
    <Layout title="Financial Goals 2.0" subtitle="Track progress, completion projections, and evaluate trade-off impacts">
      {/* Create Goal Form */}
      <form onSubmit={handleCreate} className="card grid grid-cols-2 gap-3">
        <input className="input text-xs" placeholder="Goal name (e.g. Laptop)" value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input className="input text-xs" placeholder="Icon emoji (e.g. 💻)" value={form.icon}
          onChange={e => setForm({ ...form, icon: e.target.value })} />
        <input className="input text-xs" type="number" placeholder="Target Amount (₹)" value={form.targetAmount}
          onChange={e => setForm({ ...form, targetAmount: e.target.value })} required />
        <div>
          <label className="label">Target Date</label>
          <input className="input text-xs" type="date" value={form.targetDate}
            onChange={e => setForm({ ...form, targetDate: e.target.value })} />
        </div>
        <button className="btn-primary col-span-2 text-xs" type="submit">Create Goal</button>
      </form>

      {/* Goal Trade-Off Quick Calculator */}
      <div className="card bg-panel2 border-line space-y-3">
        <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase">
          <Scale size={16} />
          <span>Goal Trade-off Calculator</span>
        </div>
        <p className="text-xs text-slate-300">Evaluate how a major discretionary expense delays your active goals:</p>
        <div className="flex gap-3 items-center">
          <input
            className="input text-xs max-w-xs"
            type="number"
            placeholder="Purchase amount (e.g. 20000)"
            value={tradeoffAmount}
            onChange={e => setTradeoffAmount(e.target.value)}
          />
          <span className="text-xs text-muted">
            {tradeoffAmount && parseFloat(tradeoffAmount) > 0 ? (
              <span>Spending ₹{tradeoffAmount} delays goals by ~<b>{(parseFloat(tradeoffAmount) / 10000).toFixed(1)} months</b>.</span>
            ) : 'Enter an amount to see goal delay impact.'}
          </span>
        </div>
      </div>

      {/* Goals Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {goals.map(g => (
          <div key={g.id} className="card space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xl mr-2">{g.icon}</span>
                <span className="font-bold text-slate-100 text-sm">{g.name}</span>
                <span className={`ml-2 text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  g.status === 'COMPLETED' ? 'bg-income/20 text-income' : 'bg-accent/20 text-accent'
                }`}>
                  {g.status}
                </span>
              </div>
              <button onClick={() => handleDelete(g.id)} className="btn-danger-link">Remove</button>
            </div>

            <div className="text-xs text-slate-300 flex justify-between">
              <span>Saved: <b className="text-slate-100">₹{g.savedAmount}</b> / ₹{g.targetAmount}</span>
              {g.targetDate && <span className="text-muted">Target: {g.targetDate}</span>}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-line rounded-full h-3">
              <div className="h-3 rounded-full bg-accent transition-all"
                style={{ width: `${g.progressPercent}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>{g.progressPercent.toFixed(1)}% complete</span>
              <span className="text-accent font-semibold">{g.completionPrediction}</span>
            </div>

            {g.status !== 'COMPLETED' && (
              <div className="flex gap-2 pt-1">
                <input className="input flex-1 text-xs" type="number" placeholder="Contribution amount (₹)"
                  value={addAmount[g.id] || ''}
                  onChange={e => setAddAmount({ ...addAmount, [g.id]: e.target.value })} />
                <button className="btn-primary text-xs" onClick={() => handleAddSavings(g.id)}>Add Contribution</button>
              </div>
            )}
          </div>
        ))}
        {goals.length === 0 && <p className="text-center text-muted text-xs py-8">No goals created yet.</p>}
      </div>

      <CopilotWidget />
    </Layout>
  )
}
