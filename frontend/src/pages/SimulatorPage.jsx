import { useState } from 'react'
import { simulateScenario } from '../services/api'
import Layout from '../components/Layout'
import { SlidersHorizontal, ArrowRight, TrendingUp, Target, Sparkles, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SimulatorPage() {
  const [req, setReq] = useState({
    incomeChangePct: 10,
    rentChangeAmount: 0,
    monthlySavingsDelta: 5000,
    categoryCutPct: 15,
    targetCategory: 'Food'
  })

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSimulate = async () => {
    setLoading(true)
    try {
      const res = await simulateScenario(req)
      setResult(res.data)
      toast.success('Simulation executed against backend dataset')
    } catch {
      toast.error('Simulation failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="What-If Financial Simulator" subtitle="Simulate alternative decisions, income shifts, and category cuts">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sliders & Controls */}
        <div className="card lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <SlidersHorizontal size={18} className="text-accent" />
            <h2 className="font-bold text-slate-100 text-sm">Scenario Parameters</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-slate-200">Salary Change %</span>
                <span className="text-accent font-bold">+{req.incomeChangePct}%</span>
              </div>
              <input
                type="range" min="-30" max="50" step="5"
                value={req.incomeChangePct}
                onChange={e => setReq({ ...req, incomeChangePct: parseFloat(e.target.value) })}
                className="w-full accent-accent"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-slate-200">Monthly Rent Delta (₹)</span>
                <span className="text-accent font-bold">₹{req.rentChangeAmount}</span>
              </div>
              <input
                type="range" min="-10000" max="15000" step="1000"
                value={req.rentChangeAmount}
                onChange={e => setReq({ ...req, rentChangeAmount: parseFloat(e.target.value) })}
                className="w-full accent-accent"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-slate-200">Additional Monthly Savings (₹)</span>
                <span className="text-accent font-bold">₹{req.monthlySavingsDelta}</span>
              </div>
              <input
                type="range" min="0" max="25000" step="1000"
                value={req.monthlySavingsDelta}
                onChange={e => setReq({ ...req, monthlySavingsDelta: parseFloat(e.target.value) })}
                className="w-full accent-accent"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-slate-200">Target Category Spending Cut</span>
                <span className="text-accent font-bold">{req.categoryCutPct}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <select
                  className="input text-xs"
                  value={req.targetCategory}
                  onChange={e => setReq({ ...req, targetCategory: e.target.value })}
                >
                  <option value="Food">Food & Dining</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Transport">Transport</option>
                </select>
                <input
                  type="range" min="0" max="50" step="5"
                  value={req.categoryCutPct}
                  onChange={e => setReq({ ...req, categoryCutPct: parseFloat(e.target.value) })}
                  className="accent-accent my-auto"
                />
              </div>
            </div>

            <button
              onClick={handleSimulate}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Running Scenario...' : 'Run Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Comparison & Goal Impacts */}
        <div className="card lg:col-span-2 flex flex-col justify-between">
          {!result ? (
            <div className="py-20 text-center space-y-3">
              <SlidersHorizontal size={40} className="mx-auto text-muted/40" />
              <p className="text-sm text-slate-300 font-medium">Ready to simulate.</p>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Adjust sliders on the left and click Run Simulation to see side-by-side projected balance, savings rate, and goal acceleration.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Baseline vs Scenario Metric Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-panel2 p-4 rounded-xl border border-line">
                  <p className="text-xs font-semibold text-muted uppercase">Current Baseline</p>
                  <p className="text-2xl font-bold text-slate-200 mt-1">₹{result.baselineSavings.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-muted mt-1">Savings Rate: <span className="font-bold text-slate-300">{result.baselineSavingsRate.toFixed(1)}%</span></p>
                </div>

                <div className="bg-panel2 p-4 rounded-xl border border-accent/40 bg-accent/5">
                  <p className="text-xs font-semibold text-accent uppercase">Simulated Scenario</p>
                  <p className="text-2xl font-bold text-accent mt-1">₹{result.newSavings.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-muted mt-1">New Rate: <span className="font-bold text-income">{result.newSavingsRate.toFixed(1)}%</span></p>
                </div>
              </div>

              {/* Insights Narrative */}
              <div className="bg-panel2/60 p-4 rounded-xl border border-line space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider mb-1">
                  <Sparkles size={14} />
                  <span>Scenario Key Findings</span>
                </div>
                {result.insights.map((ins, i) => (
                  <p key={i} className="text-xs text-slate-200">{ins}</p>
                ))}
              </div>

              {/* Goal Acceleration Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Target size={14} className="text-accent" /> Goal Completion Impact
                  </h3>
                </div>

                <div className="border border-line rounded-xl overflow-hidden bg-panel2/40 text-xs">
                  <table className="w-full">
                    <thead className="table-head">
                      <tr>
                        <th className="p-3 text-left">Goal</th>
                        <th className="p-3 text-left">Baseline Est.</th>
                        <th className="p-3 text-left">New Scenario Est.</th>
                        <th className="p-3 text-right">Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.goalImpacts.map(g => (
                        <tr key={g.goalId} className="border-t border-line">
                          <td className="p-3 font-semibold text-slate-200">{g.goalName}</td>
                          <td className="p-3 text-muted">{g.baselineCompletionDate}</td>
                          <td className="p-3 text-accent font-medium">{g.newCompletionDate}</td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              g.status === 'ACCELERATED' ? 'bg-income/20 text-income' :
                              g.status === 'DELAYED' ? 'bg-expense/20 text-expense' :
                              'bg-line text-slate-300'
                            }`}>
                              {g.status === 'ACCELERATED' ? `Accelerated by ${g.monthsDelta.toFixed(1)} mos` :
                               g.status === 'DELAYED' ? `Delayed by ${g.monthsDelta.toFixed(1)} mos` :
                               'No change'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {result.goalImpacts.length === 0 && (
                        <tr><td colSpan={4} className="p-4 text-center text-muted">No active savings goals found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
