import { useEffect, useState } from 'react'
import { getPulse, getStory, getDashboardSummary } from '../services/api'
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { Sparkles, TrendingUp, ArrowUpRight, ArrowDownRight, Wallet, ShieldCheck, Scale, SlidersHorizontal, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import CopilotWidget from '../components/CopilotWidget'

const COLORS = ['#22c1e6', '#f59e0b', '#22c55e', '#f75c5c', '#8b5cf6', '#3b82f6']

export default function DashboardPage() {
  const [pulse, setPulse] = useState(null)
  const [story, setStory] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getPulse().then(r => setPulse(r.data)).catch(() => {}),
      getStory().then(r => setStory(r.data)).catch(() => {}),
      getDashboardSummary().then(r => setSummary(r.data)).catch(() => {})
    ]).finally(() => setLoading(false))
  }, [])

  const currentPulse = pulse || {
    score: 75,
    healthStatus: 'Good',
    currentBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    expenseChangePct: 0,
    savingsRate: 0,
    pulseHighlights: ['Welcome to FinSight! Add your first account or transaction to get started.']
  }

  const categoryData = summary && summary.categorySpending
    ? Object.entries(summary.categorySpending).map(([name, value]) => ({ name, value: Number(value) }))
    : []

  return (
    <Layout title="Financial Command Center" subtitle="Real-time financial pulse, analytics, and intelligent projections">
      {loading ? (
        <div className="py-20 text-center text-muted flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium">Loading Financial Command Center...</p>
        </div>
      ) : (
        <>
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center justify-between">
                <p className="text-muted text-xs font-medium uppercase tracking-wider">Current Balance</p>
                <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                  <Wallet size={16} className="text-accent" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-50 mt-2">₹{(currentPulse.currentBalance || 0).toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted mt-1">Available monthly surplus balance</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <p className="text-muted text-xs font-medium uppercase tracking-wider">Monthly Income</p>
                <div className="w-8 h-8 rounded-lg bg-income/15 flex items-center justify-center">
                  <ArrowUpRight size={16} className="text-income" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-income mt-2">₹{(currentPulse.monthlyIncome || 0).toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted mt-1">Total recorded monthly in-flow</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <p className="text-muted text-xs font-medium uppercase tracking-wider">Monthly Expenses</p>
                <div className="w-8 h-8 rounded-lg bg-expense/15 flex items-center justify-center">
                  <ArrowDownRight size={16} className="text-expense" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-expense mt-2">₹{(currentPulse.monthlyExpenses || 0).toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted mt-1">
                {currentPulse.expenseChangePct < 0
                  ? `↓ ${Math.abs(currentPulse.expenseChangePct).toFixed(1)}% from last month`
                  : currentPulse.expenseChangePct > 0
                  ? `↑ ${currentPulse.expenseChangePct.toFixed(1)}% from last month`
                  : 'Steady vs last month'}
              </p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <p className="text-muted text-xs font-medium uppercase tracking-wider">Savings Rate</p>
                <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                  <TrendingUp size={16} className="text-accent" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-accent mt-2">{(currentPulse.savingsRate || 0).toFixed(1)}%</p>
              <p className="text-xs text-muted mt-1">Target benchmark: ≥ 20.0%</p>
            </div>
          </div>

          {/* Financial Pulse & Financial Story Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Financial Pulse Card */}
            <div className="card lg:col-span-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-accent" />
                    <h2 className="font-bold text-slate-100 text-sm">Financial Pulse</h2>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    currentPulse.score >= 80 ? 'bg-income/20 text-income' :
                    currentPulse.score >= 65 ? 'bg-accent/20 text-accent' :
                    'bg-amber-400/20 text-amber-400'
                  }`}>
                    {currentPulse.healthStatus}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 my-4">
                  <span className="text-5xl font-extrabold text-slate-50 tracking-tight">{currentPulse.score}</span>
                  <span className="text-muted text-sm font-medium">/ 100</span>
                </div>

                <div className="space-y-2 mt-4">
                  {(currentPulse.pulseHighlights || []).map((highlight, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-panel2/60 p-2.5 rounded-lg border border-line/40">
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link to="/health" className="mt-4 text-xs font-semibold text-accent hover:underline flex items-center justify-between">
                <span>View full health score breakdown</span>
                <span>→</span>
              </Link>
            </div>

            {/* Financial Story Card */}
            <div className="card lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={18} className="text-accent" />
                  <h2 className="font-bold text-slate-100 text-sm">Your Financial Story</h2>
                </div>
                <p className="text-xs text-muted mb-4">Data-driven natural language synthesis of recent spending dynamics</p>

                {story && (
                  <div className="space-y-3 bg-panel2/70 p-4 rounded-xl border border-line">
                    <h3 className="text-base font-bold text-accent">{story.headline}</h3>
                    <p className="text-sm text-slate-200 leading-relaxed">{story.narrative}</p>
                    <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs">
                      <span className="text-muted font-medium">Key Takeaway:</span>
                      <span className="text-slate-100 font-semibold">{story.keyTakeaway}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Decision & Simulation Actions */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Link to="/decision-center" className="p-3 rounded-xl bg-panel2 border border-line hover:border-accent/50 transition flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
                    <Scale size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-100">Decision Center</p>
                    <p className="text-[11px] text-muted">Can I afford it?</p>
                  </div>
                </Link>

                <Link to="/simulator" className="p-3 rounded-xl bg-panel2 border border-line hover:border-accent/50 transition flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
                    <SlidersHorizontal size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-100">Scenario Simulator</p>
                    <p className="text-[11px] text-muted">Simulate what-if changes</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-accent" />
                <h2 className="font-semibold text-slate-100 text-sm">Expense Analytics</h2>
              </div>
              <p className="text-xs text-muted mb-4">Category-wise spending breakdown</p>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c2740" vertical={false} />
                    <XAxis dataKey="name" stroke="#8a96ab" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#8a96ab" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#111a2c', border: '1px solid #1c2740', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }}
                      cursor={{ fill: 'rgba(34,193,230,0.06)' }}
                    />
                    <Bar dataKey="value" fill="#22c1e6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-16 text-center text-muted text-xs">No transaction expenses recorded yet.</div>
              )}
            </div>

            <div className="card">
              <h2 className="font-semibold text-slate-100 text-sm mb-1">Spending Allocation</h2>
              <p className="text-xs text-muted mb-4">Where your money went this month</p>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111a2c', border: '1px solid #1c2740', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-16 text-center text-muted text-xs">No transaction expenses recorded yet.</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Grounded Copilot Assistant Widget */}
      <CopilotWidget />
    </Layout>
  )
}
