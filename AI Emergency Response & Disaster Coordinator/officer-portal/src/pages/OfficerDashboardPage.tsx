import React, { useState, useEffect } from 'react'
import AdminDashboard from '../components/AdminDashboard'
import AuthModal, { AuthUser } from '../components/AuthModal'

interface AnalyticsSummary {
  total_incidents: number
  active_incidents: number
  resolved_incidents?: number
  dispatched_teams?: number
  critical: number
  high: number
  medium: number
  low: number
  total_affected: number
  citizen_rating?: {
    average_overall: number
    total_reviews: number
  }
}

export default function OfficerDashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load saved officer session from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('emergency_officer_user')
      const savedToken = localStorage.getItem('emergency_officer_token')
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser))
        setToken(savedToken)
      } else {
        // Auto-seed demo officer session if not logged in for hackathon demo
        const defaultOfficer: AuthUser = {
          id: 1,
          email: 'officer@punjab.gov.in',
          full_name: 'Insp. R. Sharma (State Emergency Coordinator)',
          role: 'officer',
          badge_number: 'PB-DIS-092',
          department: 'Punjab State Disaster Response Authority',
          is_verified: true,
        }
        setUser(defaultOfficer)
        setToken('DEMO-OFFICER-TOKEN')
        localStorage.setItem('emergency_officer_user', JSON.stringify(defaultOfficer))
        localStorage.setItem('emergency_officer_token', 'DEMO-OFFICER-TOKEN')
      }
    } catch {
      localStorage.removeItem('emergency_officer_user')
      localStorage.removeItem('emergency_officer_token')
    }
  }, [])

  const handleAuthSuccess = (authenticatedUser: AuthUser, authToken: string) => {
    setUser(authenticatedUser)
    setToken(authToken)
    localStorage.setItem('emergency_officer_user', JSON.stringify(authenticatedUser))
    localStorage.setItem('emergency_officer_token', authToken)
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('emergency_officer_user')
    localStorage.removeItem('emergency_officer_token')
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (err) {
      console.error('Analytics error:', err)
    }
  }

  const refreshDashboard = async () => {
    setIsRefreshing(true)
    try {
      await fetchAnalytics()
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    refreshDashboard()
    const interval = setInterval(refreshDashboard, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 text-slate-900 overflow-hidden font-sans">
      {/* 1. Indian National Government Top Tricolor Accent Stripe */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-[#ff9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* 2. Official National Emergency Operations Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 bg-slate-900 px-4 py-2.5 shadow-sm text-white">
        {/* Government Emblem & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-900 border border-blue-600 font-bold text-white shadow-md">
            🏛️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-white sm:text-base">
                State Emergency Operations Centre (SEOC) Command Portal
              </span>
              <span className="rounded bg-blue-800 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 border border-blue-700">
                Government Officer Portal
              </span>
            </div>
            <div className="text-[11px] text-slate-300">
              Disaster Response Command • National Disaster Management Authority (NDMA Grid)
            </div>
          </div>
        </div>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-2.5">
          {/* Active Incidents Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{analytics?.active_incidents ?? '•'} Active Incidents</span>
          </div>

          {/* User Auth Profile / Login Button */}
          {user ? (
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🏛️</span>
                <span className="font-semibold text-slate-100 max-w-[140px] truncate">
                  {user.full_name.split(' ')[0]}
                </span>
                {user.is_verified && (
                  <span className="text-[10px] text-emerald-400" title="Verified Officer">✓</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-[11px] text-slate-400 hover:text-red-400 transition"
                title="Log out"
              >
                (Logout)
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="rounded-xl bg-blue-700 border border-blue-500 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-600 shadow-sm transition"
            >
              🔐 Officer Login
            </button>
          )}

          {/* Refresh button */}
          <button
            type="button"
            onClick={refreshDashboard}
            disabled={isRefreshing}
            className="rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
            title="Refresh Data Feeds"
          >
            <span aria-hidden="true">{isRefreshing ? '⏳' : '↻'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <AdminDashboard
          user={user}
          token={token}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          refreshTrigger={isRefreshing}
          onRefresh={refreshDashboard}
        />
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab="officer"
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  )
}
