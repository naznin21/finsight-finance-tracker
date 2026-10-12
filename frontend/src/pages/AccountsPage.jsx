import { useEffect, useState, useMemo } from 'react'
import { getAccounts, createAccount, deleteAccount } from '../services/api'
import Layout from '../components/Layout'
import {
  Landmark, Plus, Trash2, CreditCard, Wallet,
  Building2, ArrowRightLeft, ShieldCheck, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', type: 'SAVINGS', openingBalance: '', currency: 'INR' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await getAccounts()
      setAccounts(res.data || [])
    } catch {
      toast.error('Failed to load accounts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    try {
      await createAccount({ ...form, openingBalance: parseFloat(form.openingBalance || 0) })
      toast.success('Account registered successfully!')
      setShowModal(false)
      setForm({ name: '', type: 'SAVINGS', openingBalance: '', currency: 'INR' })
      load()
    } catch {
      toast.error('Failed to create account.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this account?')) return
    try {
      await deleteAccount(id)
      toast.success('Account deactivated.')
      load()
    } catch {
      toast.error('Failed to remove account.')
    }
  }

  const { totalBalance, liquidBalance, creditBalance } = useMemo(() => {
    let tot = 0
    let liq = 0
    let crd = 0
    accounts.forEach(a => {
      const bal = Number(a.currentBalance || 0)
      tot += bal
      if (a.type === 'CREDIT_CARD') crd += bal
      else liq += bal
    })
    return { totalBalance: tot, liquidBalance: liq, creditBalance: crd }
  }, [accounts])

  return (
    <Layout
      title="Accounts"
      subtitle="Manage your bank accounts, cards, and liquid cash balances"
      onQuickAdd={() => setShowModal(true)}
    >
      <div className="space-y-6">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card">
            <span className="text-xs font-semibold text-slate-400">Total Net Liquidity</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">
              ₹{totalBalance.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Across all registered accounts</p>
          </div>

          <div className="card">
            <span className="text-xs font-semibold text-slate-400">Liquid Checking & Savings</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1.5">
              ₹{liquidBalance.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Immediate accessible cash</p>
          </div>

          <div className="card">
            <span className="text-xs font-semibold text-slate-400">Credit Lines & Overdrafts</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400 mt-1.5">
              ₹{creditBalance.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Total credit card balances</p>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">All Accounts ({accounts.length})</h2>
          <div className="flex items-center gap-2">
            <Link to="/transactions" className="btn-secondary text-xs py-2 px-3.5 rounded-xl">
              <ArrowRightLeft size={14} />
              <span>Record Transfer</span>
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary text-xs py-2 px-4 rounded-xl"
            >
              <Plus size={15} />
              <span>+ Add Account</span>
            </button>
          </div>
        </div>

        {/* Account Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(a => (
            <div key={a.id} className="card flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/15 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                      {a.type === 'CREDIT_CARD' ? <CreditCard size={20} /> :
                       a.type === 'WALLET' ? <Wallet size={20} /> :
                       <Building2 size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{a.name}</h3>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {a.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(a.id)}
                    title="Remove"
                    className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-[#0b1324] border border-[#1e293b] my-2">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Current Balance</span>
                  <p className="text-2xl font-extrabold text-white mt-0.5">
                    ₹{Number(a.currentBalance || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
                <span>Opening: ₹{Number(a.openingBalance || 0).toLocaleString('en-IN')}</span>
                <span className="text-emerald-400 font-medium">Active</span>
              </div>
            </div>
          ))}

          {accounts.length === 0 && !loading && (
            <div className="card col-span-full py-16 text-center text-slate-500 text-xs">
              No financial accounts added yet. Click "+ Add Account" to configure your bank accounts or wallets.
            </div>
          )}
        </div>
      </div>

      {/* Add Account Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-[#1e2a47] rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-5 border-b border-[#1e293b] pb-3">
              <h3 className="text-base font-bold text-white">Add Bank Account / Wallet</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="label">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Salary, ICICI Savings, Paytm Wallet"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Account Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="input cursor-pointer"
                >
                  <option value="SAVINGS">Savings Account</option>
                  <option value="CHECKING">Checking / Current Account</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="CASH">Physical Cash</option>
                  <option value="WALLET">Digital Wallet (UPI)</option>
                </select>
              </div>

              <div>
                <label className="label">Opening Balance (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={form.openingBalance}
                  onChange={e => setForm({ ...form, openingBalance: e.target.value })}
                  className="input font-bold text-white"
                />
              </div>

              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-5"
                >
                  Register Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
