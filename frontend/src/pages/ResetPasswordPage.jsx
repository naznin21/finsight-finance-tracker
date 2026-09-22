import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { resetPassword } from '../services/api'
import toast from 'react-hot-toast'
import { Wallet } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await resetPassword(params.get('token'), password)
      toast.success('Password reset successful.')
      navigate('/login')
    } catch {
      toast.error('Invalid or expired token.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-5">
          <Wallet size={26} className="text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-50">Reset password</h1>
        <p className="text-sm text-muted text-center mt-1 mb-8">Choose a new password for your account</p>

        <div className="space-y-4">
          <div>
            <label className="label">New password</label>
            <input className="input" type="password" placeholder="Min. 6 characters"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn-primary w-full" type="submit">Reset password</button>
          <p className="text-sm text-center text-muted">
            <Link to="/login" className="text-accent hover:underline">Back to sign in</Link>
          </p>
        </div>
      </form>
    </div>
  )
}
