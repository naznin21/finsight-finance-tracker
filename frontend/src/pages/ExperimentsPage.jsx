import { useEffect, useState } from 'react'
import { getChallenges, createChallenge, deleteChallenge } from '../services/api'
import Layout from '../components/Layout'
import { Trophy, Plus, Sparkles, CheckCircle2, AlertCircle, X, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ExperimentsPage() {
  const [challenges, setChallenges] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    title: '30-Day Food Challenge',
    targetCategory: 'Food',
    baselineSpend: '8000',
    targetLimit: '6500'
  })

  const load = async () => {
    setLoading(true)
    try {
      const res = await getChallenges()
      setChallenges(res.data || [])
    } catch {
      toast.error('Failed to load challenges.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createChallenge({
        ...form,
        baselineSpend: parseFloat(form.baselineSpend),
        targetLimit: parseFloat(form.targetLimit)
      })
      toast.success('Challenge created!')
      setShowModal(false)
      load()
    } catch {
      toast.error('Failed to create challenge.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this challenge?')) return
    try {
      await deleteChallenge(id)
      toast.success('Challenge removed.')
      load()
    } catch {
      toast.error('Failed to remove challenge.')
    }
  }

  return (
    <Layout
      title="Financial Experiments & Discipline"
      subtitle="Run personal 30-day challenges to curb spending and build habits"
      onQuickAdd={() => setShowModal(true)}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-white text-sm">Active Behavior Challenges ({challenges.length})</h2>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>+ New Challenge</span>
          </button>
        </div>

        {/* Challenge Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map(c => {
            const current = Number(c.currentSpend || 0)
            const target = Number(c.targetLimit || 1)
            const pct = Math.min(100, Math.round((current / target) * 100))
            const isExceeded = current > target

            return (
              <div key={c.id} className="card flex flex-col justify-between hover:border-slate-700 transition">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/20">
                        <Trophy size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{c.title}</h3>
                        <span className="text-[10px] text-slate-400 font-semibold">{c.targetCategory}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isExceeded ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs my-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Spend:</span>
                      <span className="font-bold text-white">₹{current.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Ceiling:</span>
                      <span className="font-semibold text-slate-300">₹{target.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-[#111c35] rounded-full h-2.5 overflow-hidden my-2 border border-[#1e293b]">
                      <div
                        className={`h-full rounded-full transition-all ${isExceeded ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
                  <span>Saved: <b className="text-emerald-400">₹{Number(c.totalSaved || 0).toLocaleString('en-IN')}</b></span>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}

          {challenges.length === 0 && !loading && (
            <div className="card col-span-full py-16 text-center text-slate-500 text-xs">
              No behavior challenges running. Click "+ New Challenge" to launch a 30-day savings sprint.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-[#1e2a47] rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-5 border-b border-[#1e293b] pb-3">
              <h3 className="text-base font-bold text-white">Launch Financial Challenge</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="label">Challenge Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 30-Day Zero Takeout Challenge"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Target Category</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Food, Shopping, Entertainment"
                  value={form.targetCategory}
                  onChange={e => setForm({ ...form, targetCategory: e.target.value })}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Historical Baseline (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.baselineSpend}
                    onChange={e => setForm({ ...form, baselineSpend: e.target.value })}
                    className="input font-bold text-white"
                  />
                </div>
                <div>
                  <label className="label">Challenge Limit (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.targetLimit}
                    onChange={e => setForm({ ...form, targetLimit: e.target.value })}
                    className="input font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs py-2 px-4">
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-2 px-5">
                  Start Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
