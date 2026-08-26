import React, { useState, useEffect, useRef, useCallback } from 'react'
import { AuthUser } from './AuthModal'
import LiveRescueTracker from './LiveRescueTracker'
import PostRescueReviewModal from './PostRescueReviewModal'

interface MyReport {
  id: number
  tracking_code?: string
  type: string
  severity: string
  status: string
  description: string
  summary?: string
  people_affected?: number
  priority?: number
  confidence?: number
  assigned_team?: string | null
  resolution_notes?: string | null
  created_at: string
}

interface NearbyIncident {
  id: number
  tracking_code?: string
  type: string
  severity: string
  distance_km: number
  status: string
  summary: string
}

interface ReporterPortalProps {
  user: AuthUser | null
  token: string | null
  onOpenAuth: () => void
}

const INDIAN_LANGUAGES = [
  { code: 'hi-IN', label: 'हिंदी (Hindi)' },
  { code: 'pa-IN', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)' },
  { code: 'mr-IN', label: 'मराठी (Marathi)' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)' },
]

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-amber-100 text-amber-900 border-amber-300',
  reported: 'bg-orange-100 text-orange-900 border-orange-300',
  investigating: 'bg-blue-100 text-blue-900 border-blue-300 font-semibold',
  in_progress: 'bg-sky-600 text-white font-bold',
  resolved: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
  closed: 'bg-slate-200 text-slate-700 border-slate-300',
}

const STATUS_LABEL: Record<string, string> = {
  new: 'New SOS',
  reported: 'Reported',
  investigating: 'Verified by EOC',
  in_progress: '🚑 Responding – Units En Route',
  resolved: '✓ Resolved',
  closed: 'Closed',
}

export default function ReporterPortal({ user, token, onOpenAuth }: ReporterPortalProps) {
  const [activeTab, setActiveTab] = useState<'report' | 'my-reports' | 'safety'>('report')

  // Multi-modal Report Form state
  const [description, setDescription] = useState('')
  const [latitude, setLatitude] = useState<number | null>(30.901)
  const [longitude, setLongitude] = useState<number | null>(75.857)
  const [locationName, setLocationName] = useState('Ludhiana, Punjab (Auto-detected GPS)')
  const [isLocating, setIsLocating] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('hi-IN')
  const [isListening, setIsListening] = useState(false)
  const [capturedImage, setCapturedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Instant AI Confirmation Modal
  const [submittedIncident, setSubmittedIncident] = useState<MyReport | null>(null)

  // My Reports State
  const [myReports, setMyReports] = useState<MyReport[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [isRefreshingReports, setIsRefreshingReports] = useState(false)
  const [lastReportSync, setLastReportSync] = useState<Date | null>(null)

  // Safety Around Me State
  const [nearbyIncidents, setNearbyIncidents] = useState<NearbyIncident[]>([])
  const [safetyRadius, setSafetyRadius] = useState<number>(10)
  const [loadingSafety, setLoadingSafety] = useState(false)

  // Live Rescue Telemetry Modal
  const [trackingIncidentId, setTrackingIncidentId] = useState<number | null>(null)
  const [trackingCode, setTrackingCode] = useState<string>('')

  // Post-Rescue Review Modal
  const [reviewIncidentId, setReviewIncidentId] = useState<number | null>(null)
  const [reviewTrackingCode, setReviewTrackingCode] = useState<string>('')

  const recognitionRef = useRef<any>(null)
  const reportsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-acquire Geolocation
  const acquireLocation = () => {
    setIsLocating(true)
    if (!navigator.geolocation) {
      setLocationName('Geolocation unsupported on this browser')
      setIsLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude)
        setLongitude(pos.coords.longitude)
        setLocationName(`Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)} (GPS Verified)`)
        setIsLocating(false)
      },
      (err) => {
        console.warn('Geolocation error:', err.message)
        setLocationName('Default: Ludhiana City Center (GPS Pin Active)')
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  useEffect(() => {
    acquireLocation()
  }, [])

  // Voice Speech-To-Text Setup
  const toggleVoiceRecording = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser. Please use Chrome or Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = selectedLanguage
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = (e: any) => {
      console.error('Speech error:', e)
      setIsListening(false)
    }

    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript))
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  // Handle Photo Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setCapturedImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Submit Emergency Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Please provide emergency details or speak your report.' })
      return
    }

    setIsSubmitting(true)
    setFeedbackMessage(null)

    try {
      const formData = new FormData()
      formData.append('description', description.trim())
      formData.append('latitude', String(latitude || 30.901))
      formData.append('longitude', String(longitude || 75.857))
      formData.append('source', isListening ? 'voice' : capturedImage ? 'photo' : 'text')

      if (capturedImage) {
        formData.append('image', capturedImage)
      }

      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('http://localhost:8000/api/report', {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || 'Failed to submit emergency report.')
      }

      const result = await res.json()
      setSubmittedIncident(result)
      setDescription('')
      setCapturedImage(null)
      setImagePreview(null)
      // Refresh reports in background (don't switch tab automatically)
      fetchMyReports(true)
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Error communicating with Emergency Command.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fetch Citizen Reports — silent = true means no loading spinner (background refresh)
  const fetchMyReports = useCallback(async (silent = false) => {
    if (!token) return
    if (!silent) setLoadingReports(true)
    else setIsRefreshingReports(true)
    try {
      const res = await fetch('http://localhost:8000/api/reporter/my-reports', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setMyReports(data || [])
        setLastReportSync(new Date())
      }
    } catch (err) {
      console.error('Fetch my reports error:', err)
    } finally {
      setLoadingReports(false)
      setIsRefreshingReports(false)
    }
  }, [token])

  // Fetch Safety Around Me
  const fetchSafetyAroundMe = useCallback(async () => {
    setLoadingSafety(true)
    try {
      const res = await fetch(
        `http://localhost:8000/api/safety?latitude=${latitude || 30.901}&longitude=${longitude || 75.857}&radius_km=${safetyRadius}`
      )
      if (res.ok) {
        const data = await res.json()
        setNearbyIncidents(data.incidents || [])
      }
    } catch (err) {
      console.error('Fetch safety error:', err)
    } finally {
      setLoadingSafety(false)
    }
  }, [latitude, longitude, safetyRadius])

  // Tab-aware data loading + live polling for My Reports
  useEffect(() => {
    // Clear any existing polling interval first
    if (reportsIntervalRef.current) {
      clearInterval(reportsIntervalRef.current)
      reportsIntervalRef.current = null
    }

    if (activeTab === 'my-reports') {
      fetchMyReports(false)  // initial full load
      // Poll every 6 seconds while on this tab to catch officer status updates
      reportsIntervalRef.current = setInterval(() => {
        fetchMyReports(true)  // silent background refresh
      }, 6000)
    }

    if (activeTab === 'safety') {
      fetchSafetyAroundMe()
    }

    return () => {
      if (reportsIntervalRef.current) {
        clearInterval(reportsIntervalRef.current)
        reportsIntervalRef.current = null
      }
    }
  }, [activeTab, token, fetchMyReports, fetchSafetyAroundMe])

  // Also re-fetch safety when radius changes
  useEffect(() => {
    if (activeTab === 'safety') {
      fetchSafetyAroundMe()
    }
  }, [safetyRadius])

  return (
    <div className="flex h-full flex-col bg-slate-100 text-slate-900 overflow-hidden font-sans">
      {/* 1. National Citizen Portal Header Strip */}
      <div className="border-b border-slate-300 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-2xl font-bold text-white shadow-md shadow-red-600/30">
              🚨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-slate-900 sm:text-lg">
                  Citizen Emergency Portal (नागरिक आपदा पोर्टल)
                </h1>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900 border border-emerald-300">
                  National Response Network
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Direct link to National Disaster Response Force (NDRF), Police (112), Fire (101) & Medical (108)
              </p>
            </div>
          </div>

          {/* User Auth Banner */}
          <div className="flex items-center gap-2">
            {!user ? (
              <button
                type="button"
                onClick={onOpenAuth}
                className="rounded-xl bg-blue-900 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-900/30 hover:bg-blue-800 transition"
              >
                🔐 Citizen OTP Verification
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs text-emerald-900 font-bold">
                <span>✓ Verified Citizen:</span>
                <span>{user.full_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Navigation Tabs */}
        <div className="mt-4 flex items-center gap-2 border-t border-slate-200 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'report'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            🚨 1-Tap SOS Report
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my-reports')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'my-reports'
                ? 'bg-blue-900 text-white shadow-md shadow-blue-900/30'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            📋 My Reports & Fleet Tracker ({myReports.length || '•'})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('safety')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'safety'
                ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/30'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            🛡️ Safety Around Me
          </button>
        </div>
      </div>

      {/* 3. Main Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100">
        <div className="mx-auto max-w-4xl space-y-5">
          {/* TAB 1: FILE EMERGENCY REPORT */}
          {activeTab === 'report' && (
            <div className="rounded-2xl border border-slate-300 bg-white p-5 sm:p-7 shadow-sm space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>🚨</span> Rapid Emergency Multi-Modal Incident Filing
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your report triggers instant AI automated triage, severity calculation, and fleet notification.
                </p>
              </div>

              {feedbackMessage && (
                <div
                  className={`rounded-xl p-3 text-xs font-semibold ${
                    feedbackMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {feedbackMessage.text}
                </div>
              )}

              <form onSubmit={handleSubmitReport} className="space-y-4">
                {/* Geolocation bar */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <span>📍</span>
                    <span>{locationName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={acquireLocation}
                    disabled={isLocating}
                    className="rounded-lg bg-slate-200 px-3 py-1 text-xs font-bold text-slate-800 hover:bg-slate-300 transition"
                  >
                    {isLocating ? 'Acquiring GPS...' : '↻ Refresh GPS Pin'}
                  </button>
                </div>

                {/* Voice Input Section */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <span>🎙️</span> Speak in Your Regional Language (Multi-Lingual STT)
                    </span>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="rounded-lg border border-blue-300 bg-white px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none"
                    >
                      {INDIAN_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-md transition ${
                        isListening
                          ? 'bg-red-600 text-white animate-pulse shadow-red-600/40'
                          : 'bg-blue-900 text-white hover:bg-blue-800 shadow-blue-900/30'
                      }`}
                    >
                      <span>{isListening ? '🛑 Stop Recording' : '🎤 Tap to Speak Emergency'}</span>
                    </button>
                    {isListening && (
                      <span className="text-xs text-red-600 font-semibold animate-pulse">
                        Listening in {selectedLanguage}... Speak clearly.
                      </span>
                    )}
                  </div>
                </div>

                {/* Text Description */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Emergency Situation Details (विवरण):
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe the emergency: Type of disaster (flood, fire, accident), trapped persons, exact landmark, immediate assistance needed..."
                    className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-900 focus:outline-none"
                    required
                  />
                </div>

                {/* Photo / Screenshot Evidence Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    📷 Photo or Screenshot Evidence (Optional):
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-800 hover:file:bg-slate-300"
                  />
                  {imagePreview && (
                    <div className="relative mt-2 h-36 w-48 overflow-hidden rounded-xl border border-slate-300">
                      <img src={imagePreview} alt="Evidence Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Submit SOS Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-red-600 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-xl shadow-red-600/40 hover:bg-red-500 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      TRANSMITTING EMERGENCY SOS...
                    </span>
                  ) : '🚨 TRANSMIT EMERGENCY SOS TO DISASTER COMMAND'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: MY REPORTS & FLEET TRACKING */}
          {activeTab === 'my-reports' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">My Emergency SOS Submissions</h3>
                  <p className="text-xs text-slate-500">
                    Live 8-stage progress tracker and assigned emergency units.
                    {lastReportSync && (
                      <span className="ml-2 text-slate-400">
                        Last synced: {lastReportSync.toLocaleTimeString()}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchMyReports(false)}
                  disabled={loadingReports || isRefreshingReports}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white transition ${
                    loadingReports || isRefreshingReports
                      ? 'bg-blue-700 opacity-75 cursor-not-allowed'
                      : 'bg-blue-900 hover:bg-blue-800'
                  }`}
                >
                  {isRefreshingReports ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Syncing...
                    </span>
                  ) : '↻ Refresh'}
                </button>
              </div>

              {/* Live sync indicator */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Auto-refreshing every 6s — status updates from Government portal appear instantly
              </div>

              {!token ? (
                <div className="rounded-xl border border-slate-300 bg-white p-8 text-center space-y-3">
                  <div className="text-3xl">🔐</div>
                  <h4 className="text-sm font-bold text-slate-800">OTP Verification Required</h4>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Please log in via mobile/email OTP to track your submitted emergency reports.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="rounded-xl bg-blue-900 px-5 py-2 text-xs font-bold text-white hover:bg-blue-800"
                  >
                    Login with OTP
                  </button>
                </div>
              ) : loadingReports ? (
                <div className="py-12 text-center space-y-3">
                  <svg className="h-8 w-8 animate-spin mx-auto text-blue-900" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <div className="text-xs text-slate-500">Retrieving your emergency reports...</div>
                </div>
              ) : myReports.length === 0 ? (
                <div className="rounded-xl border border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
                  No emergency reports filed from your verified account yet.
                </div>
              ) : (
                myReports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm space-y-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-300">
                          {report.tracking_code || `EMG-${report.id}`}
                        </span>
                        <span className="text-sm font-bold capitalize text-slate-900">
                          {report.type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className={`rounded-full px-3 py-0.5 text-xs border ${STATUS_COLOR[report.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {STATUS_LABEL[report.status] || report.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed">{report.description}</p>

                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs text-slate-700 space-y-1">
                      <div>
                        <span className="text-slate-500">Assigned Response Fleet:</span>{' '}
                        <strong className="text-blue-900">
                          {report.assigned_team ? `🛡️ ${report.assigned_team}` : 'Auto-Dispatching Police & Ambulance...'}
                        </strong>
                      </div>
                      {report.resolution_notes && (
                        <div className="text-emerald-800 font-semibold pt-1 border-t border-slate-200">
                          ✓ Resolution: {report.resolution_notes}
                        </div>
                      )}
                    </div>

                    {/* Action CTAs */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setTrackingIncidentId(report.id)
                          setTrackingCode(report.tracking_code || `EMG-${report.id}`)
                        }}
                        className="rounded-xl bg-blue-900 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-900/30 hover:bg-blue-800 transition flex items-center gap-1.5"
                      >
                        <span>🚑</span> Track Live Rescue Fleet & ETA
                      </button>

                      {report.status === 'resolved' && (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewIncidentId(report.id)
                            setReviewTrackingCode(report.tracking_code || `EMG-${report.id}`)
                          }}
                          className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-700/30 hover:bg-emerald-600 transition flex items-center gap-1.5"
                        >
                          <span>⭐</span> Submit Post-Rescue Feedback
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: SAFETY AROUND ME */}
          {activeTab === 'safety' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Safety Around Me (निकटवर्ती आपदा चेतावनी)</h3>
                  <p className="text-xs text-slate-500">Verified emergency threat zones within your selected radius.</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 5, 10, 25].map((km) => (
                    <button
                      key={km}
                      type="button"
                      onClick={() => setSafetyRadius(km)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                        safetyRadius === km
                          ? 'bg-emerald-800 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {km} km
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={fetchSafetyAroundMe}
                    disabled={loadingSafety}
                    className="rounded-lg bg-emerald-800 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    {loadingSafety ? '...' : '↻'}
                  </button>
                </div>
              </div>

              {loadingSafety ? (
                <div className="py-12 text-center space-y-3">
                  <svg className="h-8 w-8 animate-spin mx-auto text-emerald-700" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <div className="text-xs text-slate-500">Scanning verified threat zones in your perimeter...</div>
                </div>
              ) : nearbyIncidents.length === 0 ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center text-xs text-emerald-900">
                  ✓ No critical hazards reported within {safetyRadius} km. Area is clear.
                </div>
              ) : (
                nearbyIncidents.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-300 bg-white p-4 space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 capitalize">
                        {item.type.replace('_', ' ')} Hazard
                      </span>
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-amber-900 border border-amber-300">
                        {item.distance_km} km away
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{item.summary}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL: INSTANT AI CONFIRMATION */}
      {submittedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-300 bg-white p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
              ✓
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">Emergency SOS Transmitted!</h3>
              <p className="text-xs text-slate-600">
                Tracking Code: <strong className="font-mono text-blue-900">{submittedIncident.tracking_code}</strong>
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Assessed Severity:</span>
                <strong className="text-red-700 capitalize">{submittedIncident.severity}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Disaster Category:</span>
                <strong className="capitalize">{submittedIncident.type}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Response Priority:</span>
                <strong className="text-blue-900">{submittedIncident.priority}/100</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Auto-Dispatched Units:</span>
                <strong className="text-emerald-700">Police PCR & 108 Ambulance</strong>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const incId = submittedIncident.id
                  const tCode = submittedIncident.tracking_code
                  setSubmittedIncident(null)
                  setTrackingIncidentId(incId)
                  setTrackingCode(tCode || `EMG-${incId}`)
                }}
                className="flex-1 rounded-xl bg-blue-900 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/30 hover:bg-blue-800"
              >
                Track Live Fleet
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmittedIncident(null)
                  setActiveTab('my-reports')
                }}
                className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                View My Reports
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: LIVE RESCUE TELEMETRY */}
      {trackingIncidentId && (
        <LiveRescueTracker
          incidentId={trackingIncidentId}
          trackingCode={trackingCode}
          onClose={() => setTrackingIncidentId(null)}
          onOpenReview={() => {
            const incId = trackingIncidentId
            const tCode = trackingCode
            setTrackingIncidentId(null)
            setReviewIncidentId(incId)
            setReviewTrackingCode(tCode)
          }}
        />
      )}

      {/* 6. MODAL: CITIZEN POST-RESCUE REVIEW */}
      {reviewIncidentId && (
        <PostRescueReviewModal
          isOpen={true}
          incidentId={reviewIncidentId}
          trackingCode={reviewTrackingCode}
          token={token}
          onClose={() => setReviewIncidentId(null)}
          onReviewSubmitted={() => {
            fetchMyReports(true)
          }}
        />
      )}
    </div>
  )
}
