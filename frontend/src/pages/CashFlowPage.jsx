import { useEffect, useState } from 'react'
import { getSubscriptionsSummary, getForecast } from '../services/api'
import Layout from '../components/Layout'
import CopilotWidget from '../components/CopilotWidget'
import { Calendar, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'

export default function CashFlowPage() {
  const [subs, setSubs] = useState(null)
  const [forecast, setForecast] = useState(null)

  useEffect(() => {
    getSubscriptionsSummary().then(r => setSubs(r.data)).catch(() => {})
    getForecast().then(r => setForecast(r.data)).catch(() => {})
  }, [])

  return (
    <Layout title="Cash Flow & Money Movement Timeline" subtitle="Expected future in-flows, out-flows, and recurring obligations by date">
      {forecast && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card">
            <p className="text-muted text-xs font-semibold uppercase">Expected Monthly In-Flow</p>
            <p className="text-2xl font-bold text-income mt-1">₹{forecast.currentIncome.toLocaleString('en-IN')}</p>
          </div>
          <div className="card">
            <p className="text-muted text-xs font-semibold uppercase">Expected Out-Flow & Commitments</p>
            <p className="text-2xl font-bold text-expense mt-1">₹{forecast.projectedMonthEndExpense.toLocaleString('en-IN')}</p>
          </div>
          <div className="card">
            <p className="text-muted text-xs font-semibold uppercase">Lowest Projected Balance</p>
            <p className="text-2xl font-bold text-accent mt-1">₹{forecast.projectedMonthEndBalance.toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      {/* Chronological Stream */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={18} className="text-accent" />
          <h2 className="font-bold text-slate-100 text-sm">Upcoming Obligations & Money Movements</h2>
        </div>

        <div className="space-y-3">
          {subs?.items?.map((item, idx) => (
            <div key={idx} className="p-3.5 bg-panel2 rounded-xl border border-line flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-expense/15 text-expense flex items-center justify-center font-bold text-xs">
                  <ArrowDownRight size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-100">{item.name}</p>
                  <p className="text-muted text-[10px]">Due Date: <span className="text-accent font-semibold">{item.nextDueDate}</span> ({item.frequency})</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-expense text-sm">-₹{item.amount}</p>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  item.isEssential ? 'bg-income/20 text-income' : 'bg-accent/20 text-accent'
                }`}>
                  {item.isEssential ? 'ESSENTIAL' : 'OPTIONAL'}
                </span>
              </div>
            </div>
          ))}

          {(!subs?.items || subs.items.length === 0) && (
            <p className="text-center text-muted text-xs py-10">No upcoming recurring money movements found.</p>
          )}
        </div>
      </div>

      <CopilotWidget />
    </Layout>
  )
}
