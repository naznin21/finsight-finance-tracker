import { useState } from 'react'
import { downloadPdf, downloadExcel, convertCurrency } from '../services/api'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'

export default function ReportsPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [currency, setCurrency] = useState({ from: 'INR', to: 'USD', amount: '' })
  const [conversion, setConversion] = useState(null)

  const handleDownload = async (type) => {
    if (!from || !to) return toast.error('Select date range')
    try {
      const fn = type === 'pdf' ? downloadPdf : downloadExcel
      const res = await fn(from, to)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = type === 'pdf' ? 'report.pdf' : 'report.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export failed') }
  }

  const handleConvert = async () => {
    if (!currency.amount) return toast.error('Enter amount')
    try {
      const res = await convertCurrency(currency.from, currency.to, currency.amount)
      setConversion(res.data)
    } catch { toast.error('Conversion failed') }
  }

  return (
    <Layout title="Reports & Analytics" subtitle="Export your data and convert currencies">
      {/* Export Reports */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-slate-100">Export Report</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">From</label>
            <input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input className="input" type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-primary flex-1" onClick={() => handleDownload('pdf')}>
            Download PDF
          </button>
          <button className="btn-secondary flex-1" onClick={() => handleDownload('excel')}>
            Download Excel
          </button>
        </div>
        <p className="text-xs text-muted">Excel export includes a Year-over-Year comparison sheet.</p>
      </div>

      {/* Currency Converter */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-slate-100">Currency Converter</h2>
        <div className="grid grid-cols-3 gap-3">
          <input className="input" placeholder="From (e.g. INR)" value={currency.from}
            onChange={e => setCurrency({ ...currency, from: e.target.value.toUpperCase() })} />
          <input className="input" placeholder="To (e.g. USD)" value={currency.to}
            onChange={e => setCurrency({ ...currency, to: e.target.value.toUpperCase() })} />
          <input className="input" type="number" placeholder="Amount" value={currency.amount}
            onChange={e => setCurrency({ ...currency, amount: e.target.value })} />
        </div>
        <button className="btn-primary w-full" onClick={handleConvert}>Convert</button>
        {conversion && (
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-sm">
            <span className="font-medium text-slate-200">{conversion.originalAmount} {conversion.fromCurrency}</span>
            {' = '}
            <span className="font-bold text-accent">{conversion.convertedAmount} {conversion.toCurrency}</span>
            <span className="text-muted ml-2">(Rate: {conversion.exchangeRate})</span>
          </div>
        )}
      </div>
    </Layout>
  )
}
