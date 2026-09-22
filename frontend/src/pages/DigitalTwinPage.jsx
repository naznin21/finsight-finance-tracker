import { useEffect, useState } from 'react'
import { getDigitalTwin } from '../services/api'
import Layout from '../components/Layout'
import CopilotWidget from '../components/CopilotWidget'
import { LineChart, Sparkles, ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react'

export default function DigitalTwinPage() {
  const [twin, setTwin] = useState(null)

  useEffect(() => {
    getDigitalTwin().then(r => setTwin(r.data)).catch(() => {})
  }, [])

  return (
    <Layout title="Financial Digital Twin" subtitle="My Financial Future — Projected trajectory over 1, 3, 6, and 12 months">
      {twin && (
        <>
          {/* Summary Narrative Banner */}
          <div className="card bg-panel2 border-line space-y-2">
            <div className="flex items-center gap-2 text-accent font-bold text-sm">
              <Sparkles size={18} />
              <span>Digital Twin Trajectory Summary</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{twin.summaryNarrative}</p>
          </div>

          {/* Trajectory Table Comparison */}
          <div className="card space-y-4">
            <h2 className="font-bold text-slate-100 text-sm">Trajectory Comparison: Current Path vs Optimized Path</h2>

            <div className="border border-line rounded-xl overflow-hidden text-xs">
              <table className="w-full">
                <thead className="table-head">
                  <tr>
                    <th className="p-3 text-left">Time Horizon</th>
                    <th className="p-3 text-right">Current Path Balance</th>
                    <th className="p-3 text-right">Optimized Path Balance</th>
                    <th className="p-3 text-right">Wealth Increase Delta</th>
                    <th className="p-3 text-center">Avg Goal Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {twin.currentTrajectory.map((cur, i) => {
                    const opt = twin.optimizedTrajectory[i]
                    const delta = opt.projectedSavings - cur.projectedSavings
                    return (
                      <tr key={i} className="table-row">
                        <td className="p-3 font-semibold text-slate-200">{cur.timeLabel}</td>
                        <td className="p-3 text-right text-slate-300 font-medium">₹{cur.projectedSavings.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right text-accent font-bold">₹{opt.projectedSavings.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right text-income font-bold">+₹{delta.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-center text-slate-300">{opt.averageGoalProgressPct.toFixed(1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <CopilotWidget />
    </Layout>
  )
}
