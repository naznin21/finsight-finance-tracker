import { useState } from 'react'
import { evaluateDecision } from '../services/api'
import Layout from '../components/Layout'
import CopilotWidget from '../components/CopilotWidget'
import { Scale, CheckCircle2, AlertTriangle, XCircle, Info, Calculator, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DecisionCenterPage() {
  const [form, setForm] = useState({
    title: 'New Laptop / Purchase',
    amount: '60000',
    category: 'Electronics',
    paymentMethod: 'LUMP_SUM',
    emiMonths: '6'
  })

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleEvaluate = async (e) => {
    e.preventDefault()
    if (!form.amount || parseFloat(form.amount) <= 0) {
      return toast.error('Enter a valid purchase amount')
    }

    setLoading(true)
    try {
      const payload = {
        title: form.title,
        amount: parseFloat(form.amount),
        category: form.category,
        paymentMethod: form.paymentMethod,
        emiMonths: form.paymentMethod === 'MONTHLY_EMI' ? parseInt(form.emiMonths) : null
      }
      const res = await evaluateDecision(payload)
      setResult(res.data)
      toast.success('Decision evaluated against current backend financials')
    } catch {
      toast.error('Evaluation failed. Check inputs.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Financial Decision Center" subtitle="Evaluate major purchases and financial decisions before committing">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Form */}
        <div className="card lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Scale size={20} className="text-accent" />
            <h2 className="font-bold text-slate-100 text-sm">Can I Afford It?</h2>
          </div>

          <form onSubmit={handleEvaluate} className="space-y-3.5">
            <div>
              <label className="label">Decision / Purchase Title</label>
              <input
                className="input"
                placeholder="e.g. MacBook Pro M3"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Purchase Amount (₹)</label>
              <input
                className="input"
                type="number"
                placeholder="60000"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                <option value="Electronics">Electronics</option>
                <option value="Vehicle / Travel">Vehicle / Travel</option>
                <option value="Shopping">Shopping</option>
                <option value="Home & Furniture">Home & Furniture</option>
                <option value="Education">Education</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Payment Structure</label>
              <select
                className="input"
                value={form.paymentMethod}
                onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
              >
                <option value="LUMP_SUM">Full Lump Sum Outflow</option>
                <option value="MONTHLY_EMI">Monthly EMI Financing</option>
              </select>
            </div>

            {form.paymentMethod === 'MONTHLY_EMI' && (
              <div>
                <label className="label">EMI Tenure (Months)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="6"
                  value={form.emiMonths}
                  onChange={e => setForm({ ...form, emiMonths: e.target.value })}
                />
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              <Calculator size={16} />
              <span>{loading ? 'Evaluating...' : 'Evaluate Decision Impact'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Multi-impact Evaluation Results */}
        <div className="card lg:col-span-2 flex flex-col justify-between">
          {!result ? (
            <div className="py-20 text-center space-y-3">
              <Scale size={40} className="mx-auto text-muted/40" />
              <p className="text-sm text-slate-300 font-medium">No decision evaluated yet.</p>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Fill out the purchase details on the left and click Evaluate Decision to calculate cash-flow, goal delay, and health score impacts.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Recommendation Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                result.budgetPressureLevel === 'LOW' ? 'bg-income/10 border-income/30 text-income' :
                result.budgetPressureLevel === 'MODERATE' ? 'bg-accent/10 border-accent/30 text-accent' :
                result.budgetPressureLevel === 'HIGH' ? 'bg-amber-400/10 border-amber-400/30 text-amber-400' :
                'bg-expense/10 border-expense/30 text-expense'
              }`}>
                {result.budgetPressureLevel === 'LOW' ? <CheckCircle2 size={24} className="shrink-0 mt-0.5" /> :
                 result.budgetPressureLevel === 'MODERATE' ? <Info size={24} className="shrink-0 mt-0.5" /> :
                 result.budgetPressureLevel === 'HIGH' ? <AlertTriangle size={24} className="shrink-0 mt-0.5" /> :
                 <XCircle size={24} className="shrink-0 mt-0.5" />}
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Recommendation: {result.recommendation}</h3>
                  <p className="text-xs mt-0.5 opacity-90">Budget Pressure Level: <span className="font-bold">{result.budgetPressureLevel}</span></p>
                </div>
              </div>

              {/* Multi-Impact Metric Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-panel2 p-3.5 rounded-xl border border-line">
                  <p className="text-[11px] font-semibold text-muted uppercase">Immediate Outflow</p>
                  <p className="text-xl font-bold text-slate-100 mt-1">₹{result.immediateBalanceImpact.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-muted mt-0.5">Cash impact this month</p>
                </div>

                <div className="bg-panel2 p-3.5 rounded-xl border border-line">
                  <p className="text-[11px] font-semibold text-muted uppercase">Goal Delay Impact</p>
                  <p className="text-xl font-bold text-amber-400 mt-1">
                    {result.goalDelayMonths > 0 ? `+${result.goalDelayMonths.toFixed(1)} mo` : '0 mo'}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">Across active savings goals</p>
                </div>

                <div className="bg-panel2 p-3.5 rounded-xl border border-line">
                  <p className="text-[11px] font-semibold text-muted uppercase">Health Score Impact</p>
                  <p className="text-xl font-bold text-expense mt-1">{result.healthScoreImpact} pts</p>
                  <p className="text-[10px] text-muted mt-0.5">Temporary score adjustment</p>
                </div>
              </div>

              {/* Evaluation Breakdown Bullet Points */}
              <div className="bg-panel2/60 p-4 rounded-xl border border-line space-y-2">
                <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-2">Evaluation Breakdown</h4>
                {result.evaluationBreakdown.map((item, idx) => (
                  <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <ArrowRight size={14} className="text-accent shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <CopilotWidget />
    </Layout>
  )
}
