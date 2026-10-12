import { useState } from 'react'
import { evaluateDecision } from '../services/api'
import Layout from '../components/Layout'
import {
  Scale, CheckCircle2, AlertTriangle, XCircle,
  Calculator, ArrowRight, ShieldCheck, Clock,
  Wallet, DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function DecisionCenterPage() {
  const [form, setForm] = useState({
    title: 'MacBook Air M3',
    amount: '100000',
    category: 'Electronics',
    paymentMethod: 'LUMP_SUM',
    emiMonths: '6'
  })

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleEvaluate = async (e) => {
    e.preventDefault()
    if (!form.amount || parseFloat(form.amount) <= 0) {
      return toast.error('Enter a valid purchase amount.')
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
      toast.success('Purchase impact analyzed!')
    } catch {
      toast.error('Evaluation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Calculate score gauge from healthDelta or pressure
  const gaugeScore = result ? Math.max(20, Math.min(95, 80 + (result.healthScoreImpact * 2.5))) : 72

  return (
    <Layout
      title="Purchase Decision Assistant"
      subtitle="Get AI-powered insights before making a big purchase"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Purchase Details Form (5 cols) */}
        <div className="card lg:col-span-5 space-y-4">
          <div className="border-b border-[#1e293b] pb-3">
            <h2 className="text-base font-bold text-white">Purchase Details</h2>
            <p className="text-xs text-slate-400">Specify what you're planning to buy</p>
          </div>

          <form onSubmit={handleEvaluate} className="space-y-4 text-xs">
            <div>
              <label className="label">Item Name</label>
              <input
                className="input"
                placeholder="e.g. MacBook Air M3"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Amount (₹)</label>
              <input
                className="input font-bold text-white text-sm"
                type="number"
                placeholder="100000"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Category</label>
              <select
                className="input cursor-pointer"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                <option value="Electronics">Electronics</option>
                <option value="Vehicle / Travel">Vehicle / Travel</option>
                <option value="Shopping">Shopping & Lifestyle</option>
                <option value="Home Appliances">Home Appliances</option>
                <option value="Education">Education & Courses</option>
                <option value="Other">Other Discretionary</option>
              </select>
            </div>

            <div>
              <label className="label">Payment Method</label>
              <select
                className="input cursor-pointer"
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
                  min="2"
                  max="36"
                  placeholder="6"
                  value={form.emiMonths}
                  onChange={e => setForm({ ...form, emiMonths: e.target.value })}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2 rounded-xl text-sm font-semibold"
            >
              {loading ? 'Evaluating...' : 'Analyze Purchase'}
            </button>
          </form>
        </div>

        {/* Right Column: Analysis Results (7 cols) */}
        <div className="card lg:col-span-7 flex flex-col justify-between">
          {!result ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#111c35] border border-[#1e2a47] flex items-center justify-center mx-auto text-indigo-400">
                <Scale size={28} />
              </div>
              <h3 className="text-sm font-bold text-white">No Purchase Analyzed Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Fill in the item details on the left and click "Analyze Purchase" to evaluate immediate liquid reserve impact, goal delays, and affordability score.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-[#1e293b] pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Analysis Results</h2>
                  <p className="text-xs text-slate-400">{result.title} (₹{result.purchaseAmount.toLocaleString('en-IN')})</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  result.budgetPressureLevel === 'LOW' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
                  result.budgetPressureLevel === 'MODERATE' ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400' :
                  result.budgetPressureLevel === 'HIGH' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
                  'bg-rose-500/15 border-rose-500/30 text-rose-400'
                }`}>
                  {result.budgetPressureLevel} PRESSURE
                </span>
              </div>

              {/* Gauge & Headline Row */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#111c35] border border-[#1e2a47]">
                {/* Circular Score Gauge */}
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={
                        gaugeScore >= 75 ? 'text-emerald-500' :
                        gaugeScore >= 60 ? 'text-indigo-500' :
                        gaugeScore >= 40 ? 'text-amber-400' : 'text-rose-500'
                      }
                      strokeDasharray={`${gaugeScore}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-extrabold text-white leading-none">{Math.round(gaugeScore)}</span>
                    <span className="text-[9px] text-slate-400 font-medium">/ 100</span>
                  </div>
                </div>

                {/* Status Headline */}
                <div className="text-center sm:text-left">
                  <h3 className="text-base font-bold text-white">
                    {result.budgetPressureLevel === 'LOW' ? 'Safely Affordable' :
                     result.budgetPressureLevel === 'MODERATE' ? 'Affordable with Discretion' :
                     result.budgetPressureLevel === 'HIGH' ? 'Affordable with Caution' :
                     'High Risk / Critical Outflow'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {result.recommendation}
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#0b1324] border border-[#1e293b]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Immediate Impact</span>
                  <p className="text-base font-extrabold text-white mt-1">₹{Number(result.immediateBalanceImpact).toLocaleString('en-IN')}</p>
                </div>

                <div className="p-3 rounded-xl bg-[#0b1324] border border-[#1e293b]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Goal Delay</span>
                  <p className="text-base font-extrabold text-amber-400 mt-1">
                    {result.goalDelayMonths > 0 ? `~${result.goalDelayMonths.toFixed(1)} mo` : 'No delay'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0b1324] border border-[#1e293b]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Emergency Fund</span>
                  <p className="text-base font-extrabold text-emerald-400 mt-1">
                    {result.evaluationBreakdown.some(s => s.includes('Safe')) ? 'Sufficient ✓' : 'Guarded ⚠'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0b1324] border border-[#1e293b]">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Health Score</span>
                  <p className="text-base font-extrabold text-rose-400 mt-1">
                    {result.healthScoreImpact} pts
                  </p>
                </div>
              </div>

              {/* Recommendation Box */}
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold text-white">Strategic Recommendation:</span>
                  <p className="text-slate-300 leading-relaxed">
                    {result.budgetPressureLevel === 'LOW'
                      ? "This purchase fits comfortably inside your liquid savings buffer without jeopardizing reserve goals."
                      : result.budgetPressureLevel === 'HIGH'
                      ? "Consider waiting 1-2 months to build a larger liquid cushion, or opt for 6-month EMI to reduce immediate reserve depletion."
                      : "Review optional monthly subscriptions and ensure emergency fund targets are fully funded before finalizing this outflow."}
                  </p>
                </div>
              </div>

              {/* Bullet Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evaluation Breakdown</h4>
                <div className="space-y-1.5">
                  {result.evaluationBreakdown.map((item, idx) => (
                    <div key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-[#0b1324] p-2.5 rounded-lg border border-[#1e293b]">
                      <ArrowRight size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
