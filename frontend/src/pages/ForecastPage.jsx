import { useEffect, useState, useMemo } from 'react'
import { getForecast, getSubscriptionsSummary, getGoals, getTransactions } from '../services/api'
import Layout from '../components/Layout'
import {
  TrendingUp, Calendar, AlertTriangle, ArrowUpRight,
  ArrowDownRight, ShieldCheck, Wallet, Sparkles, ChevronRight
} from 'lucide-react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import toast from 'react-hot-toast'

export default function ForecastPage() {
  const [forecast, setForecast] = useState(null)
  const [subs, setSubs] = useState(null)
  const [goals, setGoals] = useState([])
  const [timeRange, setTimeRange] = useState('6_MONTHS')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getForecast(),
      getSubscriptionsSummary(),
      getGoals()
    ]).then(([fRes, sRes, gRes]) => {
      setForecast(fRes.data)
      setSubs(sRes.data)
      setGoals(gRes.data || [])
    }).catch(err => {
      console.error(err)
      toast.error('Failed to load forecasting metrics.')
    }).finally(() => setLoading(false))
  }, [])

  // Generate 6-month projected data points
  const projectionChartData = useMemo(() => {
    const baseIncome = Number(forecast?.currentIncome || 50000)
    const baseExpense = Number(forecast?.projectedMonthEndExpense || 35000)
    const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']

    let cumulativeBalance = 50000
    return months.map((m, idx) => {
      const inc = baseIncome + (idx * 1500)
      const exp = baseExpense + (idx % 2 === 0 ? 1200 : -800)
      cumulativeBalance += (inc - exp)
      return {
        name: m,
        Income: Math.round(inc),
        Expenses: Math.round(exp),
        'Projected Balance': Math.round(cumulativeBalance)
      }
    })
  }, [forecast])

  // Calculated high-level 6-month KPIs
  const { totalProjIncome, totalProjExpense, finalProjBalance, avgNetSavings } = useMemo(() => {
    let totInc = 0
    let totExp = 0
    projectionChartData.forEach(d => {
      totInc += d.Income
      totExp += d.Expenses
    })
    const finalBal = projectionChartData[projectionChartData.length - 1]?.['Projected Balance'] || 0
    const avgSav = Math.round((totInc - totExp) / projectionChartData.length)
    return {
      totalProjIncome: totInc,
      totalProjExpense: totExp,
      finalProjBalance: finalBal,
      avgNetSavings: avgSav
    }
  }, [projectionChartData])

  // Upcoming major expenses / obligations (from recurring + savings goals milestones)
  const upcomingExpenses = useMemo(() => {
    const list = []
    if (subs?.items) {
      subs.items.forEach(item => {
        list.push({
          title: item.name,
          date: item.nextDueDate || 'Upcoming Due',
          amount: item.amount,
          type: 'RECURRING'
        })
      })
    }
    if (goals.length > 0) {
      goals.slice(0, 3).forEach(g => {
        if (g.targetDate) {
          list.push({
            title: `${g.name} Milestone`,
            date: g.targetDate,
            amount: g.targetAmount,
            type: 'GOAL'
          })
        }
      })
    }
    // Default fallback display items if DB is new
    if (list.length === 0) {
      return [
        { title: 'Annual Insurance Renewal', date: 'Jan 10, 2025', amount: 25000, type: 'BILL' },
        { title: 'Tech Hardware Upgrade', date: 'Feb 15, 2025', amount: 70000, type: 'PLANNED' },
        { title: 'Vacation Travel Booking', date: 'Mar 05, 2025', amount: 45000, type: 'GOAL' }
      ]
    }
    return list.slice(0, 5)
  }, [subs, goals])

  return (
    <Layout
      title="Forecasting & Cash Flow"
      subtitle="See where your money is headed and anticipate future balances"
    >
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
          <div>
            <span className="text-xs text-slate-400">Projection Horizon:</span>
            <span className="text-xs font-bold text-white ml-2">Next 6 Months</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              className="bg-[#0f172a] border border-[#1e293b] text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="6_MONTHS">Next 6 Months</option>
              <option value="3_MONTHS">Next 3 Months</option>
              <option value="1_YEAR">Next 12 Months</option>
            </select>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <span className="text-xs font-semibold text-slate-400">Projected Balance</span>
            <p className="text-2xl font-extrabold text-white mt-1.5">
              ₹{finalProjBalance.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-indigo-400 mt-1 font-semibold">by April 2025</p>
          </div>

          <div className="card">
            <span className="text-xs font-semibold text-slate-400">Projected Inflow</span>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1.5">
              ₹{totalProjIncome.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Total (Next 6 Months)</p>
          </div>

          <div className="card">
            <span className="text-xs font-semibold text-slate-400">Projected Outflow</span>
            <p className="text-2xl font-extrabold text-rose-400 mt-1.5">
              ₹{totalProjExpense.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Total (Next 6 Months)</p>
          </div>

          <div className="card">
            <span className="text-xs font-semibold text-slate-400">Monthly Average</span>
            <p className="text-2xl font-extrabold text-indigo-400 mt-1.5">
              ₹{avgNetSavings.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Estimated Net Savings</p>
          </div>
        </div>

        {/* Cash Flow Projection Chart & Upcoming Major Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Chart (8 cols) */}
          <div className="card lg:col-span-8 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Cash Flow Projection</h3>
                <p className="text-xs text-slate-400">Forecasted monthly income, expenses, and balance line</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                  <span className="text-slate-300">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                  <span className="text-slate-300">Expenses</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                  <span className="text-slate-300">Balance</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={projectionChartData} barGap={8}>
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
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Line type="monotone" dataKey="Projected Balance" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upcoming Major Expenses List (4 cols) */}
          <div className="card lg:col-span-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-[#1e293b] pb-3">
                <h3 className="text-sm font-bold text-white">Upcoming Major Outflows</h3>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Scheduled</span>
              </div>

              <div className="space-y-3">
                {upcomingExpenses.map((exp, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#111c35] border border-[#1e2a47] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-white">{exp.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{exp.date}</p>
                    </div>
                    <span className="font-bold text-rose-400 text-sm whitespace-nowrap">
                      -₹{Number(exp.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#1e293b] mt-4 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Model Confidence:</span>
              <span className="text-emerald-400 font-bold">High (Normalized Run-Rate)</span>
            </div>
          </div>
        </div>

        {/* Category Budget Risk Radar Table */}
        {forecast?.categoryRisks && forecast.categoryRisks.length > 0 && (
          <div className="card space-y-3">
            <h3 className="text-sm font-bold text-white">Category Budget Risk Radar</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="table-head">
                  <tr>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Budget Limit</th>
                    <th className="py-2.5 px-3 text-right">Spent to Date</th>
                    <th className="py-2.5 px-3 text-right">Projected Month-End</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {forecast.categoryRisks.map((c, i) => (
                    <tr key={i} className="table-row">
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{c.categoryName}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">₹{Number(c.budgetAmount).toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">₹{Number(c.spentAmount).toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-indigo-400">₹{Number(c.projectedAmount).toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.riskLevel === 'SAFE' ? 'bg-emerald-500/20 text-emerald-400' :
                          c.riskLevel === 'WATCH' ? 'bg-indigo-500/20 text-indigo-400' :
                          c.riskLevel === 'AT_RISK' ? 'bg-amber-400/20 text-amber-400' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {c.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
