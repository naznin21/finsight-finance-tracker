import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../services/api'
import toast from 'react-hot-toast'
import { Wallet } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await forgotPassword(email)
      toast.success('Reset link sent to your email.')
    } catch {
      toast.error('Email not found.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-5">
          <Wallet size={26} className="text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-50">Forgot password</h1>
        <p className="text-sm text-muted text-center mt-1 mb-8">We'll email you a reset link</p>

        <div className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <button className="btn-primary w-full" type="submit">Send reset link</button>
          <p className="text-sm text-center text-muted">
            <Link to="/login" className="text-accent hover:underline">Back to sign in</Link>
          </p>
        </div>
      </form>
    </div>
  )
}
