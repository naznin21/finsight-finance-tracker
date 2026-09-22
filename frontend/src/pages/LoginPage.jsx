import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { login as loginApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Wallet, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Show success message if coming from verification
    if (location.state?.message) {
      toast.success(location.state.message)
      // Clear the state to prevent showing again on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { data } = await loginApi(form)
      login(data)
      toast.success('Welcome back!')
      navigate('/')
    } catch (error) {
      const errorMsg = error.response?.data
      
      // Check if the error is about email verification
      if (typeof errorMsg === 'string' && errorMsg.toLowerCase().includes('verify')) {
        toast.error('Please verify your email first')
        // Navigate to OTP verification page
        navigate('/verify-otp', { 
          state: { 
            email: form.email,
            fromLogin: true
          }
        })
      } else {
        toast.error(errorMsg || 'Invalid credentials')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-5">
          <Wallet size={26} className="text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-50">AI Finance</h1>
        <p className="text-sm text-muted text-center mt-1 mb-8">
          {location.state?.message || 'Welcome back — sign in to continue'}
        </p>

        <div className="space-y-4">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                className="input pl-10" 
                type="email" 
                placeholder="you@example.com"
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
                required 
                disabled={loading}
              />
            </div>
          </div>
          
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                className="input pl-10" 
                type="password" 
                placeholder="Your password"
                value={form.password} 
                onChange={e => setForm({ ...form, password: e.target.value })} 
                required 
                disabled={loading}
              />
            </div>
          </div>

          <button 
            className="btn-primary w-full" 
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="text-sm text-center space-y-1.5">
            <Link to="/forgot-password" className="text-accent hover:underline block">
              Forgot password?
            </Link>
            <p className="text-muted">
              No account? <Link to="/register" className="text-accent hover:underline">Create one</Link>
            </p>
            <p className="text-muted text-xs mt-2">
              Need to verify? <Link to="/verify-otp" className="text-accent hover:underline">Verify with OTP</Link>
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}