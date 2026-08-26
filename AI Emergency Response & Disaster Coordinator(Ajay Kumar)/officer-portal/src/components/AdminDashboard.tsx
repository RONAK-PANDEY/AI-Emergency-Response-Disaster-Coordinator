import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { AuthUser } from './AuthModal'
import EmergencyMap from './EmergencyMap'
import LiveRescueTracker from './LiveRescueTracker'

type Severity = 'low' | 'medium' | 'high' | 'critical'
type Status = 'new' | 'reported' | 'investigating' | 'in_progress' | 'resolved' | 'closed'

interface HazardPolygon {
  coordinates: [number, number][]
  center: [number, number]
  radius_meters: number
  severity: string
  fill_color: string
  border_color: string
  opacity: number
  zone_label: string
}

interface Incident {
  id: number
  tracking_code?: string
  type: string
  severity?: Severity
  latitude: number
  longitude: number
  description: string
  summary?: string
  people_affected?: number
  priority?: number
  confidence?: number
  source?: string
  report_count?: number
  status?: Status
  assigned_team?: string | null
  is_verified?: boolean
  verified_by?: string | null
  resolution_notes?: string | null
  is_duplicate_of?: number | null
  reporter_name?: string | null
  reporter_contact?: string | null
  polygon?: HazardPolygon | null
  reviews?: Array<{ overall_rating: number; feedback_text?: string }>
  created_at: string
}

interface AuditLog {
  id: number
  incident_id?: number | null
  officer_name: string
  action: string
  details: string
  timestamp?: string | null
}

const RESPONSE_TEAMS = [
  'NDRF 7th Battalion (Water Rescue Alpha)',
  'Punjab Fire & Rescue Unit 2 (Foam Tender)',
  'Civil Hospital 108 Advanced Life Support ICU',
  'SDRF Heavy Extrication & Crane Unit',
  'Punjab Police Emergency QRT Patrol',
  'District Rapid Action Medical Team',
]

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const SEVERITY_BADGE: Record<Severity, string> = {
  critical: 'bg-red-600 text-white font-bold',
  high: 'bg-orange-600 text-white font-bold',
  medium: 'bg-amber-500 text-slate-900 font-bold',
  low: 'bg-emerald-600 text-white font-bold',
}

const STATUS_LABEL: Record<Status, string> = {
  new: 'New SOS',
  reported: 'Reported',
  investigating: 'Verified by EOC',
  in_progress: 'Responding (Units En Route)',
  resolved: 'Resolved',
  closed: 'Closed',
}

const STATUS_BADGE: Record<Status, string> = {
  new: 'bg-amber-100 text-amber-900 border-amber-300',
  reported: 'bg-orange-100 text-orange-900 border-orange-300',
  investigating: 'bg-blue-100 text-blue-900 border-blue-300 font-semibold',
  in_progress: 'bg-sky-600 text-white font-bold animate-pulse',
  resolved: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
  closed: 'bg-slate-200 text-slate-700 border-slate-300',
}

interface AdminDashboardProps {
  user: AuthUser | null
  token: string | null
  onOpenAuth: () => void
  refreshTrigger?: boolean
  onRefresh?: () => void | Promise<void>
}

export default function AdminDashboard({
  user,
  token,
  onOpenAuth,
  refreshTrigger = false,
  onRefresh,
}: AdminDashboardProps) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)

  // Modals & Panels
  const [assignModalIncident, setAssignModalIncident] = useState<Incident | null>(null)
  const [selectedTeam, setSelectedTeam] = useState(RESPONSE_TEAMS[0])
  const [resolveModalIncident, setResolveModalIncident] = useState<Incident | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [showAuditDrawer, setShowAuditDrawer] = useState(false)

  // Citizen Reviews Drawer & EOC Analytics
  const [reviews, setReviews] = useState<any[]>([])
  const [showReviewsDrawer, setShowReviewsDrawer] = useState(false)
  const [loadingReviews, setLoadingReviews] = useState(false)

  // Map state: true = map visible, managed strictly here
  const [showMapSplit, setShowMapSplit] = useState(true)

  // Live Rescue Telemetry Modal
  const [trackingIncidentId, setTrackingIncidentId] = useState<number | null>(null)
  const [trackingCode, setTrackingCode] = useState<string>('')

  // State Analytics & Resource Telemetry
  const [analyticsData, setAnalyticsData] = useState<any>(null)

  // Track previous incident ids to detect new ones without full reload flash
  const prevIncidentIds = useRef<Set<number>>(new Set())

  const fetchIncidents = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const endpoint =
        user?.role === 'officer' || user?.role === 'admin'
          ? 'http://localhost:8000/api/officer/incidents'
          : 'http://localhost:8000/api/incidents'

      const response = await fetch(endpoint, { headers })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()
      const fetched: Incident[] = data.incidents || []

      // Deduplicate: keep existing order, append new ones at top
      setIncidents((prev) => {
        const existingIds = new Set(prev.map((i) => i.id))
        const updatedMap = new Map(fetched.map((i) => [i.id, i]))
        // Merge: update existing, prepend truly new ones
        const merged = fetched.sort((a, b) => b.id - a.id)
        prevIncidentIds.current = new Set(merged.map((i) => i.id))
        return merged
      })

      setLastRefreshed(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch incidents')
    } finally {
      setLoading(false)
    }
  }, [token, user])

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/api/analytics')
      if (res.ok) {
        const data = await res.json()
        setAnalyticsData(data)
      }
    } catch (err) {
      console.error('Analytics fetch error:', err)
    }
  }, [])

  const fetchAuditLogs = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('http://localhost:8000/api/officer/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data || [])
      }
    } catch (err) {
      console.error('Audit fetch error:', err)
    }
  }, [token])

  const fetchReviews = useCallback(async () => {
    if (!token) return
    setLoadingReviews(true)
    try {
      const res = await fetch('http://localhost:8000/api/officer/reviews', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setReviews(data || [])
      }
    } catch (err) {
      console.error('Reviews fetch error:', err)
    } finally {
      setLoadingReviews(false)
    }
  }, [token])

  // Manual refresh with visual feedback
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([fetchIncidents(true), fetchAnalytics()])
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchIncidents, fetchAnalytics])

  // Initial load + live polling every 5 seconds (silent, no loading flash)
  useEffect(() => {
    fetchIncidents(false)
    fetchAnalytics()

    const interval = setInterval(() => {
      fetchIncidents(true)  // silent = true keeps existing list visible while updating
      fetchAnalytics()
    }, 5000)

    return () => clearInterval(interval)
  }, [fetchIncidents, fetchAnalytics])

  // Audit logs loaded only when drawer is opened
  useEffect(() => {
    if (showAuditDrawer) {
      fetchAuditLogs()
    }
  }, [showAuditDrawer, fetchAuditLogs])

  // Reviews loaded only when drawer is opened
  useEffect(() => {
    if (showReviewsDrawer) {
      fetchReviews()
    }
  }, [showReviewsDrawer, fetchReviews])

  // Auto-close map split whenever any full-page section, drawer, or modal is opened
  useEffect(() => {
    if (
      selectedIncident ||
      assignModalIncident ||
      resolveModalIncident ||
      showAuditDrawer ||
      showReviewsDrawer ||
      trackingIncidentId
    ) {
      setShowMapSplit(false)
    }
  }, [
    selectedIncident,
    assignModalIncident,
    resolveModalIncident,
    showAuditDrawer,
    showReviewsDrawer,
    trackingIncidentId,
  ])

  // Officer: Verify Incident (Triggers Smart Auto-Dispatch)
  const handleVerifyReject = async (incidentId: number, action: 'verify' | 'reject') => {
    try {
      const res = await fetch(`http://localhost:8000/api/officer/incidents/${incidentId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, notes: `Verified by ${user?.full_name || 'State EOC Officer'}` }),
      })
      if (res.ok) {
        await fetchIncidents(true)
        await fetchAnalytics()
        setSelectedIncident(null)
      }
    } catch (err) {
      console.error('Verify error:', err)
    }
  }

  // Officer: Assign Emergency Team
  const handleAssignTeam = async () => {
    if (!assignModalIncident || !selectedTeam) return
    try {
      const res = await fetch(
        `http://localhost:8000/api/officer/incidents/${assignModalIncident.id}/assign-team`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ team_name: selectedTeam }),
        }
      )
      if (res.ok) {
        await fetchIncidents(true)
        await fetchAnalytics()
        setAssignModalIncident(null)
      }
    } catch (err) {
      console.error('Assign team error:', err)
    }
  }

  // Officer: Resolve Incident (Propagates to Citizen & citizen review)
  const handleResolveIncident = async () => {
    if (!resolveModalIncident) return
    try {
      const res = await fetch(`http://localhost:8000/api/incidents/${resolveModalIncident.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'resolved',
          resolution_notes: resolutionNotes || 'Incident contained and neutralized. Area verified safe by Incident Commander.',
        }),
      })
      if (res.ok) {
        await fetchIncidents(true)
        await fetchAnalytics()
        setResolveModalIncident(null)
        setResolutionNotes('')
        setSelectedIncident(null)
      }
    } catch (err) {
      console.error('Resolve error:', err)
    }
  }

  const filteredIncidents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return incidents.filter((inc) => {
      const matchesSearch =
        !term ||
        inc.description.toLowerCase().includes(term) ||
        inc.type.toLowerCase().includes(term) ||
        (inc.tracking_code && inc.tracking_code.toLowerCase().includes(term)) ||
        (inc.assigned_team && inc.assigned_team.toLowerCase().includes(term))

      const matchesSeverity = severityFilter === 'all' || inc.severity === severityFilter
      const matchesStatus = statusFilter === 'all' || inc.status === statusFilter

      return matchesSearch && matchesSeverity && matchesStatus
    })
  }, [searchTerm, severityFilter, statusFilter, incidents])

  const stats = useMemo(() => {
    const active = incidents.filter((i) => ['new', 'reported', 'investigating', 'in_progress'].includes(i.status || 'new')).length
    const critical = incidents.filter((i) => (i.severity || 'low') === 'critical').length
    const dispatched = incidents.filter((i) => !!i.assigned_team).length
    const resolved = incidents.filter((i) => i.status === 'resolved').length
    return { active, critical, dispatched, resolved }
  }, [incidents])

  return (
    <div className="flex h-full flex-col bg-slate-100 text-slate-900 overflow-hidden font-sans">
      {/* 1. National IMD / Flash Flood Alert Ribbon */}
      <div className="bg-red-700 px-4 py-2 text-white shadow-md flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-bold truncate">
          <span className="flex h-2.5 w-2.5 rounded-full bg-white animate-ping" />
          <span>IMD FLASH WARNING:</span>
          <span className="font-normal text-red-100 truncate">
            Sutlej & Beas Basin Red Alert (110 mm/hr Heavy Rain) • NDRF Battalions 7 & 8 on standby
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-red-200">
          <span>Toll-Free Control Room: <strong>1070</strong></span>
        </div>
      </div>

      {/* 2. Top Officer Government Header */}
      <div className="border-b border-slate-300 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-900 text-2xl font-bold text-white shadow-md shadow-blue-900/30">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-slate-900 sm:text-lg">
                  State Emergency Operations Centre (SEOC)
                </h1>
                <span className="rounded bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-900 border border-blue-300">
                  Govt of India / SDMA
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {user?.role === 'officer'
                  ? `Authenticated Officer: ${user.full_name} (${user.department || 'Punjab Disaster Management Authority'})`
                  : 'Authorized Personnel Only. Verify alerts, dispatch emergency fleets, and manage GIS zones.'}
              </p>
              {lastRefreshed && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Last synced: {lastRefreshed.toLocaleTimeString()} • Auto-refreshes every 5s
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!user || user.role !== 'officer' ? (
              <button
                type="button"
                onClick={onOpenAuth}
                className="rounded-xl bg-blue-900 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-900/30 hover:bg-blue-800 transition"
              >
                🔐 Officer Login
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowAuditDrawer(true)}
                  className="rounded-xl border border-slate-300 bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-200 transition shadow-sm"
                >
                  📜 Audit Logs ({auditLogs.length || '•'})
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewsDrawer(true)}
                  className="rounded-xl border border-slate-300 bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-200 transition shadow-sm"
                >
                  ⭐ Citizen Reviews ({reviews.length || '•'})
                </button>
              </>
            )}

            {/* Map Toggle — reliable boolean flip */}
            <button
              type="button"
              onClick={() => setShowMapSplit((prev) => !prev)}
              className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-sm ${
                showMapSplit
                  ? 'border-blue-300 bg-blue-50 text-blue-900 hover:bg-blue-100'
                  : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              {showMapSplit ? '🗺️ Hide Map' : '🗺️ Show Map'}
            </button>

            {/* Refresh with loading spinner */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-sm transition ${
                isRefreshing
                  ? 'bg-blue-700 opacity-75 cursor-not-allowed'
                  : 'bg-blue-900 hover:bg-blue-800'
              }`}
              title="Fetch latest data from server"
            >
              {isRefreshing ? (
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Refreshing...
                </span>
              ) : (
                '↻ Refresh Feeds'
              )}
            </button>
          </div>
        </div>

        {/* 3. Executive KPI Dashboard Grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5 pt-3 border-t border-slate-200">
          <div 
            onClick={() => {
              setStatusFilter('new');
              setSeverityFilter('all');
              setShowMapSplit(false);
            }}
            className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 cursor-pointer hover:bg-blue-100/75 transition shadow-sm"
            title="Filter by New SOS & Auto-Close Map"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-900 flex justify-between items-center">
              <span>Active Incidents</span>
              <span className="text-xs">🔍</span>
            </div>
            <div className="text-2xl font-black text-blue-950 mt-0.5">{stats.active}</div>
          </div>

          <div 
            onClick={() => {
              setSeverityFilter('critical');
              setStatusFilter('all');
              setShowMapSplit(false);
            }}
            className="rounded-xl border border-red-200 bg-red-50/60 p-3 cursor-pointer hover:bg-red-100/75 transition shadow-sm"
            title="Filter by Critical Red Alerts & Auto-Close Map"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-red-900 flex justify-between items-center">
              <span>Critical Red Alerts</span>
              <span className="text-xs">🔥</span>
            </div>
            <div className="text-2xl font-black text-red-700 mt-0.5">{stats.critical}</div>
          </div>

          <div 
            onClick={() => {
              setStatusFilter('in_progress');
              setSeverityFilter('all');
              setShowMapSplit(false);
            }}
            className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 cursor-pointer hover:bg-sky-100/75 transition shadow-sm"
            title="Filter by Dispatched Fleets & Auto-Close Map"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-900 flex justify-between items-center">
              <span>Fleets Deployed</span>
              <span className="text-xs">🚑</span>
            </div>
            <div className="text-2xl font-black text-sky-900 mt-0.5">{stats.dispatched}</div>
          </div>

          <div 
            onClick={() => {
              setStatusFilter('resolved');
              setSeverityFilter('all');
              setShowMapSplit(false);
            }}
            className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 cursor-pointer hover:bg-emerald-100/75 transition shadow-sm"
            title="Filter by Resolved Today & Auto-Close Map"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 flex justify-between items-center">
              <span>Resolved Today</span>
              <span className="text-xs">✓</span>
            </div>
            <div className="text-2xl font-black text-emerald-800 mt-0.5">{stats.resolved}</div>
          </div>

          <div 
            onClick={() => {
              setShowReviewsDrawer(true);
              setShowMapSplit(false);
            }}
            className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-xl border border-amber-200 bg-amber-50/60 p-3 cursor-pointer hover:bg-amber-100/75 transition shadow-sm"
            title="View Citizen Analytics & Auto-Close Map"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex justify-between items-center">
              <span>Citizen Satisfaction</span>
              <span className="text-xs">⭐</span>
            </div>
            <div className="text-lg font-black text-amber-900 mt-0.5">
              ⭐ {analyticsData?.citizen_rating?.average_overall || '4.85'} / 5.0
            </div>
          </div>
        </div>

        {/* 4. AI Unified Clustering Banner */}
        {analyticsData?.unified_cluster && (
          <div className="mt-3 rounded-xl border border-blue-300 bg-gradient-to-r from-blue-900 to-indigo-900 p-3 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-700 text-sm font-bold">
                🧠
              </span>
              <div>
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>AI Unified Incident Clustering</span>
                  <span className="rounded bg-blue-800 px-1.5 py-0.2 text-[10px] font-mono text-cyan-200">
                    {analyticsData.unified_cluster.ai_confidence}% Confidence
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-100">
                  {analyticsData.unified_cluster.reports_merged} citizen calls consolidated into 1 unified disaster event • {analyticsData.unified_cluster.location}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="rounded-lg bg-blue-800 px-2.5 py-1 text-[11px] font-bold text-white border border-blue-600">
                Units Dispatched: Police PCR + NDRF 7th BN
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Main Spacious Split Layout */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Left: GIS Map with Dynamic Polygons — shown/hidden by toggle */}
        {showMapSplit && (
          <div className="relative h-64 sm:h-80 lg:h-auto lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-300 bg-white">
            <EmergencyMap
              onTrackIncident={(id, code) => {
                setTrackingIncidentId(id)
                setTrackingCode(code || `EMG-${id}`)
              }}
            />
            <div className="absolute top-3 left-3 z-[1000] rounded-lg bg-slate-900/90 border border-slate-700 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
              GIS Tactical Threat Polygons & Dispatched Units
            </div>
          </div>
        )}

        {/* Right: Incident Triage Queue with Dedicated Smooth Scroller */}
        <div className={`flex flex-1 flex-col overflow-hidden bg-white ${!showMapSplit ? 'w-full' : 'lg:w-1/2'}`}>
          {/* Search & Severity / Status Filters */}
          <div className="border-b border-slate-200 bg-slate-50 p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Tracking Code, Incident Type, Description, or Unit..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-700 focus:outline-none shadow-sm"
              />
              {/* Inline quick refresh for the list */}
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex-shrink-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
                title="Refresh incident list"
              >
                {isRefreshing ? (
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : '↻'}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-bold uppercase">Severity:</span>
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverityFilter(sev)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
                      severityFilter === sev
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {sev.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-bold uppercase">Status:</span>
                {(['all', 'new', 'investigating', 'in_progress', 'resolved'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st as any)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
                      statusFilter === st
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {st === 'investigating' ? 'Verified' : st === 'in_progress' ? 'Responding' : st.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Incident count + live indicator */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500">
            <span>
              Showing <strong className="text-slate-700">{filteredIncidents.length}</strong> of {incidents.length} incidents
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed Active
            </span>
          </div>

          {/* Smooth Scrollable Incidents List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-100">
            {loading && incidents.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <svg className="h-8 w-8 animate-spin mx-auto text-blue-900" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <div className="text-xs text-slate-500">Loading State EOC emergency feeds...</div>
              </div>
            ) : error ? (
              <div className="py-12 text-center space-y-3">
                <div className="text-2xl">⚠️</div>
                <div className="text-xs text-red-700 font-semibold">{error}</div>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800"
                >
                  Retry
                </button>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No incidents match the selected filter criteria.
              </div>
            ) : (
              filteredIncidents.map((incident) => {
                const sev = incident.severity || 'low'
                const stat = incident.status || 'new'

                return (
                  <div
                    key={incident.id}
                    className="rounded-xl border border-slate-300 bg-white p-4 space-y-3 shadow-sm hover:border-slate-400 transition"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-amber-300">
                          {incident.tracking_code || `EMG-${incident.id}`}
                        </span>
                        <span className="text-sm font-bold text-slate-900 capitalize">
                          {incident.type.replace('_', ' ')}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                          Priority: {incident.priority}/100
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${SEVERITY_BADGE[sev]}`}>
                          {sev}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] border ${STATUS_BADGE[stat]}`}>
                          {STATUS_LABEL[stat] || stat}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-800 font-normal leading-relaxed">{incident.description}</p>

                    {/* Auto-Dispatch Telemetry Card */}
                    <div className="grid gap-2 text-[11px] sm:grid-cols-2 rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-slate-700">
                      <div>
                        <span className="text-slate-500 font-semibold">Auto-Dispatched Unit:</span>{' '}
                        <strong className="text-blue-900">
                          {incident.assigned_team ? `🛡️ ${incident.assigned_team}` : '⚠️ Pending Verification'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">Reporter:</span>{' '}
                        <span className="font-medium text-slate-900">
                          {incident.reporter_name || 'Verified Citizen'} ({incident.reporter_contact || 'Protected'})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">Coordinates:</span>{' '}
                        <span className="font-mono text-slate-800">
                          {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">Casualties / Affected:</span>{' '}
                        <span className="font-bold text-red-700">{incident.people_affected || 0}</span>
                      </div>
                      {incident.resolution_notes && (
                        <div className="sm:col-span-2 text-emerald-800 pt-1 border-t border-slate-200 font-medium">
                          ✓ Official Resolution: {incident.resolution_notes}
                        </div>
                      )}
                    </div>

                    {/* Officer Action Bar */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedIncident(incident)}
                        className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition"
                      >
                        🔍 Details
                      </button>

                      {/* Live Rescue Telemetry CTA */}
                      <button
                        type="button"
                        onClick={() => {
                          setTrackingIncidentId(incident.id)
                          setTrackingCode(incident.tracking_code || `EMG-${incident.id}`)
                        }}
                        className="rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-800 shadow-sm transition"
                      >
                        🚑 Live Telemetry
                      </button>

                      {user?.role === 'officer' && (
                        <>
                          {!incident.is_verified && (
                            <button
                              type="button"
                              onClick={() => handleVerifyReject(incident.id, 'verify')}
                              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 shadow-sm transition"
                            >
                              ✓ Verify & Auto-Dispatch
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setAssignModalIncident(incident)}
                            className="rounded-lg bg-indigo-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-600 shadow-sm transition"
                          >
                            🚒 Dispatch Unit
                          </button>

                          {incident.status !== 'resolved' && incident.status !== 'closed' && (
                            <button
                              type="button"
                              onClick={() => setResolveModalIncident(incident)}
                              className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition"
                            >
                              ✓ Mark Resolved
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* 6. MODAL: LIVE RESCUE TELEMETRY */}
      {trackingIncidentId && (
        <LiveRescueTracker
          incidentId={trackingIncidentId}
          trackingCode={trackingCode}
          onClose={() => setTrackingIncidentId(null)}
        />
      )}

      {/* 7. MODAL: DISPATCH RESPONSE UNIT */}
      {assignModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-300 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Deploy Emergency Response Unit</h3>
              <button
                type="button"
                onClick={() => setAssignModalIncident(null)}
                className="text-slate-400 hover:text-slate-900 font-bold text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div>Incident: <strong>{assignModalIncident.tracking_code} ({assignModalIncident.type})</strong></div>
              <p className="text-slate-500">{assignModalIncident.description}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Select Specialized Disaster Unit:
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-blue-900 focus:outline-none"
              >
                {RESPONSE_TEAMS.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssignModalIncident(null)}
                className="flex-1 rounded-xl border border-slate-300 bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignTeam}
                className="flex-1 rounded-xl bg-blue-900 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/30 hover:bg-blue-800"
              >
                Dispatch Fleet Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: RESOLVE INCIDENT */}
      {resolveModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-300 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Mark Incident as Resolved</h3>
              <button
                type="button"
                onClick={() => setResolveModalIncident(null)}
                className="text-slate-400 hover:text-slate-900 font-bold text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              When resolved, the status and resolution summary will automatically update on the <strong>Citizen Reporter Portal</strong> and unlock citizen feedback.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Official Resolution Report Notes:
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Fire extinguished by Unit 2. All 14 trapped persons safely rescued. Situation under control."
                rows={3}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResolveModalIncident(null)}
                className="flex-1 rounded-xl border border-slate-300 bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveIncident}
                className="flex-1 rounded-xl bg-emerald-800 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-800/30 hover:bg-emerald-700"
              >
                Mark Resolved & Notify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: INCIDENT DETAIL */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-300 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Emergency Dossier ({selectedIncident.tracking_code || `EMG-${selectedIncident.id}`})
              </h3>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-slate-900 font-bold text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-800">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">Category:</span>{' '}
                  <strong className="capitalize text-slate-900">{selectedIncident.type}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Severity:</span>{' '}
                  <strong className="capitalize text-red-700">{selectedIncident.severity}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Priority Score:</span>{' '}
                  <strong className="text-blue-900">{selectedIncident.priority}/100</strong>
                </div>
                <div>
                  <span className="text-slate-500">People Impacted:</span>{' '}
                  <strong className="text-amber-800">{selectedIncident.people_affected || 0}</strong>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold">AI Triage Summary:</span>
                <p className="mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">
                  {selectedIncident.summary || selectedIncident.description}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-bold">Full Incident Description:</span>
                <p className="mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700">
                  {selectedIncident.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 font-bold">Reporter Contact (Official Access):</span>
                  <div className="font-semibold text-slate-900">
                    {selectedIncident.reporter_name || 'Citizen'} ({selectedIncident.reporter_contact || 'Protected'})
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">Assigned Response Fleet:</span>
                  <div className="font-semibold text-blue-900">
                    {selectedIncident.assigned_team || 'Pending dispatch'}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedIncident(null)}
              className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}

      {/* 10. DRAWER: OFFICIAL GOVERNMENT AUDIT TRAIL */}
      {showAuditDrawer && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-300 shadow-2xl p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>📜</span> Official Government Audit Trail
            </h3>
            <button
              type="button"
              onClick={() => setShowAuditDrawer(false)}
              className="text-slate-400 hover:text-slate-900 font-bold text-lg leading-none"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5">
            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No audit log records found.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-blue-900 px-2 py-0.5 font-bold text-white text-[10px]">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900">{log.officer_name}</div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{log.details}</p>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAuditDrawer(false)}
            className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-700"
          >
            Close Audit Logs
          </button>
        </div>
      )}

      {/* 11. DRAWER: CITIZEN REVIEWS & EOC ANALYTICS */}
      {showReviewsDrawer && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-300 shadow-2xl p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>⭐</span> Citizen Feedback & Operations Ratings
            </h3>
            <button
              type="button"
              onClick={() => setShowReviewsDrawer(false)}
              className="text-slate-400 hover:text-slate-950 font-bold text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {analyticsData?.citizen_rating && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-905 space-y-1">
              <div className="font-bold text-sm text-amber-900">Overall Service Level Agreement (SLA)</div>
              <div className="text-amber-950">Average Rating: <strong className="text-base font-black">{analyticsData.citizen_rating.average_overall} / 5.0</strong></div>
              <div className="text-[11px] text-amber-800">Based on {analyticsData.citizen_rating.total_reviews} verified post-rescue citizen reviews.</div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-2.5">
            {loadingReviews ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Fetching reviews from verified citizen accounts...
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No citizen reviews recorded yet.
              </div>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Incident Code: {rev.incident_tracking_code || `EMG-${rev.incident_id}`}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <div className="flex gap-4 border-t border-b border-slate-100 py-1.5 text-[10px] text-slate-600">
                    <div>Time: <strong className="text-slate-900">⭐{rev.response_time_rating}/5</strong></div>
                    <div>Efficiency: <strong className="text-slate-900">⭐{rev.rescue_efficiency_rating}/5</strong></div>
                    <div>Staff: <strong className="text-slate-900">⭐{rev.staff_behaviour_rating}/5</strong></div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 text-[11px]">Overall Rating: </span>
                    <span className="text-amber-500 font-bold">{'★'.repeat(rev.overall_rating)}{'☆'.repeat(5 - rev.overall_rating)}</span>
                  </div>
                  {rev.feedback_text && (
                    <p className="text-slate-600 bg-white p-2 rounded border border-slate-200 italic text-[11px] leading-relaxed">
                      "{rev.feedback_text}"
                    </p>
                  )}
                  <div className="text-[10px] text-slate-400 text-right">- Submitted by {rev.reporter_name || 'Citizen'}</div>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowReviewsDrawer(false)}
            className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-700"
          >
            Close Reviews
          </button>
        </div>
      )}
    </div>
  )
}
