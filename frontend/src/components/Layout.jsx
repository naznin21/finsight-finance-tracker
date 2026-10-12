import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, Receipt, PiggyBank, Target,
  FileBarChart, LogOut, ShieldCheck,
  TrendingUp, Scale, LineChart, Landmark,
  Bell, Search, SlidersHorizontal, Sparkles, Plus,
  Menu, X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CopilotWidget from './CopilotWidget'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/accounts', label: 'Accounts', icon: Landmark },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/insights', label: 'Analytics', icon: LineChart },
  { to: '/forecast', label: 'Forecast', icon: TrendingUp },
  { to: '/decision-center', label: 'Decision Center', icon: Scale },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
  { to: '/settings', label: 'Settings', icon: SlidersHorizontal },
]

function getInitial(name) {
  if (!name) return 'A'
  return name.trim().charAt(0).toUpperCase()
}

export default function Layout({ title, subtitle, children, onQuickAdd }) {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [copilotOpen, setCopilotOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/transactions?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#070b14] flex text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Desktop Sidebar */}
      <aside className="w-60 shrink-0 border-r border-[#1e293b] bg-[#080d1a] px-3.5 py-5 hidden md:flex md:flex-col justify-between z-20">
        <div>
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 px-2 mb-7 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white block leading-tight">FinSight</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">Financial Intelligence</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const isActive = pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#111c35]'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span>{label}</span>
                </Link>
              )
            })}

            {/* AI Copilot Button */}
            <button
              onClick={() => setCopilotOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-indigo-300 hover:bg-[#111c35] transition text-left group"
            >
              <Sparkles size={16} className="text-indigo-400 group-hover:scale-110 transition" />
              <span className="flex-1">AI Copilot</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400">BETA</span>
            </button>
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-[#1e293b] pt-4 px-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {getInitial(user?.name)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'FinSight User'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6">
        {/* Top Header */}
        <header className="h-16 border-b border-[#1e293b] bg-[#070b14]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Global Search */}
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions, insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition"
              />
            </form>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Add Button */}
            {onQuickAdd && (
              <button
                onClick={onQuickAdd}
                className="btn-primary text-xs py-1.5 px-3 rounded-lg hidden sm:flex items-center gap-1.5 shadow-none"
              >
                <Plus size={14} />
                <span>Quick Add</span>
              </button>
            )}

            {/* Notifications */}
            <button
              onClick={() => navigate('/health')}
              title="Notifications"
              className="w-8 h-8 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-center text-slate-400 hover:text-slate-100 hover:border-slate-600 transition relative"
            >
              <Bell size={15} />
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full absolute top-2 right-2"></span>
            </button>

            {/* Settings shortcut */}
            <Link
              to="/settings"
              title="Settings"
              className="w-8 h-8 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-center text-slate-400 hover:text-slate-100 hover:border-slate-600 transition hidden sm:flex"
            >
              <SlidersHorizontal size={15} />
            </Link>

            {/* User Avatar */}
            <Link
              to="/settings"
              className="flex items-center gap-2 pl-1 group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:ring-2 group-hover:ring-indigo-500 transition">
                {getInitial(user?.name)}
              </div>
            </Link>
          </div>
        </header>

        {/* Mobile Flyout Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#1e293b] bg-[#080d1a] px-4 py-3 space-y-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                  pathname === to ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            ))}
            <button
              onClick={() => { setMobileMenuOpen(false); setCopilotOpen(true); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-indigo-400"
            >
              <Sparkles size={16} />
              <span>AI Copilot</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-rose-400"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl mx-auto w-full">
          {title && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{title}</h1>
                {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
              </div>
            </div>
          )}
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#080d1a]/95 backdrop-blur-lg border-t border-[#1e293b] flex items-center justify-around px-2 z-30">
          <Link to="/" className={`flex flex-col items-center gap-0.5 ${pathname === '/' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}>
            <LayoutGrid size={18} />
            <span className="text-[10px]">Home</span>
          </Link>
          <Link to="/transactions" className={`flex flex-col items-center gap-0.5 ${pathname === '/transactions' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}>
            <Receipt size={18} />
            <span className="text-[10px]">Trans</span>
          </Link>
          {onQuickAdd ? (
            <button
              onClick={onQuickAdd}
              className="w-10 h-10 -mt-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40"
            >
              <Plus size={20} />
            </button>
          ) : (
            <button
              onClick={() => setCopilotOpen(true)}
              className="w-10 h-10 -mt-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40"
            >
              <Sparkles size={18} />
            </button>
          )}
          <Link to="/goals" className={`flex flex-col items-center gap-0.5 ${pathname === '/goals' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}>
            <Target size={18} />
            <span className="text-[10px]">Goals</span>
          </Link>
          <Link to="/decision-center" className={`flex flex-col items-center gap-0.5 ${pathname === '/decision-center' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}>
            <Scale size={18} />
            <span className="text-[10px]">Decision</span>
          </Link>
        </div>
      </div>

      {/* FinSight AI Copilot Modal / Drawer */}
      <CopilotWidget isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  )
}
