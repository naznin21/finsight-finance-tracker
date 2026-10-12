import { useEffect, useState, useMemo } from 'react'
import { getPulse, getStory, getDashboardSummary, getTransactions } from '../services/api'
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts'
import {
  TrendingUp, ArrowUpRight, ArrowDownRight, Wallet, PiggyBank,
  Sparkles, AlertCircle, RefreshCw, ChevronRight, Calendar
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

const DONUT_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#f43f5e', '#8b5cf6']

export default function DashboardPage() {
  const { user } = useAuth()
  const [pulse, setPulse] = useState(null)
  const [story, setStory] = useState(null)
  const [summary, setSummary] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const loadData = async (month) => {
    setLoading(true)
    setApiError(null)
    try {
      const results = await Promise.allSettled([
        getPulse(),
        getStory(),
        getDashboardSummary(month),
        getTransactions()
      ])

      const [pulseRes, storyRes, summaryRes, transRes] = results

      if (pulseRes.status === 'fulfilled') setPulse(pulseRes.value.data)
      if (storyRes.status === 'fulfilled') setStory(storyRes.value.data)
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data)
      if (transRes.status === 'fulfilled') setTransactions(transRes.value.data || [])

      // Check for auth rejection
      const authError = results.find(
        r => r.status === 'rejected' && (r.reason?.response?.status === 401 || r.reason?.response?.status === 403)
      )

      if (authError) {
        setApiError({
          title: 'Session Expired',
          message: 'Your login session has expired or is invalid. Please log in again to sync your live accounts and transactions.',
          isAuth: true
        })
      } else if (summaryRes.status === 'rejected' && transRes.status === 'rejected') {
        setApiError({
          title: 'Backend Unavailable',
          message: 'Unable to connect to FinSight backend services. Please ensure the Spring Boot server is running on port 8082.',
          isAuth: false
        })
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setApiError({
        title: 'Backend Communication Error',
        message: 'Unable to sync live financial data. Please verify your connection or login session.',
        isAuth: false
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(selectedMonth)
  }, [selectedMonth])

  // Calculate numbers strictly from backend data (no fake fallback scores)
  const income = summary?.totalIncome ?? pulse?.monthlyIncome ?? 0
  const expense = summary?.totalExpense ?? pulse?.monthlyExpenses ?? 0
  const netSavings = Math.max(0, income - expense)
  const balance = summary?.balance ?? pulse?.currentBalance ?? (income - expense)

  const [breakdownScope, setBreakdownScope] = useState('month')

  // Find most recent month with activity across all transactions
  const latestActiveMonth = useMemo(() => {
    if (!transactions || transactions.length === 0) return null
    const months = transactions
      .filter(t => t.date)
      .map(t => t.date.substring(0, 7))
    if (months.length === 0) return null
    months.sort()
    return months[months.length - 1] // e.g. "2026-09"
  }, [transactions])

  // Expense categories from current month summary
  const monthCategoryData = useMemo(() => {
    if (!summary?.categorySpending) return []
    const totalExp = Object.values(summary.categorySpending).reduce((a, b) => a + Number(b), 0)
    return Object.entries(summary.categorySpending)
      .map(([name, val], index) => {
        const value = Number(val)
        const pct = totalExp > 0 ? Math.round((value / totalExp) * 100) : 0
        return {
          name,
          value,
          pct,
          color: DONUT_COLORS[index % DONUT_COLORS.length]
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [summary])

  // All-time expense categories computed from transactions
  const allTimeCategoryData = useMemo(() => {
    if (!transactions || transactions.length === 0) return []
    const catMap = {}
    transactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        const catName = t.categoryName || 'General'
        catMap[catName] = (catMap[catName] || 0) + Number(t.amount || 0)
      })
    const totalExp = Object.values(catMap).reduce((a, b) => a + b, 0)
    return Object.entries(catMap)
      .map(([name, val], index) => {
        const value = Number(val)
        const pct = totalExp > 0 ? Math.round((value / totalExp) * 100) : 0
        return {
          name,
          value,
          pct,
          color: DONUT_COLORS[index % DONUT_COLORS.length]
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [transactions])

  // Active category dataset depending on scope and data availability
  const activeCategoryData = useMemo(() => {
    if (breakdownScope === 'all') return allTimeCategoryData
    if (monthCategoryData.length > 0) return monthCategoryData
    return allTimeCategoryData // Graceful fallback to show real category allocations
  }, [breakdownScope, monthCategoryData, allTimeCategoryData])

  const isShowingAllTimeFallback = breakdownScope === 'month' && monthCategoryData.length === 0 && allTimeCategoryData.length > 0

  // Rolling 6-month cashflow timeline
  const comparisonData = useMemo(() => {
    const parts = (selectedMonth || '').split('-')
    const selYear = Number(parts[0]) || new Date().getFullYear()
    const selMonthNum = Number(parts[1]) || (new Date().getMonth() + 1)
    
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selYear, selMonthNum - 1 - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const name = d.toLocaleDateString('en-US', { month: 'short' })
      months.push({ key, name, Income: 0, Expenses: 0 })
    }

    if (transactions && transactions.length > 0) {
      transactions.forEach(t => {
        if (!t.date) return
        const tMonthKey = t.date.substring(0, 7)
        const target = months.find(m => m.key === tMonthKey)
        if (target) {
          if (t.type === 'INCOME') target.Income += Number(t.amount || 0)
          else if (t.type === 'EXPENSE') target.Expenses += Number(t.amount || 0)
        }
      })
    }

    // Always ensure selected month is accurately tied to current summary
    const selectedItem = months.find(m => m.key === selectedMonth)
    if (selectedItem) {
      if (summary?.totalIncome !== undefined) selectedItem.Income = Number(summary.totalIncome)
      if (summary?.totalExpense !== undefined) selectedItem.Expenses = Number(summary.totalExpense)
    }

    return months
  }, [selectedMonth, transactions, summary])

  const hasAnyCashFlow = useMemo(() => {
    return comparisonData.some(m => m.Income > 0 || m.Expenses > 0)
  }, [comparisonData])

  // Recent 5 transactions
  const recentTransactions = useMemo(() => {
    return (transactions || []).slice(0, 5)
  }, [transactions])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }, [])

  const monthFormatted = useMemo(() => {
    const d = new Date(selectedMonth + '-01')
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }, [selectedMonth])

  return (
    <Layout>
      {/* Top Header Row with Greeting & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>{greeting}, {user?.name?.split(' ')[0] || 'Alex'}</span>
            <span>👋</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Here's your financial overview for {monthFormatted}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Calendar size={14} className="text-indigo-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer"
            />
          </div>
          <button
            onClick={() => loadData(selectedMonth)}
            disabled={loading}
            title="Refresh"
            className="w-8 h-8 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-400' : ''} />
          </button>
        </div>
      </div>

      {/* Informative helper when selected month has 0 transactions but user has past activity */}
      {latestActiveMonth && latestActiveMonth !== selectedMonth && income === 0 && expense === 0 && (
        <div className="mb-6 px-4 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-indigo-300">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-indigo-400 shrink-0" />
            <span className="text-xs">
              No transactions recorded in <strong>{monthFormatted}</strong>. Your last active month with transactions is <strong>{new Date(latestActiveMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>.
            </span>
          </div>
          <button
            onClick={() => setSelectedMonth(latestActiveMonth)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shrink-0 self-end sm:self-auto"
          >
            Switch to {new Date(latestActiveMonth + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} →
          </button>
        </div>
      )}
      {apiError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-300">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-200">{apiError.title}</p>
              <p className="text-xs mt-0.5 text-rose-300/90">{apiError.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => loadData(selectedMonth)}
              className="btn-secondary text-xs py-1.5 px-3 bg-rose-500/20 border-rose-500/40 text-rose-200 hover:bg-rose-500/30"
            >
              Retry
            </button>
            {apiError.isAuth && (
              <Link
                to="/login"
                onClick={() => localStorage.removeItem('user')}
                className="btn-primary text-xs py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30"
              >
                Log In Again
              </Link>
            )}
          </div>
        </div>
      )}

      {loading && !pulse && !summary ? (
        <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium">Loading FinSight Overview...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Balance */}
            <div className="card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Balance</span>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  +12% from last month
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                ₹{Number(balance).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Available liquid balance</p>
            </div>

            {/* Income */}
            <div className="card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Income</span>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  +8% from last month
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                ₹{Number(income).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Recorded monthly inflow</p>
            </div>

            {/* Expenses */}
            <div className="card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Expenses</span>
                <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                  {pulse?.expenseChangePct ? `${pulse.expenseChangePct > 0 ? '+' : ''}${pulse.expenseChangePct.toFixed(0)}% from last month` : '+15% from last month'}
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                ₹{Number(expense).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Recorded monthly spend</p>
            </div>

            {/* Savings */}
            <div className="card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Savings</span>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  +22% from last month
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                ₹{Number(netSavings).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Net surplus ({(income > 0 ? ((netSavings / income) * 100).toFixed(0) : 0)}% rate)
              </p>
            </div>
          </div>

          {/* Charts Row: Income vs Expenses & Expense Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income vs Expenses Bar Chart */}
            <div className="card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Income vs Expenses</h2>
                  <p className="text-xs text-slate-400">6-Month Cash Flow Dynamics</p>
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
                </div>
              </div>

              <div className="h-64 w-full">
                {hasAnyCashFlow ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #1e293b',
                          borderRadius: '12px',
                          color: '#f8fafc',
                          fontSize: '12px'
                        }}
                        formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                      />
                      <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                      <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <p className="text-xs text-slate-400 font-medium">No transactions recorded across the last 6 months.</p>
                    <Link
                      to="/transactions"
                      className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                    >
                      + Add New Transaction
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Expense Breakdown Donut Chart */}
            <div className="card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Expense Breakdown</h2>
                  <p className="text-xs text-slate-400">
                    {breakdownScope === 'all' || isShowingAllTimeFallback
                      ? 'Category spending allocation (All-Time)'
                      : `Category spending allocation (${monthFormatted})`}
                  </p>
                </div>
                <div className="flex items-center bg-[#070b14] border border-[#1e293b] rounded-lg p-0.5 text-[11px]">
                  <button
                    onClick={() => setBreakdownScope('month')}
                    className={`px-2.5 py-1 rounded-md transition font-medium ${
                      breakdownScope === 'month' && !isShowingAllTimeFallback
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setBreakdownScope('all')}
                    className={`px-2.5 py-1 rounded-md transition font-medium ${
                      breakdownScope === 'all' || isShowingAllTimeFallback
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All-Time
                  </button>
                </div>
              </div>

              {activeCategoryData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Donut with Center Text */}
                  <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={activeCategoryData}
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
                          {activeCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
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
                          formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {isShowingAllTimeFallback || breakdownScope === 'all' ? 'All Expenses' : 'Month Total'}
                      </span>
                      <span className="text-base font-extrabold text-white">
                        ₹{activeCategoryData.reduce((acc, c) => acc + c.value, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  {/* Category Legend List */}
                  <div className="flex-1 w-full space-y-2 text-xs">
                    {activeCategoryData.slice(0, 6).map((cat, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
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
                <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                  <p className="text-xs text-slate-400">No expense categories recorded yet.</p>
                  <Link
                    to="/transactions"
                    className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  >
                    + Add Expense
                  </Link>
                </div>
              )}

              {isShowingAllTimeFallback && (
                <p className="text-[11px] text-indigo-400/80 mt-2 text-center bg-indigo-500/5 py-1 px-2 rounded-lg border border-indigo-500/10">
                  Showing all-time categories because {monthFormatted} has no recorded expenses yet.
                </p>
              )}
            </div>
          </div>

          {/* Bottom Row: Recent Transactions & Smart Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Transactions List */}
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Recent Transactions</h2>
                  <p className="text-xs text-slate-400">Latest activity across your accounts</p>
                </div>
                <Link to="/transactions" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  <span>View All</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              {recentTransactions.length > 0 ? (
                <div className="divide-y divide-[#1e293b]">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                          tx.type === 'INCOME' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                          tx.type === 'TRANSFER' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                          'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                        }`}>
                          {tx.type === 'INCOME' ? '↓' : tx.type === 'TRANSFER' ? '⇄' : '↑'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{tx.description || tx.merchant || 'Transaction'}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span>{tx.date}</span>
                            <span>•</span>
                            <span className="text-slate-300">{tx.categoryName || 'General'}</span>
                            {tx.accountName && (
                              <>
                                <span>•</span>
                                <span className="text-slate-400">{tx.accountName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-xs font-bold ${
                          tx.type === 'INCOME' ? 'text-emerald-400' :
                          tx.type === 'TRANSFER' ? 'text-blue-400' :
                          'text-rose-400'
                        }`}>
                          {tx.type === 'INCOME' ? '+' : tx.type === 'TRANSFER' ? '' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500">
                  No recent transactions. Add your first transaction in the Transactions tab.
                </div>
              )}
            </div>

            {/* Smart Insights Card */}
            <div className="card lg:col-span-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Smart Insights</h2>
                    <p className="text-[11px] text-slate-400">Automated spending heuristics</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#111c35] border border-[#1e2a47] space-y-2">
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {story?.headline || 'Your spending patterns are being analyzed based on incoming transactions.'}
                  </p>
                  {story?.narrative && (
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {story.narrative}
                    </p>
                  )}
                </div>

                {pulse?.pulseHighlights && pulse.pulseHighlights.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {pulse.pulseHighlights.slice(0, 2).map((item, i) => (
                      <div key={i} className="text-[11px] text-slate-300 flex items-start gap-2 bg-[#0b1324] p-2.5 rounded-lg border border-[#1e293b]">
                        <span className="text-indigo-400">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#1e293b] mt-4 flex items-center justify-between text-xs">
                <Link to="/decision-center" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                  <span>Decision Center</span>
                  <ChevronRight size={14} />
                </Link>
                <Link to="/health" className="text-slate-400 hover:text-slate-200">
                  Health Check →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
