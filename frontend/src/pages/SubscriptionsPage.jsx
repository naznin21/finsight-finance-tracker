import { useEffect, useState } from 'react'
import { getSubscriptionsSummary, getRecurring, createRecurring, deleteRecurring } from '../services/api'
import Layout from '../components/Layout'
import {
  CalendarCheck, Repeat, AlertCircle, Sparkles, Plus,
  Trash2, X, CheckCircle2, DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SubscriptionsPage() {
  const [summary, setSummary] = useState(null)
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    type: 'EXPENSE',
    amount: '',
    description: '',
    frequency: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    reminderDaysBefore: 3
  })

  const load = async () => {
    setLoading(true)
    try {
      const [sRes, rRes] = await Promise.all([
        getSubscriptionsSummary(),
        getRecurring()
      ])
      setSummary(sRes.data)
      setItems(rRes.data || [])
    } catch {
      toast.error('Failed to load subscriptions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Enter a valid subscription amount.')
      return
    }
    try {
      await createRecurring({ ...form, amount: parseFloat(form.amount) })
      toast.success('Subscription registered successfully!')
      setShowModal(false)
      setForm({
        type: 'EXPENSE', amount: '', description: '', frequency: 'MONTHLY',
        startDate: new Date().toISOString().split('T')[0], reminderDaysBefore: 3
      })
      load()
    } catch {
      toast.error('Failed to register subscription.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this recurring subscription?')) return
    try {
      await deleteRecurring(id)
      toast.success('Subscription cancelled.')
      load()
    } catch {
      toast.error('Failed to cancel subscription.')
    }
  }

  return (
    <Layout
      title="Recurring Subscriptions"
      subtitle="Track recurring obligations, automatic renewals, and annualized burn rate"
      onQuickAdd={() => setShowModal(true)}
    >
      <div className="space-y-6">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card">
            <span className="text-xs font-semibold text-slate-400">Monthly Commitment</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-1.5">
              ₹{Number(summary?.totalMonthlyCost || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Normalized monthly outflow</p>
          </div>

          <div className="card">
            <span className="text-xs font-semibold text-slate-400">Annualized Outflow</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
              ₹{Number(summary?.totalAnnualCost || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">12-month recurring spend</p>
          </div>

          <div className="card">
            <span className="text-xs font-semibold text-slate-400">Active Subscriptions</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400 mt-1.5">
              {summary?.totalActiveSubscriptions || items.length || 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Recurring bill items</p>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">All Subscriptions & Bills</h2>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-2"
          >
            <Plus size={15} />
            <span>+ Add Subscription</span>
          </button>
        </div>

        {/* Subscriptions Table / Cards */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="table-head">
                <tr className="border-b border-[#1e293b]">
                  <th className="py-3 px-4 font-semibold">Service / Description</th>
                  <th className="py-3 px-4 font-semibold">Frequency</th>
                  <th className="py-3 px-4 font-semibold">Next Renewal</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3 px-4 font-semibold text-right w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {items.map(item => (
                  <tr key={item.id} className="table-row">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/15 text-indigo-400 flex items-center justify-center font-bold">
                          <Repeat size={14} />
                        </div>
                        <span>{item.description}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="badge-violet">{item.frequency}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {item.startDate}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-400">
                      -₹{Number(item.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}

                {items.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-slate-500 text-xs">
                      No recurring subscriptions recorded. Click "+ Add Subscription" to track your monthly services.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Savings Opportunities Callout */}
        {summary?.savingsOpportunities && summary.savingsOpportunities.length > 0 && (
          <div className="card bg-gradient-to-br from-[#0f172a] to-[#122345] border-indigo-500/30 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
              <Sparkles size={16} />
              <span>Subscription Optimization Opportunities</span>
            </div>
            <ul className="space-y-1 text-xs text-slate-300">
              {summary.savingsOpportunities.map((opp, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{opp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Add Subscription Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-[#1e2a47] rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-5 border-b border-[#1e293b] pb-3">
              <h3 className="text-base font-bold text-white">Add Recurring Subscription</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="label">Service Name / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix Premium, Spotify, Gym Membership"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="649"
                    value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="input font-bold text-white"
                  />
                </div>
                <div>
                  <label className="label">Billing Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={e => setForm({ ...form, frequency: e.target.value })}
                    className="input cursor-pointer"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="DAILY">Daily</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">First Renewal Date</label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="input"
                />
              </div>

              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-xs py-2 px-4">
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-2 px-5">
                  Save Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
