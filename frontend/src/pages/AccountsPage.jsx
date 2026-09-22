import { useEffect, useState } from 'react'
import { getAccounts, createAccount, deleteAccount } from '../services/api'
import Layout from '../components/Layout'
import CopilotWidget from '../components/CopilotWidget'
import { Landmark, Plus, Trash2, CreditCard, Wallet, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'SAVINGS', openingBalance: '', currency: 'INR' })

  const load = () => getAccounts().then(r => setAccounts(r.data)).catch(() => {})

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createAccount({ ...form, openingBalance: parseFloat(form.openingBalance || 0) })
      toast.success('Account created')
      setShowForm(false)
      setForm({ name: '', type: 'SAVINGS', openingBalance: '', currency: 'INR' })
      load()
    } catch {
      toast.error('Failed to create account')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteAccount(id)
      toast.success('Account removed')
      load()
    } catch {
      toast.error('Failed to remove account')
    }
  }

  return (
    <Layout title="Bank Accounts & Balances" subtitle="Track real account balances across Savings, Checking, Credit Cards, Cash, and UPI Wallets">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-slate-100 text-sm">Linked Financial Accounts</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs flex items-center gap-1.5">
          <Plus size={14} />
          <span>{showForm ? 'Cancel' : 'Add Account'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <input className="input text-xs" placeholder="Account Name (e.g. HDFC Savings)" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} required />

          <select className="input text-xs" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="SAVINGS">Savings Account</option>
            <option value="CHECKING">Checking Account</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="CASH">Physical Cash</option>
            <option value="WALLET">UPI / Digital Wallet</option>
          </select>

          <input className="input text-xs" type="number" placeholder="Opening Balance (₹)" value={form.openingBalance}
            onChange={e => setForm({ ...form, openingBalance: e.target.value })} required />

          <button className="btn-primary text-xs col-span-2 sm:col-span-1" type="submit">Save Account</button>
        </form>
      )}

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(a => (
          <div key={a.id} className="card space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                  {a.type === 'CREDIT_CARD' ? <CreditCard size={18} /> :
                   a.type === 'WALLET' ? <Wallet size={18} /> :
                   <Building2 size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">{a.name}</h3>
                  <span className="text-[10px] font-semibold text-muted tracking-wider uppercase">{a.type}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(a.id)} className="btn-danger-link p-1">
                <Trash2 size={14} />
              </button>
            </div>

            <div className="pt-2 border-t border-line/60 flex justify-between items-baseline">
              <span className="text-xs text-muted">Current Balance:</span>
              <span className="text-xl font-extrabold text-slate-50">₹{a.currentBalance.toLocaleString('en-IN')}</span>
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="card col-span-full py-12 text-center text-muted text-xs">
            No accounts linked yet. Click Add Account above to register your bank or wallet balances.
          </div>
        )}
      </div>

      <CopilotWidget />
    </Layout>
  )
}
