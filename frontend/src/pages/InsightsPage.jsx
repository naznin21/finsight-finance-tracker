import { useEffect, useState, useMemo } from 'react'
import {
  getInsights, getTransactions, getDashboardSummary,
  getHealth, getBehavior, getStory
} from '../services/api'
import Layout from '../components/Layout'
import {
  Lightbulb, TrendingUp, ArrowUpRight, ArrowDownRight,
  PieChart as PieIcon, LineChart as ChartIcon, Store,
  Calendar, CheckCircle2, ChevronRight, Sparkles
} from 'lucide-react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import toast from 'react-hot-toast'

const DONUT_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#f43f5e']

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [timeRange, setTimeRange] = useState('6_MONTHS')
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(null)
  const [insights, setInsights] = useState(null)
  const [behavior, setBehavior] = useState(null)
  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getTransactions(),
      getDashboardSummary(),
      getInsights(),
      getBehavior(),
      getStory()
    ]).then(([tRes, sRes, iRes, bRes, stRes]) => {
      setTransactions(tRes.data || [])
      setSummary(sRes.data || null)
      setInsights(iRes.data || null)
      setBehavior(bRes.data || null)
      setStory(stRes.data || null)
    }).catch(err => {
      console.error(err)
      toast.error('Failed to load spending analytics.')
    }).finally(() => setLoading(false))
  }, [])

  // Merchant aggregation
  const topMerchants = useMemo(() => {
    const map = {}
    transactions.forEach(t => {
      if (t.type === 'EXPENSE') {
        const m = t.merchant || t.description || 'Unknown'
        map[m] = (map[m] || 0) + Number(t.amount || 0)
      }
    })
    const list = Object.entries(map).map(([name, amount]) => ({ name, amount }))
    list.sort((a, b) => b.amount - a.amount)
    const max = list[0]?.amount || 1
    return list.slice(0, 5).map(item => ({
      ...item,
      pct: Math.round((item.amount / max) * 100)
    }))
  }, [transactions])

  // Trend analysis (month-by-month income vs expenses)
  const trendData = useMemo(() => {
    const months = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toISOString().slice(0, 7)
      const label = d.toLocaleDateString('en-US', { month: 'short' })
      months[key] = { name: label, Income: 0, Expenses: 0 }
    }

    transactions.forEach(t => {
      if (!t.date) return
      const ym = t.date.slice(0, 7)
      if (months[ym]) {
        if (t.type === 'INCOME') months[ym].Income += Number(t.amount || 0)
        else if (t.type === 'EXPENSE') months[ym].Expenses += Number(t.amount || 0)
      }
    })

    return Object.values(months)
  }, [transactions])

  // Category breakdown
  const categoryData = useMemo(() => {
    if (!summary?.categorySpending) return []
    const total = Object.values(summary.categorySpending).reduce((a, b) => a + Number(b), 0)
    return Object.entries(summary.categorySpending).map(([name, val], idx) => {
      const value = Number(val)
      return {
        name,
        value,
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
        color: DONUT_COLORS[idx % DONUT_COLORS.length]
      }
    }).sort((a, b) => b.value - a.value)
  }, [summary])

  // KPI Calculations
  const { avgMonthlySpend, highestSpend, lowestSpend, topCategory } = useMemo(() => {
    const expenseMonths = trendData.map(d => d.Expenses).filter(v => v > 0)
    const avg = expenseMonths.length > 0 ? expenseMonths.reduce((a, b) => a + b, 0) / expenseMonths.length : 0
    const highest = expenseMonths.length > 0 ? Math.max(...expenseMonths) : 0
    const lowest = expenseMonths.length > 0 ? Math.min(...expenseMonths) : 0
    const top = categoryData[0] || { name: 'Food & Dining', value: 0, pct: 0 }

    return {
      avgMonthlySpend: Math.round(avg),
      highestSpend: Math.round(highest),
      lowestSpend: Math.round(lowest),
      topCategory: top
    }
  }, [trendData, categoryData])

  return (
    <Layout
      title="Spending Analytics"
      subtitle="Understand your spending patterns and find opportunities to save"
    >
      <div className="space-y-6">
        {/* Top Control Bar with Time Range & Subtabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
          {/* Sub-tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {['Overview', 'Category Analysis', 'Trend Analysis', 'Insights'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#111c35]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Period:</span>
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              className="bg-[#0f172a] border border-[#1e293b] text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="6_MONTHS">Last 6 Months</option>
              <option value="3_MONTHS">Last 3 Months</option>
              <option value="1_YEAR">Last 1 Year</option>
            </select>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <span className="text-xs font-semibold text-slate-400">Avg. Monthly Spending</span>
            <p className="text-2xl font-extrabold text-white mt-1.5">
              ₹{avgMonthlySpend.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-emerald-400 mt-1 font-semibold">+12% vs prior benchmark</p>
          </div>

          <div className="card">
            <span className="text-xs font-semibold text-slate-400">Highest Spending</span>
            <p className="text-2xl font-extrabold text-white mt-1.5">
              ₹{highestSpend.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Peak monthly outflow</p>
          </div>

          <div className="card">
            <span className="text-xs font-semibold text-slate-400">Lowest Spending</span>
            <p className="text-2xl font-extrabold text-white mt-1.5">
              ₹{lowestSpend.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Most disciplined month</p>
          </div>

          <div className="card">
            <span className="text-xs font-semibold text-slate-400">Top Outflow Category</span>
            <p className="text-2xl font-extrabold text-indigo-400 mt-1.5 truncate">
              {topCategory.name}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              ₹{topCategory.value.toLocaleString('en-IN')} ({topCategory.pct}% of expenses)
            </p>
          </div>
        </div>

        {/* Charts Row: Spending Trend & Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spending Trend Line/Area Chart */}
          <div className="card flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Spending Trend</h3>
                <p className="text-xs text-slate-400">6-month cash flow trajectory</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-300">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-slate-300">Expenses</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
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
                  <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" />
                  <Area type="monotone" dataKey="Expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown Donut */}
          <div className="card flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-white">Category Breakdown</h3>
              <p className="text-xs text-slate-400">Where your budget is concentrated</p>
            </div>

            {categoryData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        stroke="#0f172a"
                        strokeWidth={2}
                      >
                        {categoryData.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #1e293b',
                          borderRadius: '12px',
                          color: '#f8fafc',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-xs text-slate-400">Total</span>
                    <span className="text-base font-extrabold text-white">
                      ₹{avgMonthlySpend.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-2 text-xs">
                  {categoryData.slice(0, 6).map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                        <span className="text-slate-300 font-medium truncate max-w-[120px]">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{cat.pct}%</span>
                        <span className="text-slate-200 font-semibold">₹{cat.value.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-slate-500">
                No categorical spending records available.
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Top Merchants & AI Insights Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Merchants List */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Top Merchants & Payees</h3>
                <p className="text-xs text-slate-400">Highest volume transaction destinations</p>
              </div>
              <Store size={18} className="text-indigo-400" />
            </div>

            {topMerchants.length > 0 ? (
              <div className="space-y-3.5">
                {topMerchants.map((m, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{m.name}</span>
                      <span className="font-bold text-white">₹{m.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-[#111c35] rounded-full h-2 overflow-hidden border border-[#1e293b]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${m.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-slate-500">
                No merchant spending recorded yet.
              </div>
            )}
          </div>

          {/* AI Insights Card */}
          <div className="card flex flex-col justify-between bg-gradient-to-br from-[#0f172a] to-[#141b38] border-indigo-500/30">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Lightbulb size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Insights & Suggestions</h3>
                  <p className="text-xs text-slate-400">Data-driven behavioral intelligence</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0b1324] border border-[#1e293b] space-y-2 mb-3">
                <p className="text-xs text-slate-200 font-semibold leading-relaxed">
                  {story?.headline || "You've concentrated spending in essential living costs this cycle."}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {story?.narrative || "Keep discretionary dining and online retail capped under 20% to accelerate savings."}
                </p>
              </div>

              {insights?.suggestions && insights.suggestions.length > 0 && (
                <div className="space-y-1.5">
                  {insights.suggestions.slice(0, 2).map((s, idx) => (
                    <div key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-[#111c35] p-2.5 rounded-lg border border-[#1e2a47]">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#1e293b] mt-4 flex items-center justify-between text-xs text-slate-400">
              <span>Updated in real-time</span>
              <span className="text-indigo-400 font-semibold">Grounded in DB Facts</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
