import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { sendOtp, verifyOtp } from '../services/api'
import toast from 'react-hot-toast'
import { Wallet, Mail, KeyRound, ArrowLeft } from 'lucide-react'

export default function VerifyOtpPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [timer, setTimer] = useState(0)
  const [verified, setVerified] = useState(false) // ⭐ Added verified state
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Get email from location state if coming from registration
    if (location.state?.email) {
      setEmail(location.state.email)
      // ⭐ Only auto-send if coming from registration
      if (location.state?.fromRegistration) {
        // Use setTimeout to avoid race condition
        setTimeout(() => {
          handleSendOtp(location.state.email)
        }, 500)
      }
    }
  }, [location])

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  const handleSendOtp = async (emailToUse = email) => {
    if (!emailToUse) {
      toast.error('Please enter your email')
      return
    }

    setLoading(true)
    try {
      await sendOtp(emailToUse)
      setOtpSent(true)
      setTimer(60)
      toast.success('OTP sent to your email!')
    } catch (error) {
      const errorMsg = error.response?.data || 'Failed to send OTP'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    
    if (!email || !otp) {
      toast.error('Please enter both email and OTP')
      return
    }

    if (otp.length !== 6) {
      toast.error('OTP must be 6 digits')
      return
    }

    setLoading(true)
    try {
      await verifyOtp(email, otp)
      setVerified(true) // ⭐ Set verified
      toast.success('✅ Email verified successfully!')
      
      // Redirect to login after successful verification
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Email verified! You can now login.' }
        })
      }, 2000)
    } catch (error) {
      const errorMsg = error.response?.data || 'Invalid OTP. Please try again.'
      toast.error(errorMsg)
      setOtp('') // ⭐ Clear OTP on error
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // ⭐ Show success screen if verified
  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-full bg-income/15 flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-income" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-50">Email Verified! 🎉</h1>
          <p className="text-muted mt-2">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-5">
          <KeyRound size={26} className="text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-50">Verify Your Email</h1>
        <p className="text-sm text-muted text-center mt-1 mb-8">
          {otpSent 
            ? 'Enter the 6-digit code sent to your email' 
            : 'Enter your email to receive verification code'}
        </p>

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="input pl-10"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={otpSent && location.state?.fromRegistration}
                required
              />
            </div>
          </div>

          {/* OTP Input - Only show if OTP sent */}
          {otpSent && (
            <div>
              <label className="label">Verification Code</label>
              <div className="relative">
                <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  className="input pl-10 text-center text-2xl tracking-widest font-bold"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                  autoFocus={otpSent} // ⭐ Auto-focus on OTP input
                />
              </div>
              <p className="text-xs text-muted mt-1.5">
                Enter the 6-digit code sent to {email}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                <Mail size={12} />
                <span>Check your spam folder if you don't see the email</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {otpSent ? (
            <>
              <button
                className="btn-primary w-full"
                type="submit"
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={timer > 0 || loading}
                  className="text-sm text-accent hover:underline disabled:text-muted disabled:cursor-not-allowed"
                >
                  {timer > 0 
                    ? `Resend in ${formatTime(timer)}` 
                    : 'Resend OTP'}
                </button>
              </div>
            </>
          ) : (
            <button
              className="btn-primary w-full"
              type="button"
              onClick={() => handleSendOtp()}
              disabled={loading || !email}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          )}

          {/* Back to Login */}
          <div className="text-sm text-center space-y-1.5 pt-2 border-t border-line">
            <Link to="/login" className="text-muted hover:text-slate-100 inline-flex items-center gap-1.5">
              <ArrowLeft size={14} />
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}