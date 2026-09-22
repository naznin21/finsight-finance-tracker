import { useEffect, useState } from 'react'
import {
  getTransactions, createTransaction, updateTransaction,
  deleteTransaction, importCsv, importExcel, getCategories,
  createCategory, getAccounts
} from '../services/api'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import CopilotWidget from '../components/CopilotWidget'
import { Search, Upload, Plus, ChevronLeft, ChevronRight, FolderPlus } from 'lucide-react'

const empty = {
  type: 'EXPENSE',
  amount: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  categoryId: '',
  accountId: '',
  paymentMethod: 'UPI',
  merchant: '',
  tags: ''
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)

  // Custom Category Modal State
  const [showCatModal, setShowCatModal] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', icon: '📁', type: 'DISCRETIONARY' })

  // Search & Filter state
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const loadTransactions = () => getTransactions().then(r => setTransactions(r.data)).catch(() => {})
  const loadCategories = () => getCategories().then(r => setCategories(r.data)).catch(() => {})
  const loadAccounts = () => getAccounts().then(r => setAccounts(r.data)).catch(() => {})

  useEffect(() => {
    loadTransactions()
    loadCategories()
    loadAccounts()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      amount: parseFloat(form.amount),
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      accountId: form.accountId ? parseInt(form.accountId) : null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    }
    try {
      if (editId) {
        await updateTransaction(editId, payload)
        toast.success('Transaction updated in database')
      } else {
        await createTransaction(payload)
        toast.success('Transaction saved to database')
      }
      setForm(empty); setEditId(null); loadTransactions(); loadAccounts()
    } catch {
      toast.error('Failed to save transaction to database.')
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    if (!newCat.name.trim()) return
    try {
      const { data } = await createCategory(newCat)
      toast.success(`Category '${data.name}' created`)
      setNewCat({ name: '', icon: '📁', type: 'DISCRETIONARY' })
      setShowCatModal(false)
      loadCategories()
    } catch {
      toast.error('Failed to create category')
    }
  }

  const handleEdit = (t) => {
    setEditId(t.id)
    setForm({
      ...t,
      tags: t.tags?.join(', ') || '',
      categoryId: t.categoryId || '',
      accountId: t.accountId || '',
      paymentMethod: t.paymentMethod || 'UPI',
      merchant: t.merchant || ''
    })
  }

  const handleDelete = async (id) => {
    await deleteTransaction(id)
    toast.success('Deleted from database')
    loadTransactions()
    loadAccounts()
  }

  const handleImport = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      if (type === 'csv') await importCsv(file)
      else await importExcel(file)
      toast.success('Imported and saved to database successfully')
      loadTransactions()
    } catch {
      toast.error('Import failed. Check file format.')
    }
  }

  // Filter logic
  const filtered = transactions.filter(t => {
    const matchesSearch = !search ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
      (t.categoryName && t.categoryName.toLowerCase().includes(search.toLowerCase())) ||
      (t.accountName && t.accountName.toLowerCase().includes(search.toLowerCase()))
    const matchesType = typeFilter === 'ALL' || t.type === typeFilter
    const matchesCat = categoryFilter === 'ALL' || String(t.categoryId) === String(categoryFilter)
    return matchesSearch && matchesType && matchesCat
  })

  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <Layout title="Transactions & Financial Records" subtitle="Every action & transaction stored dynamically in MySQL database">
      {/* Transaction Entry Form */}
      <form onSubmit={handleSubmit} className="card grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <div>
          <label className="label">Type</label>
          <select className="input text-xs" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="INCOME">Income (+)</option>
            <option value="EXPENSE">Expense (-)</option>
          </select>
        </div>

        <div>
          <label className="label">Amount (₹)</label>
          <input className="input text-xs" type="number" step="0.01" placeholder="e.g. 1500" value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })} required />
        </div>

        <div>
          <label className="label">Description</label>
          <input className="input text-xs" placeholder="e.g. Grocery Store" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        <div>
          <label className="label">Date</label>
          <input className="input text-xs" type="date" value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })} required />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="label mb-0">Category</label>
            <button
              type="button"
              onClick={() => setShowCatModal(true)}
              className="text-[10px] text-accent hover:underline flex items-center gap-1"
            >
              <FolderPlus size={12} /> Add New
            </button>
          </div>
          <select className="input text-xs" value={form.categoryId}
            onChange={e => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">No Category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon || '📁'} {c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Account (Balance Sync)</label>
          <select className="input text-xs" value={form.accountId}
            onChange={e => setForm({ ...form, accountId: e.target.value })}>
            <option value="">Select Account (Optional)</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name} (₹{a.currentBalance})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Payment Method</label>
          <select className="input text-xs" value={form.paymentMethod}
            onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
            <option value="UPI">UPI / GPay / PhonePe</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="DEBIT_CARD">Debit Card</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer / Net Banking</option>
          </select>
        </div>

        <div className="flex gap-2 items-end">
          <button className="btn-primary flex-1 text-xs" type="submit">
            {editId ? 'Update Record' : '+ Add Transaction'}
          </button>
          {editId && (
            <button type="button" className="btn-secondary text-xs"
              onClick={() => { setForm(empty); setEditId(null) }}>Cancel</button>
          )}
        </div>
      </form>

      {/* Toolbar: Search, Filter, Import */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 gap-2 w-full">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-3 text-muted" />
            <input
              className="input text-xs pl-8"
              placeholder="Search by description, category, or account..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
            />
          </div>

          <select
            className="input text-xs w-32"
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1) }}
          >
            <option value="ALL">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>

          <select
            className="input text-xs w-44"
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1) }}
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon || '📁'} {c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 shrink-0">
          <label className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5">
            <Upload size={14} /> Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={e => handleImport(e, 'csv')} />
          </label>
          <label className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5">
            <Upload size={14} /> Import Excel
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={e => handleImport(e, 'excel')} />
          </label>
        </div>
      </div>

      {/* Data Table */}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="table-head">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Account & Method</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(t => (
              <tr key={t.id} className="table-row">
                <td className="p-3 text-slate-300 font-medium">{t.date}</td>
                <td className="p-3">
                  <span className={t.type === 'INCOME' ? 'badge-income' : 'badge-expense'}>
                    {t.type}
                  </span>
                </td>
                <td className="p-3 text-slate-200 font-semibold">{t.description || '-'}</td>
                <td className="p-3 text-slate-300">
                  <span className="px-2 py-0.5 rounded bg-panel2 border border-line">
                    {t.categoryName || 'No Category'}
                  </span>
                </td>
                <td className="p-3 text-muted">
                  {t.accountName ? <span className="text-accent font-medium">{t.accountName}</span> : 'Unlinked'}
                  {t.paymentMethod && <span className="text-[10px] text-muted ml-1 font-mono">({t.paymentMethod})</span>}
                </td>
                <td className={`p-3 text-right font-extrabold ${t.type === 'INCOME' ? 'text-income' : 'text-slate-100'}`}>
                  {t.type === 'INCOME' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                </td>
                <td className="p-3">
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => handleEdit(t)} className="btn-edit-link">Edit</button>
                    <button onClick={() => handleDelete(t.id)} className="btn-danger-link">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted">No transactions found in database.</td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 bg-panel2 border-t border-line flex items-center justify-between text-xs text-muted">
            <span>Showing Page {currentPage} of {totalPages} ({filtered.length} total database records)</span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="btn-secondary text-xs px-2.5 py-1 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="btn-secondary text-xs px-2.5 py-1 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Custom Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-bold text-slate-100 text-sm">Create New Category</h3>
              <button onClick={() => setShowCatModal(false)} className="text-muted hover:text-slate-100 text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="label">Category Name</label>
                <input
                  className="input text-xs"
                  placeholder="e.g. Pet Care, Online Courses, Dining"
                  value={newCat.name}
                  onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Icon (Emoji)</label>
                  <input
                    className="input text-xs"
                    placeholder="e.g. 🐶, 🎓, 🍕"
                    value={newCat.icon}
                    onChange={e => setNewCat({ ...newCat, icon: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Category Type</label>
                  <select
                    className="input text-xs"
                    value={newCat.type}
                    onChange={e => setNewCat({ ...newCat, type: e.target.value })}
                  >
                    <option value="ESSENTIAL">Essential (Need)</option>
                    <option value="DISCRETIONARY">Discretionary (Want)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1 text-xs">Save Category to DB</button>
                <button type="button" onClick={() => setShowCatModal(false)} className="btn-secondary text-xs flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CopilotWidget />
    </Layout>
  )
}
