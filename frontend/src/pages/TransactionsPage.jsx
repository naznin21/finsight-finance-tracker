import { useEffect, useState, useMemo } from 'react'
import {
  getTransactions, createTransaction, updateTransaction,
  deleteTransaction, importCsv, importExcel, getCategories,
  createCategory, getAccounts
} from '../services/api'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import {
  Search, Upload, Plus, ChevronLeft, ChevronRight,
  Filter, ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
  X, Check, Calendar, Trash2, Edit2, FileSpreadsheet
} from 'lucide-react'

const initialForm = {
  type: 'EXPENSE',
  amount: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  categoryId: '',
  accountId: '',
  destinationAccountId: '',
  paymentMethod: 'UPI',
  merchant: '',
  tags: ''
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editId, setEditId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [accountFilter, setAccountFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [selectedIds, setSelectedIds] = useState([])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const loadData = async () => {
    setLoading(true)
    try {
      const [tRes, cRes, aRes] = await Promise.all([
        getTransactions(),
        getCategories(),
        getAccounts()
      ])
      setTransactions(tRes.data || [])
      setCategories(cRes.data || [])
      setAccounts(aRes.data || [])
    } catch {
      toast.error('Failed to load transaction records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Please enter a valid positive amount.')
      return
    }

    if (form.type === 'TRANSFER') {
      if (!form.accountId || !form.destinationAccountId) {
        toast.error('Both source and destination accounts are required for a transfer.')
        return
      }
      if (form.accountId === form.destinationAccountId) {
        toast.error('Source and destination accounts must be different.')
        return
      }
    }

    const payload = {
      ...form,
      amount: parseFloat(form.amount),
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      accountId: form.accountId ? parseInt(form.accountId) : null,
      destinationAccountId: form.type === 'TRANSFER' && form.destinationAccountId ? parseInt(form.destinationAccountId) : null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    }

    try {
      if (editId) {
        await updateTransaction(editId, payload)
        toast.success('Transaction updated successfully!')
      } else {
        await createTransaction(payload)
        toast.success('Transaction created successfully!')
      }
      setForm(initialForm)
      setEditId(null)
      setModalOpen(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save transaction.')
    }
  }

  const handleEdit = (t) => {
    setEditId(t.id)
    setForm({
      type: t.type || 'EXPENSE',
      amount: t.amount || '',
      description: t.description || '',
      date: t.date || new Date().toISOString().split('T')[0],
      categoryId: t.categoryId ? String(t.categoryId) : '',
      accountId: t.accountId ? String(t.accountId) : '',
      destinationAccountId: t.destinationAccountId ? String(t.destinationAccountId) : '',
      paymentMethod: t.paymentMethod || 'UPI',
      merchant: t.merchant || '',
      tags: t.tags?.join(', ') || ''
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return
    try {
      await deleteTransaction(id)
      toast.success('Transaction deleted.')
      loadData()
    } catch {
      toast.error('Failed to delete transaction.')
    }
  }

  const handleImportFile = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    const promise = type === 'csv' ? importCsv(file) : importExcel(file)
    toast.promise(promise, {
      loading: `Importing ${type.toUpperCase()} file...`,
      success: (res) => {
        loadData()
        setImportOpen(false)
        return `Import completed! ${res.data?.length || 0} transactions processed.`
      },
      error: 'Failed to import transactions. Verify file format.'
    })
  }

  // Filtered list
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false
      if (categoryFilter !== 'ALL' && String(t.categoryId) !== String(categoryFilter)) return false
      if (accountFilter !== 'ALL' && String(t.accountId) !== String(accountFilter)) return false
      if (dateFilter === 'THIS_MONTH') {
        const ym = new Date().toISOString().slice(0, 7)
        if (!t.date?.startsWith(ym)) return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesDesc = t.description?.toLowerCase().includes(q)
        const matchesCat = t.categoryName?.toLowerCase().includes(q)
        const matchesMerch = t.merchant?.toLowerCase().includes(q)
        const matchesAcc = t.accountName?.toLowerCase().includes(q)
        if (!matchesDesc && !matchesCat && !matchesMerch && !matchesAcc) return false
      }
      return true
    })
  }, [transactions, typeFilter, categoryFilter, accountFilter, dateFilter, search])

  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage])

  const toggleSelectAll = () => {
    if (selectedIds.length === paginated.length) setSelectedIds([])
    else setSelectedIds(paginated.map(p => p.id))
  }

  const toggleSelectOne = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id))
    else setSelectedIds([...selectedIds, id])
  }

  return (
    <Layout
      title="Transactions"
      subtitle="Manage all your income, expenses and transfers"
      onQuickAdd={() => { setForm(initialForm); setEditId(null); setModalOpen(true) }}
    >
      <div className="space-y-4">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">
              Showing <span className="text-white font-bold">{filtered.length}</span> transactions
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Import Dropdown */}
            <div className="relative">
              <button
                onClick={() => setImportOpen(!importOpen)}
                className="btn-secondary text-xs py-2 px-3.5 rounded-xl flex items-center gap-2"
              >
                <Upload size={14} />
                <span>Import</span>
              </button>
              {importOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl p-2 z-20 space-y-1">
                  <label className="flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-[#16223d] rounded-lg cursor-pointer transition">
                    <FileSpreadsheet size={14} className="text-indigo-400" />
                    <span>Upload CSV</span>
                    <input type="file" accept=".csv" className="hidden" onChange={(e) => handleImportFile(e, 'csv')} />
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-[#16223d] rounded-lg cursor-pointer transition">
                    <FileSpreadsheet size={14} className="text-emerald-400" />
                    <span>Upload Excel (.xlsx)</span>
                    <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleImportFile(e, 'excel')} />
                  </label>
                </div>
              )}
            </div>

            {/* Add Transaction Button */}
            <button
              onClick={() => { setForm(initialForm); setEditId(null); setModalOpen(true) }}
              className="btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-2"
            >
              <Plus size={15} />
              <span>+ Add Transaction</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="card p-3 flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, merchant, category..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              className="w-full bg-[#111c35] border border-[#1e2a47] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Type Dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1) }}
            className="bg-[#111c35] border border-[#1e2a47] text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
            <option value="TRANSFER">Transfer</option>
          </select>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }}
            className="bg-[#111c35] border border-[#1e2a47] text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer max-w-[150px] truncate"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Account Dropdown */}
          <select
            value={accountFilter}
            onChange={(e) => { setAccountFilter(e.target.value); setCurrentPage(1) }}
            className="bg-[#111c35] border border-[#1e2a47] text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer max-w-[150px] truncate"
          >
            <option value="ALL">All Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1) }}
            className="bg-[#111c35] border border-[#1e2a47] text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Dates</option>
            <option value="THIS_MONTH">This Month</option>
          </select>
        </div>

        {/* Transactions Table */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="table-head border-b border-[#1e293b]">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={paginated.length > 0 && selectedIds.length === paginated.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-700 bg-[#111c35] text-indigo-600 focus:ring-0"
                    />
                  </th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Account</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3 px-4 font-semibold text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading transactions...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-500">
                      No transactions found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  paginated.map(t => {
                    const isSelected = selectedIds.includes(t.id)
                    return (
                      <tr key={t.id} className={`table-row ${isSelected ? 'bg-indigo-950/20' : ''}`}>
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(t.id)}
                            className="rounded border-slate-700 bg-[#111c35] text-indigo-600 focus:ring-0"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {t.date}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-200">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                              t.type === 'INCOME' ? 'bg-emerald-500/15 text-emerald-400' :
                              t.type === 'TRANSFER' ? 'bg-blue-500/15 text-blue-400' :
                              'bg-rose-500/15 text-rose-400'
                            }`}>
                              {t.type === 'INCOME' ? '↓' : t.type === 'TRANSFER' ? '⇄' : '↑'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">{t.description || t.merchant || 'Unlabeled'}</p>
                              {t.merchant && <p className="text-[10px] text-slate-400">{t.merchant}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="badge-violet">
                            {t.categoryName || 'General'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {t.type === 'TRANSFER' && t.destinationAccountName ? (
                            <span>{t.accountName} → {t.destinationAccountName}</span>
                          ) : (
                            <span>{t.accountName || 'Cash / Unlinked'}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                          <span className={
                            t.type === 'INCOME' ? 'text-emerald-400' :
                            t.type === 'TRANSFER' ? 'text-blue-400' :
                            'text-rose-400'
                          }>
                            {t.type === 'INCOME' ? '+' : t.type === 'TRANSFER' ? '' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(t)}
                              title="Edit"
                              className="p-1 text-slate-400 hover:text-indigo-400 transition"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(t.id)}
                              title="Delete"
                              className="p-1 text-slate-400 hover:text-rose-400 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400 bg-[#080d1a]">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-1.5 rounded-lg border border-[#1e293b] hover:bg-slate-800 disabled:opacity-30 transition"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-[#1e293b] hover:bg-slate-800 disabled:opacity-30 transition"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Transaction Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-[#1e2a47] rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-5 border-b border-[#1e293b] pb-3">
              <h3 className="text-base font-bold text-white">
                {editId ? 'Edit Transaction' : 'Add New Transaction'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Type Switcher */}
              <div>
                <label className="label">Transaction Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['EXPENSE', 'INCOME', 'TRANSFER'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`py-2 rounded-xl font-semibold border transition ${
                        form.type === t
                          ? t === 'EXPENSE' ? 'bg-rose-500/20 border-rose-500 text-rose-300' :
                            t === 'INCOME' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' :
                            'bg-blue-500/20 border-blue-500 text-blue-300'
                          : 'bg-[#111c35] border-[#1e2a47] text-slate-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="input font-bold text-white text-sm"
                  />
                </div>
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              {/* Account Selection */}
              {form.type === 'TRANSFER' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Source Account (From)</label>
                    <select
                      required
                      value={form.accountId}
                      onChange={(e) => setForm(f => ({ ...f, accountId: e.target.value }))}
                      className="input cursor-pointer"
                    >
                      <option value="">Select Source Account</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name} (₹{a.currentBalance})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Destination Account (To)</label>
                    <select
                      required
                      value={form.destinationAccountId}
                      onChange={(e) => setForm(f => ({ ...f, destinationAccountId: e.target.value }))}
                      className="input cursor-pointer"
                    >
                      <option value="">Select Destination Account</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name} (₹{a.currentBalance})</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Account</label>
                    <select
                      value={form.accountId}
                      onChange={(e) => setForm(f => ({ ...f, accountId: e.target.value }))}
                      className="input cursor-pointer"
                    >
                      <option value="">None / Cash</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm(f => ({ ...f, categoryId: e.target.value }))}
                      className="input cursor-pointer"
                    >
                      <option value="">Uncategorized</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Description & Merchant */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grocery shopping, Salary"
                    value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Merchant / Payee</label>
                  <input
                    type="text"
                    placeholder="e.g. Zomato, Amazon, Netflix"
                    value={form.merchant}
                    onChange={(e) => setForm(f => ({ ...f, merchant: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              {/* Tags & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Payment Method</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                    className="input cursor-pointer"
                  >
                    <option value="UPI">UPI</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="NET_BANKING">Net Banking</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="label">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. essential, dining, work"
                    value={form.tags}
                    onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-[#1e293b] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-5"
                >
                  {editId ? 'Update Transaction' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
