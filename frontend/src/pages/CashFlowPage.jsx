import { useEffect, useState } from 'react'
import { getSubscriptionsSummary, getForecast } from '../services/api'
import Layout from '../components/Layout'
import { Calendar, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'

export default function CashFlowPage() {
  const [subs, setSubs] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getSubscriptionsSummary().then(r => setSubs(r.data)).catch(() => {}),
      getForecast().then(r => setForecast(r.data)).catch(() => {})
    ]).finally(() => setLoading(false))
  }, [])

  return (
    <Layout
      title="Cash Flow Timeline"
      subtitle="Anticipated in-flows, commitments, and payment obligations by date"
    >
      <div className="space-y-6">
        {forecast && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card">
              <span className="text-xs font-semibold text-slate-400">Expected Monthly In-Flow</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1.5">
                ₹{Number(forecast.currentIncome || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Confirmed inflow pace</p>
            </div>
            <div className="card">
              <span className="text-xs font-semibold text-slate-400">Committed Out-Flow</span>
              <p className="text-2xl font-bold text-rose-400 mt-1.5">
                ₹{Number(forecast.projectedMonthEndExpense || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Run-rate + subscriptions</p>
            </div>
            <div className="card">
              <span className="text-xs font-semibold text-slate-400">Projected Month-End Reserve</span>
              <p className="text-2xl font-bold text-indigo-400 mt-1.5">
                ₹{Number(forecast.projectedMonthEndBalance || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Estimated closing buffer</p>
            </div>
          </div>
        )}

        {/* Chronological Stream */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
            <Calendar size={18} className="text-indigo-400" />
            <h2 className="font-bold text-white text-sm">Upcoming Obligations & Money Movements</h2>
          </div>

          <div className="space-y-3">
            {subs?.items?.map((item, idx) => (
              <div key={idx} className="p-3.5 bg-[#111c35] rounded-xl border border-[#1e2a47] flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold text-xs border border-rose-500/20">
                    <ArrowDownRight size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">
                      Due: <span className="text-indigo-400 font-semibold">{item.nextDueDate}</span> ({item.frequency})
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-rose-400 text-sm">-₹{Number(item.amount).toLocaleString('en-IN')}</p>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    item.isEssential ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                  }`}>
                    {item.isEssential ? 'ESSENTIAL' : 'OPTIONAL'}
                  </span>
                </div>
              </div>
            ))}

            {(!subs?.items || subs.items.length === 0) && !loading && (
              <p className="text-center text-slate-500 py-10 text-xs">
                No scheduled recurring movements found for this cycle.
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
