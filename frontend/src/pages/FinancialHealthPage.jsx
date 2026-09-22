import { useEffect, useState } from 'react'
import { getHealth } from '../services/api'
import Layout from '../components/Layout'
import CopilotWidget from '../components/CopilotWidget'
import { ShieldCheck, TrendingUp, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'

export default function FinancialHealthPage() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    getHealth().then(r => setHealth(r.data)).catch(() => {})
  }, [])

  return (
    <Layout title="Financial Health Score 2.0" subtitle="Multi-pillar financial health assessment and historical trend analysis">
      {health && (
        <>
          {/* Main Health Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card lg:col-span-1 text-center flex flex-col justify-center items-center p-8">
              <div className="w-20 h-20 rounded-full bg-accent/15 text-accent flex items-center justify-center mb-4">
                <ShieldCheck size={44} />
              </div>
              <h2 className="text-5xl font-extrabold text-slate-50 tracking-tight">{health.overallScore}</h2>
              <p className="text-muted text-sm font-medium mt-1">Overall Health Score / 100</p>
              <span className={`mt-3 px-3 py-1 rounded-full text-xs font-bold ${
                health.overallScore >= 80 ? 'bg-income/20 text-income' :
                health.overallScore >= 65 ? 'bg-accent/20 text-accent' :
                'bg-amber-400/20 text-amber-400'
              }`}>
                {health.rating}
              </span>
            </div>

            {/* 5 Pillars Progress */}
            <div className="card lg:col-span-2 space-y-4">
              <h2 className="font-bold text-slate-100 text-sm">Health Score Components</h2>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1 font-medium">
                    <span className="text-slate-200">Savings Rate (25% weight)</span>
                    <span className="text-accent font-bold">{health.savingsScore} / 100</span>
                  </div>
                  <div className="w-full bg-line rounded-full h-2.5">
                    <div className="bg-accent h-2.5 rounded-full transition-all" style={{ width: `${health.savingsScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 font-medium">
                    <span className="text-slate-200">Budget Discipline (25% weight)</span>
                    <span className="text-income font-bold">{health.budgetDisciplineScore} / 100</span>
                  </div>
                  <div className="w-full bg-line rounded-full h-2.5">
                    <div className="bg-income h-2.5 rounded-full transition-all" style={{ width: `${health.budgetDisciplineScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 font-medium">
                    <span className="text-slate-200">Expense Stability (20% weight)</span>
                    <span className="text-amber-400 font-bold">{health.stabilityScore} / 100</span>
                  </div>
                  <div className="w-full bg-line rounded-full h-2.5">
                    <div className="bg-amber-400 h-2.5 rounded-full transition-all" style={{ width: `${health.stabilityScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 font-medium">
                    <span className="text-slate-200">Goal Progress (15% weight)</span>
                    <span className="text-slate-100 font-bold">{health.goalProgressScore} / 100</span>
                  </div>
                  <div className="w-full bg-line rounded-full h-2.5">
                    <div className="bg-slate-200 h-2.5 rounded-full transition-all" style={{ width: `${health.goalProgressScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1 font-medium">
                    <span className="text-slate-200">Obligation Ratio (15% weight)</span>
                    <span className="text-accent font-bold">{health.obligationScore} / 100</span>
                  </div>
                  <div className="w-full bg-line rounded-full h-2.5">
                    <div className="bg-accent h-2.5 rounded-full transition-all" style={{ width: `${health.obligationScore}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historical 4-Month Trend Timeline */}
          <div className="card space-y-3">
            <h2 className="font-bold text-slate-100 text-sm">4-Month Health Score Trend</h2>
            <div className="grid grid-cols-4 gap-3">
              {health.trend.map((t, idx) => (
                <div key={idx} className="bg-panel2 p-3.5 rounded-xl border border-line text-center">
                  <p className="text-xs text-muted font-medium">{t.month}</p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">{t.score}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Health Recommendations */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2 text-accent font-bold text-sm">
              <Sparkles size={18} />
              <span>Priority Action Items</span>
            </div>
            <div className="space-y-2 text-xs">
              {health.actionItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-panel2 rounded-xl border border-line text-slate-200 flex items-center gap-2">
                  <span className="text-accent">→</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <CopilotWidget />
    </Layout>
  )
}
