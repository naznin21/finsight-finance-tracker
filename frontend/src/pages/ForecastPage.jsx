import { useEffect, useState } from 'react'
import { getForecast } from '../services/api'
import Layout from '../components/Layout'
import CopilotWidget from '../components/CopilotWidget'
import { TrendingUp, AlertTriangle, CheckCircle2, Info, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react'

export default function ForecastPage() {
  const [forecast, setForecast] = useState(null)

  useEffect(() => {
    getForecast().then(r => setForecast(r.data)).catch(() => {})
  }, [])

  return (
    <Layout title="Financial Forecasting & Projections" subtitle="Run-rate projections, month-end balance forecasts, and category risk radar">
      {forecast && (
        <>
          {/* Top Forecast Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-muted text-xs font-semibold uppercase tracking-wider">Current Month Income</p>
              <p className="text-2xl font-bold text-income mt-2">₹{forecast.currentIncome.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted mt-1">Recorded in-flow</p>
            </div>

            <div className="card">
              <p className="text-muted text-xs font-semibold uppercase tracking-wider">Projected Month-End Expense</p>
              <p className="text-2xl font-bold text-expense mt-2">₹{forecast.projectedMonthEndExpense.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted mt-1">Run-rate + recurring obligations</p>
            </div>

            <div className="card">
              <p className="text-muted text-xs font-semibold uppercase tracking-wider">Projected Month-End Balance</p>
              <p className="text-2xl font-bold text-accent mt-2">₹{forecast.projectedMonthEndBalance.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted mt-1">Estimated closing surplus</p>
            </div>

            <div className="card">
              <p className="text-muted text-xs font-semibold uppercase tracking-wider">Projected Savings Rate</p>
              <p className="text-2xl font-bold text-slate-50 mt-2">{forecast.projectedSavingsRate.toFixed(1)}%</p>
              <p className="text-xs text-muted mt-1">Model: {forecast.forecastMethod}</p>
            </div>
          </div>

          {/* Forecast Explanation Banner */}
          <div className="card bg-panel2 border-line space-y-2">
            <div className="flex items-center gap-2 text-accent font-bold text-sm">
              <TrendingUp size={18} />
              <span>Forecast Engine Methodology</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This forecast combines your current daily burn rate with scheduled active recurring obligations (rent, EMIs, subscriptions) for the remainder of {forecast.month}.
            </p>
          </div>

          {/* Category Budget Risk Radar */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-100 text-sm">Category Budget Risk Radar</h2>
              <span className="text-xs text-muted">Run-rate projection vs budget limit</span>
            </div>

            <div className="border border-line rounded-xl overflow-hidden text-xs">
              <table className="w-full">
                <thead className="table-head">
                  <tr>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-right">Budget Limit</th>
                    <th className="p-3 text-right">Spent to Date</th>
                    <th className="p-3 text-right">Projected Month-End</th>
                    <th className="p-3 text-center">Risk Status</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.categoryRisks.map((c, i) => (
                    <tr key={i} className="table-row">
                      <td className="p-3 font-semibold text-slate-200">{c.categoryName}</td>
                      <td className="p-3 text-right text-slate-300">₹{c.budgetAmount}</td>
                      <td className="p-3 text-right text-slate-200 font-medium">₹{c.spentAmount}</td>
                      <td className="p-3 text-right text-accent font-bold">₹{c.projectedAmount}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          c.riskLevel === 'SAFE' ? 'bg-income/20 text-income' :
                          c.riskLevel === 'WATCH' ? 'bg-accent/20 text-accent' :
                          c.riskLevel === 'AT_RISK' ? 'bg-amber-400/20 text-amber-400' :
                          'bg-expense/20 text-expense'
                        }`}>
                          {c.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {forecast.categoryRisks.length === 0 && (
                    <tr><td colSpan={5} className="p-6 text-center text-muted">No category budgets defined for this month.</td></tr>
                  )}
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
