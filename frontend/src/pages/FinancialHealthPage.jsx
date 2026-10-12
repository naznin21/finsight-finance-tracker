import { useEffect, useState } from 'react'
import { getHealth } from '../services/api'
import Layout from '../components/Layout'
import {
  ShieldCheck, TrendingUp, CheckCircle2, AlertCircle,
  Sparkles, ArrowRight, BarChart2
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import toast from 'react-hot-toast'

export default function FinancialHealthPage() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getHealth()
      .then(r => setHealth(r.data))
      .catch(err => {
        console.error(err)
        toast.error('Failed to load financial health report.')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout
      title="Financial Health Score"
      subtitle="Comprehensive multi-pillar solvency analysis, discipline metrics, and historical trend"
    >
      {loading && !health ? (
        <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium">Computing Health Pillars...</p>
        </div>
      ) : health ? (
        <div className="space-y-6">
          {/* Main Health Card & 5 Pillars */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health Score Card */}
            <div className="card lg:col-span-1 text-center flex flex-col justify-center items-center p-8 bg-gradient-to-b from-[#0f172a] to-[#121c38]">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600/15 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20 shadow-md shadow-indigo-600/10">
                <ShieldCheck size={40} />
              </div>
              <h2 className="text-6xl font-extrabold text-white tracking-tight">{health.overallScore}</h2>
              <p className="text-slate-400 text-xs font-medium mt-1">Overall Health Score / 100</p>
              <span className={`mt-3 px-3.5 py-1 rounded-full text-xs font-bold border ${
                health.overallScore >= 80 ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
                health.overallScore >= 65 ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400' :
                'bg-amber-500/15 border-amber-500/30 text-amber-400'
              }`}>
                {health.rating}
              </span>
            </div>

            {/* 5 Pillars Progress */}
            <div className="card lg:col-span-2 space-y-4">
              <div className="border-b border-[#1e293b] pb-3">
                <h2 className="font-bold text-white text-sm">Health Score Components</h2>
                <p className="text-xs text-slate-400">Mathematical assessment across 5 core financial pillars</p>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="flex justify-between mb-1.5 font-medium">
                    <span className="text-slate-300">Savings Rate (25% weight)</span>
                    <span className="text-emerald-400 font-bold">{health.savingsScore} / 100</span>
                  </div>
                  <div className="w-full bg-[#111c35] rounded-full h-2.5 overflow-hidden border border-[#1e293b]">
                    <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${health.savingsScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1.5 font-medium">
                    <span className="text-slate-300">Budget Discipline (25% weight)</span>
                    <span className="text-indigo-400 font-bold">{health.budgetDisciplineScore} / 100</span>
                  </div>
                  <div className="w-full bg-[#111c35] rounded-full h-2.5 overflow-hidden border border-[#1e293b]">
                    <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${health.budgetDisciplineScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1.5 font-medium">
                    <span className="text-slate-300">Expense Stability (20% weight)</span>
                    <span className="text-cyan-400 font-bold">{health.stabilityScore} / 100</span>
                  </div>
                  <div className="w-full bg-[#111c35] rounded-full h-2.5 overflow-hidden border border-[#1e293b]">
                    <div className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${health.stabilityScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1.5 font-medium">
                    <span className="text-slate-300">Goal Progress (15% weight)</span>
                    <span className="text-violet-400 font-bold">{health.goalProgressScore} / 100</span>
                  </div>
                  <div className="w-full bg-[#111c35] rounded-full h-2.5 overflow-hidden border border-[#1e293b]">
                    <div className="bg-violet-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${health.goalProgressScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1.5 font-medium">
                    <span className="text-slate-300">Obligation Ratio (15% weight)</span>
                    <span className="text-amber-400 font-bold">{health.obligationScore} / 100</span>
                  </div>
                  <div className="w-full bg-[#111c35] rounded-full h-2.5 overflow-hidden border border-[#1e293b]">
                    <div className="bg-amber-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${health.obligationScore}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Trend & Action Items Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Historical 4-Month Trend Chart */}
            <div className="card flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-white">Historical Health Trend</h3>
                <p className="text-xs text-slate-400">Quarterly evolution of your solvency score</p>
              </div>

              {health.trend && health.trend.length > 0 ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={health.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #1e293b',
                          borderRadius: '12px',
                          color: '#f8fafc',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={44} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-xs text-slate-500">
                  Trend data will populate as transaction records accumulate.
                </div>
              )}
            </div>

            {/* Strategic Action Items Checklist */}
            <div className="card space-y-4">
              <div className="border-b border-[#1e293b] pb-3">
                <h3 className="text-sm font-bold text-white">Recommended Action Plan</h3>
                <p className="text-xs text-slate-400">Prioritized checklist to elevate your health score</p>
              </div>

              <div className="space-y-2.5">
                {health.actionItems?.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#111c35] border border-[#1e2a47] flex items-start gap-3 text-xs">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-slate-200 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  )
}
