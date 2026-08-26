import React, { useState } from 'react'

export interface AuthUser {
  id: number
  email: string
  phone?: string | null
  full_name: string
  role: 'reporter' | 'officer' | 'admin'
  badge_number?: string | null
  department?: string | null
  is_verified: boolean
}

interface AuthModalProps {
  isOpen: boolean
  initialTab?: 'reporter' | 'officer'
  onClose: () => void
  onAuthSuccess: (user: AuthUser, token: string) => void
}

export default function AuthModal({
  isOpen,
  initialTab = 'reporter',
  onClose,
  onAuthSuccess,
}: AuthModalProps) {
  const [tab, setTab] = useState<'reporter' | 'officer'>(initialTab)

  // Reporter OTP state
  const [reporterIdentifier, setReporterIdentifier] = useState('citizen@demo.in')
  const [reporterName, setReporterName] = useState('Aarav Singh')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [demoCode, setDemoCode] = useState('123456')

  // Officer login state
  const [officerEmail, setOfficerEmail] = useState('officer@punjab.gov.in')
  const [officerPassword, setOfficerPassword] = useState('Admin@123')

  // Loading & Error states
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  if (!isOpen) return null

  // 1. Send OTP for Citizen
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!reporterIdentifier.trim()) {
      setErrorMessage('Please enter an email address or mobile number.')
      return
    }

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const res = await fetch('http://localhost:8000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: reporterIdentifier.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to send OTP')

      setOtpSent(true)
      setDemoCode(data.demo_otp || '123456')
      setOtpCode(data.demo_otp || '123456')
      setSuccessMessage(data.message || 'OTP sent successfully!')
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send verification code.')
    } finally {
      setLoading(false)
    }
  }

  // 2. Verify OTP for Citizen
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpCode.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const res = await fetch('http://localhost:8000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: reporterIdentifier.trim(),
          otp_code: otpCode.trim(),
          full_name: reporterName.trim() || 'Verified Citizen Reporter',
          role: 'reporter',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Invalid verification code')

      onAuthSuccess(data.user, data.token)
      onClose()
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed.')
    } finally {
      setLoading(false)
    }
  }

  // 3. Government Officer Login
  const handleOfficerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!officerEmail || !officerPassword) {
      setErrorMessage('Please enter both officer email and password.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: officerEmail.trim(),
          password: officerPassword,
          portal: 'officer',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Authentication failed')

      onAuthSuccess(data.user, data.token)
      onClose()
    } catch (err: any) {
      setErrorMessage(err.message || 'Government officer login failed.')
    } finally {
      setLoading(false)
    }
  }

  const fillCitizenDemo = () => {
    setReporterIdentifier('citizen@demo.in')
    setReporterName('Aarav Singh')
    handleSendOtp()
  }

  const fillOfficerDemo = () => {
    setOfficerEmail('officer@punjab.gov.in')
    setOfficerPassword('Admin@123')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl">
        {/* Official Header */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-blue-950 to-blue-900 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏛️</span>
              <div>
                <h3 className="text-sm font-bold">Government Disaster Coordination Network</h3>
                <p className="text-[11px] text-blue-200">NDMA / State Emergency Operations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white font-bold p-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Portal Mode Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-100">
          <button
            type="button"
            onClick={() => {
              setTab('reporter')
              setErrorMessage('')
              setSuccessMessage('')
            }}
            className={`flex-1 py-3 text-center text-xs font-bold transition ${
              tab === 'reporter'
                ? 'border-b-2 border-red-600 bg-white text-red-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👤 Citizen Reporter OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('officer')
              setErrorMessage('')
              setSuccessMessage('')
            }}
            className={`flex-1 py-3 text-center text-xs font-bold transition ${
              tab === 'officer'
                ? 'border-b-2 border-blue-900 bg-white text-blue-900'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏛️ Government Officer
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 font-medium">
              ✗ {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 font-medium">
              ✓ {successMessage}
            </div>
          )}

          {/* TAB 1: CITIZEN REPORTER */}
          {tab === 'reporter' && (
            <div className="space-y-3.5">
              <p className="text-xs text-slate-600">
                Passwordless phone/email verification enables verified emergency reporting and live rescue fleet tracking.
              </p>

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="e.g. Aarav Singh"
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number or Email
                    </label>
                    <input
                      type="text"
                      value={reporterIdentifier}
                      onChange={(e) => setReporterIdentifier(e.target.value)}
                      placeholder="e.g. citizen@demo.in or 9876543210"
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-900 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-500 transition disabled:opacity-50"
                  >
                    {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                  </button>

                  <button
                    type="button"
                    onClick={fillCitizenDemo}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    ⚡ 1-Click Demo Citizen Login
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Enter 6-Digit OTP Code
                      </label>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-xs text-blue-700 hover:underline"
                      >
                        Change Number
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full text-center tracking-widest text-lg font-mono font-bold rounded-xl border border-blue-600 bg-blue-50/50 p-2 text-blue-950 focus:outline-none"
                    />
                  </div>

                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                    💡 Hackathon Demo OTP: <strong>{demoCode}</strong>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-700/30 hover:bg-emerald-600 transition disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP & Enter'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: GOVERNMENT OFFICER */}
          {tab === 'officer' && (
            <div className="space-y-3.5">
              <p className="text-xs text-slate-600">
                Official EOC login for Disaster Coordinators, NDRF Command, Police and Medical Dispatch.
              </p>

              <form onSubmit={handleOfficerLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={officerEmail}
                    onChange={(e) => setOfficerEmail(e.target.value)}
                    placeholder="officer@punjab.gov.in"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={officerPassword}
                    onChange={(e) => setOfficerPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-900 focus:outline-none"
                  />
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">
                  🛡️ Pre-seeded Officer: <strong>officer@punjab.gov.in</strong> / <strong>Admin@123</strong>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-900 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-900/30 hover:bg-blue-800 transition disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Access Command Center'}
                </button>

                <button
                  type="button"
                  onClick={fillOfficerDemo}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  ⚡ 1-Click Demo Officer Fill
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
