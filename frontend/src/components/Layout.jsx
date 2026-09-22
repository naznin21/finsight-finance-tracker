import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, Receipt, PiggyBank, Target,
  Sparkles, FileBarChart, LogOut, ShieldCheck,
  TrendingUp, SlidersHorizontal, Scale, LineChart,
  CalendarCheck, Landmark, Trophy, Calendar
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_GROUPS = [
  {
    title: 'UNDERSTAND',
    items: [
      { to: '/', label: 'Overview', icon: LayoutGrid },
      { to: '/transactions', label: 'Transactions', icon: Receipt },
      { to: '/insights', label: 'Behavior Insights', icon: Sparkles },
      { to: '/health', label: 'Financial Health', icon: ShieldCheck },
    ]
  },
  {
    title: 'PLAN',
    items: [
      { to: '/budgets', label: 'Budgets', icon: PiggyBank },
      { to: '/goals', label: 'Goals', icon: Target },
      { to: '/subscriptions', label: 'Subscriptions', icon: CalendarCheck },
      { to: '/cash-flow', label: 'Cash Flow Timeline', icon: Calendar },
      { to: '/accounts', label: 'Bank Accounts', icon: Landmark },
      { to: '/experiments', label: 'Financial Challenges', icon: Trophy },
    ]
  },
  {
    title: 'DECIDE',
    items: [
      { to: '/forecast', label: 'Forecast', icon: TrendingUp },
      { to: '/simulator', label: 'What-If Simulator', icon: SlidersHorizontal },
      { to: '/decision-center', label: 'Decision Center', icon: Scale, badge: 'CORE' },
      { to: '/digital-twin', label: 'Digital Twin', icon: LineChart },
      { to: '/reports', label: 'Reports & Export', icon: FileBarChart },
    ]
  }
]

function initials(name) {
  if (!name) return 'FS'
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
}

export default function Layout({ title, subtitle, children }) {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-bg flex font-sans antialiased text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-line bg-panel px-4 py-5 hidden md:flex md:flex-col justify-between">
        <div>
          {/* Branding */}
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accentDark flex items-center justify-center shadow-lg shadow-accent/20">
              <ShieldCheck size={22} className="text-[#04222b]" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-50 block leading-tight">FinSight</span>
              <span className="text-[10px] text-muted tracking-wider uppercase font-semibold">Decision Platform</span>
            </div>
          </div>

          {/* Sitemap Navigation Groups */}
          <nav className="space-y-4">
            {NAV_GROUPS.map((group, idx) => (
              <div key={idx}>
                <p className="px-3 text-[10px] font-bold text-muted tracking-wider mb-1.5 uppercase">{group.title}</p>
                <div className="space-y-0.5">
                  {group.items.map(({ to, label, icon: Icon, badge }) => {
                    const isActive = pathname === to
                    return (
                      <Link
                        key={to}
                        to={to}
                        className={isActive ? 'nav-link-active text-xs' : 'nav-link text-xs'}
                      >
                        <Icon size={16} />
                        <span className="flex-1">{label}</span>
                        {badge && (
                          <span className="text-[9px] font-bold bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                            {badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User Footer */}
        <div className="pt-3 border-t border-line">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-accent/20 text-accent border border-accent/30 flex items-center justify-center text-xs font-bold">
                {initials(user?.name)}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-100 truncate">{user?.name || 'Financial User'}</p>
                <p className="text-[10px] text-muted truncate">{user?.email || 'user@finsight.com'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-muted hover:text-expense hover:bg-panel2 transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-line/60 bg-panel/40 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold text-slate-50 tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-panel2 border border-line text-xs font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-income animate-pulse"></span>
              Grounded Spring AI Connected
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 px-6 md:px-8 py-6 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}
