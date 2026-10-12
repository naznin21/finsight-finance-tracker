import { useEffect, useState } from 'react'
import { getDigitalTwin } from '../services/api'
import Layout from '../components/Layout'
import {
  LineChart as LineChartIcon, Sparkles, ArrowRight,
  ShieldCheck, TrendingUp
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import toast from 'react-hot-toast'

export default function DigitalTwinPage() {
  const [twin, setTwin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getDigitalTwin()
      .then(r => setTwin(r.data))
      .catch(err => {
        console.error(err)
        toast.error('Failed to load Digital Twin.')
      })
      .finally(() => setLoading(false))
  }, [])

  // Chart data from current vs optimized trajectories
  const chartData = twin ? twin.currentTrajectory.map((cur, i) => {
    const opt = twin.optimizedTrajectory[i]
    return {
      name: cur.timeLabel,
      'Current Path': Number(cur.projectedSavings || 0),
      'Optimized Path': Number(opt?.projectedSavings || 0)
    }
  }) : []

  return (
    <Layout
      title="Financial Digital Twin"
      subtitle="Projected wealth trajectory over 1, 3, 6, and 12 months with automated optimization"
    >
      {twin && (
        <div className="space-y-6">
          {/* Summary Narrative Banner */}
          <div className="card bg-gradient-to-br from-[#0f172a] to-[#121f3f] border-indigo-500/30 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Sparkles size={18} />
              <span>Digital Twin Trajectory Summary</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {twin.summaryNarrative}
            </p>
          </div>

          {/* Chart Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Projected Net Wealth Trajectory</h3>
                <p className="text-xs text-slate-400">Baseline savings rate vs disciplined +10% target</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <span className="text-slate-300">Current</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span className="text-slate-300">Optimized</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                  <Line type="monotone" dataKey="Current Path" stroke="#64748b" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Optimized Path" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trajectory Table Comparison */}
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-[#1e293b]">
              <h2 className="font-bold text-white text-sm">Milestone Breakdown Table</h2>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="table-head">
                  <tr className="border-b border-[#1e293b]">
                    <th className="py-3 px-4">Horizon</th>
                    <th className="py-3 px-4 text-right">Current Path</th>
                    <th className="py-3 px-4 text-right">Optimized Path</th>
                    <th className="py-3 px-4 text-right">Surplus Delta</th>
                    <th className="py-3 px-4 text-center">Avg Goal Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {twin.currentTrajectory.map((cur, i) => {
                    const opt = twin.optimizedTrajectory[i]
                    const delta = (opt?.projectedSavings || 0) - (cur.projectedSavings || 0)
                    return (
                      <tr key={i} className="table-row">
                        <td className="py-3.5 px-4 font-semibold text-white">{cur.timeLabel}</td>
                        <td className="py-3.5 px-4 text-right text-slate-300 font-medium">₹{Number(cur.projectedSavings || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-4 text-right text-indigo-400 font-bold">₹{Number(opt?.projectedSavings || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">+₹{Number(delta).toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-4 text-center text-slate-300">
                          <span className="badge-violet">{Number(opt?.averageGoalProgressPct || 0).toFixed(0)}%</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
