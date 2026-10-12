import { useState } from 'react'
import { downloadPdf, downloadExcel, convertCurrency } from '../services/api'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import {
  FileBarChart, FileText, FileSpreadsheet, Globe,
  ArrowRight, Download, Calendar, DollarSign
} from 'lucide-react'

export default function ReportsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [currency, setCurrency] = useState({ from: 'USD', to: 'INR', amount: '1000' })
  const [conversion, setConversion] = useState(null)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async (type) => {
    if (!from || !to) return toast.error('Please select both start and end dates.')
    setDownloading(true)
    try {
      const fn = type === 'pdf' ? downloadPdf : downloadExcel
      const res = await fn(from, to)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = type === 'pdf' ? `FinSight_Report_${from}_to_${to}.pdf` : `FinSight_Statement_${from}_to_${to}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${type.toUpperCase()} report exported successfully!`)
    } catch {
      toast.error('Failed to export financial report.')
    } finally {
      setDownloading(false)
    }
  }

  const handleConvert = async (e) => {
    e.preventDefault()
    if (!currency.amount) return toast.error('Enter an amount to convert.')
    try {
      const res = await convertCurrency(currency.from, currency.to, currency.amount)
      setConversion(res.data)
      toast.success('Live exchange rate converted!')
    } catch {
      toast.error('Currency conversion service unavailable.')
    }
  }

  const setPreset = (preset) => {
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    setTo(todayStr)
    if (preset === 'THIS_MONTH') {
      setFrom(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`)
    } else if (preset === 'LAST_3_MONTHS') {
      const d = new Date()
      d.setMonth(today.getMonth() - 3)
      setFrom(d.toISOString().slice(0, 10))
    } else if (preset === 'YTD') {
      setFrom(`${today.getFullYear()}-01-01`)
    }
  }

  return (
    <Layout
      title="Reports & Currency Conversion"
      subtitle="Export formal PDF audits, Excel workbooks, and real-time FX currency conversions"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Reports Card */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3 border-b border-[#1e293b] pb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <FileBarChart size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Generate Financial Statement</h2>
              <p className="text-xs text-slate-400">Download formatted accounting reports</p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold">Presets:</span>
            <button onClick={() => setPreset('THIS_MONTH')} className="btn-ghost text-[11px]">This Month</button>
            <button onClick={() => setPreset('LAST_3_MONTHS')} className="btn-ghost text-[11px]">Last 3 Months</button>
            <button onClick={() => setPreset('YTD')} className="btn-ghost text-[11px]">Year to Date</button>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="label">Start Date (From)</label>
              <input
                className="input"
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="label">End Date (To)</label>
              <input
                className="input"
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleDownload('pdf')}
              disabled={downloading}
              className="btn-primary flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold"
            >
              <FileText size={16} />
              <span>Download PDF Statement</span>
            </button>

            <button
              onClick={() => handleDownload('excel')}
              disabled={downloading}
              className="btn-secondary flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold"
            >
              <FileSpreadsheet size={16} className="text-emerald-400" />
              <span>Download Excel (.xlsx)</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            Reports include transactional line items, category breakdown, cash flow totals, and Year-over-Year comparison sheets.
          </p>
        </div>

        {/* Currency Converter Card */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3 border-b border-[#1e293b] pb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Live FX Currency Converter</h2>
              <p className="text-xs text-slate-400">Institutional spot rate conversion engine</p>
            </div>
          </div>

          <form onSubmit={handleConvert} className="space-y-4 text-xs">
            <div>
              <label className="label">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="1000"
                value={currency.amount}
                onChange={e => setCurrency({ ...currency, amount: e.target.value })}
                className="input font-bold text-white text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">From Currency</label>
                <select
                  value={currency.from}
                  onChange={e => setCurrency({ ...currency, from: e.target.value })}
                  className="input cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="SGD">SGD (S$)</option>
                </select>
              </div>

              <div>
                <label className="label">To Currency</label>
                <select
                  value={currency.to}
                  onChange={e => setCurrency({ ...currency, to: e.target.value })}
                  className="input cursor-pointer"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="SGD">SGD (S$)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-2.5 rounded-xl text-xs font-semibold">
              Convert Currency
            </button>
          </form>

          {conversion && (
            <div className="p-4 rounded-xl bg-[#111c35] border border-[#1e2a47] text-xs space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Conversion Result</span>
              <p className="text-xl font-extrabold text-emerald-400">
                {conversion.convertedAmount?.toLocaleString()} {conversion.to}
              </p>
              <p className="text-[11px] text-slate-400">
                Rate: 1 {conversion.from} = {conversion.rate} {conversion.to}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
