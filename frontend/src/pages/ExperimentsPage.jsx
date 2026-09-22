import { useEffect, useState } from 'react'
import { getChallenges, createChallenge, deleteChallenge } from '../services/api'
import Layout from '../components/Layout'
import CopilotWidget from '../components/CopilotWidget'
import { Trophy, Plus, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ExperimentsPage() {
  const [challenges, setChallenges] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '30-Day Food Challenge', targetCategory: 'Food', baselineSpend: '8000', targetLimit: '6500' })

  const load = () => getChallenges().then(r => setChallenges(r.data)).catch(() => {})

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createChallenge({
        ...form,
        baselineSpend: parseFloat(form.baselineSpend),
        targetLimit: parseFloat(form.targetLimit)
      })
      toast.success('Challenge created')
      setShowForm(false)
      load()
    } catch {
      toast.error('Failed to create challenge')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteChallenge(id)
      toast.success('Challenge removed')
      load()
    } catch {
      toast.error('Failed')
    }
  }

  return (
    <Layout title="Financial Experiments & Behavior Challenges" subtitle="Run personal 30-day challenges to curb spending and build financial discipline">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-slate-100 text-sm">Active Behavior Challenges</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs flex items-center gap-1.5">
          <Plus size={14} />
          <span>{showForm ? 'Cancel' : 'New Challenge'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <input className="input text-xs" placeholder="Title (e.g. 30-Day Food Challenge)" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} required />
          <input className="input text-xs" placeholder="Category (e.g. Food)" value={form.targetCategory}
            onChange={e => setForm({ ...form, targetCategory: e.target.value })} required />
          <input className="input text-xs" type="number" placeholder="Baseline Spend (₹)" value={form.baselineSpend}
            onChange={e => setForm({ ...form, baselineSpend: e.target.value })} required />
          <input className="input text-xs" type="number" placeholder="Target Spend Limit (₹)" value={form.targetLimit}
            onChange={e => setForm({ ...form, targetLimit: e.target.value })} required />
          <button className="btn-primary text-xs col-span-2 sm:col-span-1" type="submit">Start Challenge</button>
        </form>
      )}

      {/* Challenge Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {challenges.map(c => (
          <div key={c.id} className="card space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-accent" />
                <h3 className="font-bold text-slate-100 text-sm">{c.title}</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                c.status === 'ON_TRACK' ? 'bg-income/20 text-income' :
                c.status === 'COMPLETED' ? 'bg-accent/20 text-accent' :
                'bg-expense/20 text-expense'
              }`}>
                {c.status}
              </span>
            </div>

            <div className="text-xs text-slate-300 space-y-1 bg-panel2/60 p-3 rounded-xl border border-line">
              <div className="flex justify-between">
                <span className="text-muted">Baseline Spend:</span>
                <span>₹{c.baselineSpend}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Target Limit:</span>
                <span className="text-income font-bold">₹{c.targetLimit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Actual Current Spend:</span>
                <span className="font-bold text-slate-100">₹{c.currentSpend}</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-accent font-semibold">Saved so far: ₹{c.totalSaved}</span>
              <button onClick={() => handleDelete(c.id)} className="btn-danger-link">End Challenge</button>
            </div>
          </div>
        ))}

        {challenges.length === 0 && (
          <div className="card col-span-full py-12 text-center text-muted text-xs">
            No active behavior challenges. Click New Challenge to start a 30-day spending challenge.
          </div>
        )}
      </div>

      <CopilotWidget />
    </Layout>
  )
}
