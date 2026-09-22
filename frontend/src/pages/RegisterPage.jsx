import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../services/api'
import toast from 'react-hot-toast'
import { Wallet, Eye, EyeOff } from 'lucide-react'

function getStrength(password) {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (!password) return { label: '', pct: 0, color: 'bg-line' }
  if (score <= 1) return { label: 'Weak', pct: 33, color: 'bg-expense' }
  if (score <= 3) return { label: 'Medium', pct: 66, color: 'bg-amber-400' }
  return { label: 'Strong', pct: 100, color: 'bg-income' }
}

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false) // ⭐ Added loading state
  const navigate = useNavigate()

  const strength = useMemo(() => getStrength(form.password), [form.password])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }

    setLoading(true) // ⭐ Set loading
    try {
      await register({ 
        name: form.name, 
        email: form.email, 
        password: form.password 
      })
      
      toast.success('Account created! OTP sent to your email.')
      
      // ⭐ Redirect to OTP verification page with email
      navigate('/verify-otp', { 
        state: { 
          email: form.email,
          fromRegistration: true 
        }
      })
    } catch (error) {
      const errorMsg = error.response?.data || 'Registration failed. Email may already be in use.'
      toast.error(errorMsg)
    } finally {
      setLoading(false) // ⭐ Clear loading
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-5">
          <Wallet size={26} className="text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-50">Create account</h1>
        <p className="text-sm text-muted text-center mt-1 mb-8">Start tracking your finances today</p>

        <div className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input 
              className="input" 
              placeholder="John Doe"
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              required 
              disabled={loading} // ⭐ Disable during loading
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input 
              className="input" 
              type="email" 
              placeholder="you@example.com"
              value={form.email} 
              onChange={e => setForm({ ...form, email: e.target.value })} 
              required 
              disabled={loading} // ⭐ Disable during loading
            />
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input 
                className="input pr-16" 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Min. 6 characters"
                value={form.password} 
                onChange={e => setForm({ ...form, password: e.target.value })} 
                required 
                disabled={loading} // ⭐ Disable during loading
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-accent flex items-center gap-1"
                disabled={loading} // ⭐ Disable during loading
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {form.password && (
              <div className="mt-2">
                <div className="w-full h-1.5 rounded-full bg-line overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${strength.color}`} 
                    style={{ width: `${strength.pct}%` }} 
                  />
                </div>
                <p className={`text-xs mt-1 ${
                  strength.label === 'Strong' ? 'text-income' : 
                  strength.label === 'Medium' ? 'text-amber-400' : 'text-expense'
                }`}>
                  {strength.label}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <input 
              className="input" 
              type={showPassword ? 'text' : 'password'} 
              placeholder="Re-enter password"
              value={form.confirmPassword} 
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })} 
              required 
              disabled={loading} // ⭐ Disable during loading
            />
          </div>

          <button 
            className="btn-primary w-full" 
            type="submit"
            disabled={loading} // ⭐ Disable during loading
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-sm text-center text-muted">
            Already have an account? <Link to="/login" className="text-accent hover:underline">Sign in</Link>
          </p>
        </div>
      </form>
    </div>
  )
}