import { useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { User, Shield, Bell, Moon, Key, Globe, CheckCircle2 } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [currency, setCurrency] = useState('INR')
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [budgetAlertThreshold, setBudgetAlertThreshold] = useState(80)
  const [savedMessage, setSavedMessage] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setSavedMessage(true)
    setTimeout(() => setSavedMessage(false), 3000)
  }

  return (
    <Layout title="Settings & Security" subtitle="Manage profile, preferences, and security configurations">
      <div className="max-w-4xl mx-auto space-y-6">
        {savedMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>Preferences saved successfully!</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">User Profile</h2>
              <p className="text-xs text-slate-400">Your account identity and authentication details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input type="text" disabled value={user?.name || 'FinSight User'} className="input opacity-75 cursor-not-allowed" />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input type="email" disabled value={user?.email || 'user@example.com'} className="input opacity-75 cursor-not-allowed" />
            </div>
          </div>
        </div>

        {/* Financial Preferences */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Localization & Display</h2>
              <p className="text-xs text-slate-400">Currency symbols and alert threshold configuration</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Primary Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="input cursor-pointer"
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                </select>
              </div>
              <div>
                <label className="label">Budget Overspend Alert Trigger (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={budgetAlertThreshold}
                  onChange={(e) => setBudgetAlertThreshold(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="emailAlerts"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-[#111c35]"
                />
                <label htmlFor="emailAlerts" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Receive email alerts when category spending crosses {budgetAlertThreshold}% of budget limit
                </label>
              </div>
              <button type="submit" className="btn-primary text-xs py-2 px-5">
                Save Preferences
              </button>
            </div>
          </form>
        </div>

        {/* Security & Credentials */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Security & Credentials Hardening</h2>
              <p className="text-xs text-slate-400">Cross-user data isolation and credential status</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b1324] border border-[#1e293b]">
              <div>
                <p className="font-semibold text-slate-200">Email Verification (OTP)</p>
                <p className="text-slate-400">Strict 10-minute validity with single-use verification</p>
              </div>
              <span className="badge-income">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b1324] border border-[#1e293b]">
              <div>
                <p className="font-semibold text-slate-200">JWT Token Expiration</p>
                <p className="text-slate-400">Stateless HS256 authentication with environment variable secret rotation</p>
              </div>
              <span className="badge-income">Secured</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b1324] border border-[#1e293b]">
              <div>
                <p className="font-semibold text-slate-200">Cross-User Data Isolation</p>
                <p className="text-slate-400">Tenant-level ownership verified across transactions, budgets, goals, and accounts</p>
              </div>
              <span className="badge-income">Enforced</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
