import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon } from 'react-leaflet'
import L from 'leaflet'

interface AutoDispatchUnit {
  unit_type: string
  callsign: string
  agency: string
  assigned_vehicle: string
  base_station: string
  contact_frequency: string
  departure_time: string
  eta_minutes: number
  status: string
}

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

interface LiveTrackingData {
  incident_id: number
  tracking_code: string
  incident_type: string
  severity: string
  status: string
  current_stage: number
  stage_label: string
  stages: Array<{ step: number; title: string; desc: string; completed: boolean }>
  eta_seconds: number
  eta_formatted: string
  vehicle_speed_kmh: number
  distance_remaining_km: number
  vehicle_current_coords: [number, number]
  incident_coords: [number, number]
  route_path: [number, number][]
  dispatched_units: AutoDispatchUnit[]
  resolution_notes?: string | null
  polygon?: HazardPolygon | null
}

interface LiveRescueTrackerProps {
  incidentId: number
  trackingCode?: string
  onClose: () => void
  onOpenReview?: () => void
}

// Custom Leaflet DivIcons
const ambulanceIcon = L.divIcon({
  className: 'rescue-vehicle-marker',
  html: `
    <div style="
      background-color: #dc2626;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 0 15px rgba(220,38,38,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      animation: pulse 1.5s infinite;
    ">🚑</div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

const incidentPinIcon = L.divIcon({
  className: 'incident-destination-marker',
  html: `
    <div style="
      background-color: #1e3a8a;
      width: 30px;
      height: 30px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #ffffff;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="transform: rotate(45deg); font-size: 14px;">📍</span>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
})

export default function LiveRescueTracker({
  incidentId,
  trackingCode,
  onClose,
  onOpenReview,
}: LiveRescueTrackerProps) {
  const [data, setData] = useState<LiveTrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [animatedIndex, setAnimatedIndex] = useState(0)

  const fetchTrackingData = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/incidents/${incidentId}/live-tracking`)
      if (!res.ok) throw new Error('Unable to retrieve telemetry feed')
      const result = await res.json()
      setData(result)
    } catch (err: any) {
      setError(err.message || 'Telemetry connection failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrackingData()
    const interval = setInterval(fetchTrackingData, 4000)
    return () => clearInterval(interval)
  }, [incidentId])

  // Vehicle route movement animation
  useEffect(() => {
    if (!data?.route_path || data.route_path.length === 0) return
    const routeLen = data.route_path.length
    const timer = setInterval(() => {
      setAnimatedIndex((prev) => (prev + 1) % routeLen)
    }, 1800)
    return () => clearInterval(timer)
  }, [data])

  if (loading && !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
        <div className="rounded-2xl border border-slate-300 bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <h3 className="text-base font-bold text-slate-800">Connecting to Live Emergency Telemetry...</h3>
          <p className="text-xs text-slate-500 mt-1">Acquiring GPS transponders for Police, Ambulance & NDRF Fleet</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-red-300 bg-white p-6 shadow-2xl text-center space-y-4">
          <div className="text-3xl">⚠️</div>
          <h3 className="text-base font-bold text-slate-900">Telemetry Feed Unavailable</h3>
          <p className="text-xs text-slate-600">{error || 'Incident details not found.'}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-700"
          >
            ✕ Close Window
          </button>
        </div>
      </div>
    )
  }

  const vehicleCoords: [number, number] =
    data.route_path && data.route_path.length > 0
      ? (data.route_path[animatedIndex] as [number, number])
      : data.vehicle_current_coords

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl flex flex-col max-h-[92vh]">
        {/* National Government Operations Header */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 p-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-xl font-bold shadow-lg shadow-red-600/40">
                🚨
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    State Emergency Operations Centre (SEOC)
                  </span>
                  <span className="rounded bg-red-950 px-2 py-0.5 font-mono text-[11px] font-bold text-red-200 border border-red-700">
                    {data.tracking_code}
                  </span>
                </div>
                <h2 className="text-base font-black tracking-tight sm:text-lg">
                  Live Rescue Fleet Dispatch & Telemetry Monitor
                </h2>
              </div>
            </div>

            {/* Explicit Close Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800/90 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-sm"
              >
                ✕ Close Tracker
              </button>
            </div>
          </div>

          {/* Quick Telemetry KPI Ribbon */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 border-t border-slate-800/80 pt-3 text-xs">
            <div className="rounded-lg bg-blue-900/60 p-2 border border-blue-700/50">
              <div className="text-[10px] text-blue-200 uppercase font-semibold">Live Status</div>
              <div className="text-sm font-black text-amber-300 truncate">{data.stage_label}</div>
            </div>
            <div className="rounded-lg bg-blue-900/60 p-2 border border-blue-700/50">
              <div className="text-[10px] text-blue-200 uppercase font-semibold">Estimated Arrival (ETA)</div>
              <div className="text-sm font-black text-emerald-300">{data.eta_formatted}</div>
            </div>
            <div className="rounded-lg bg-blue-900/60 p-2 border border-blue-700/50">
              <div className="text-[10px] text-blue-200 uppercase font-semibold">Lead Vehicle Speed</div>
              <div className="text-sm font-black text-cyan-200">{data.vehicle_speed_kmh} km/h (Code 3)</div>
            </div>
            <div className="rounded-lg bg-blue-900/60 p-2 border border-blue-700/50">
              <div className="text-[10px] text-blue-200 uppercase font-semibold">Distance to Incident</div>
              <div className="text-sm font-black text-white">{data.distance_remaining_km} km</div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-slate-50">
          {/* 8-Stage Visual Progress Bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>⏱️</span> 8-Stage Emergency Response Lifecycle
              </h4>
              <span className="text-xs font-bold text-blue-700">
                Stage {data.current_stage} of 8 ({Math.round((data.current_stage / 8) * 100)}% Complete)
              </span>
            </div>

            {/* Stepper Grid */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {data.stages.map((st) => (
                <div
                  key={st.step}
                  className={`rounded-lg p-2 text-center text-xs transition border ${
                    st.completed
                      ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm'
                      : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60'
                  } ${st.step === data.current_stage ? 'ring-2 ring-blue-500 font-bold animate-pulse' : ''}`}
                >
                  <div className="font-mono text-[10px] font-bold text-blue-700">Step {st.step}</div>
                  <div className="text-[11px] font-bold mt-0.5 truncate">{st.title}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tactical Map & Fleet Split View */}
          <div className="grid gap-5 lg:grid-cols-12">
            {/* Left: GIS Route Map */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping" />
                  Live GPS Route & Hazard Danger Zone
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Target: ({data.incident_coords[0].toFixed(4)}, {data.incident_coords[1].toFixed(4)})
                </span>
              </div>

              <div className="relative h-72 sm:h-80 w-full overflow-hidden rounded-lg border border-slate-200">
                <MapContainer
                  center={data.incident_coords}
                  zoom={12}
                  style={{ width: '100%', height: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />

                  {/* Danger Zone Polygon with Translucent Overlay */}
                  {data.polygon && (
                    <Polygon
                      positions={data.polygon.coordinates}
                      pathOptions={{
                        fillColor: data.polygon.fill_color,
                        fillOpacity: data.polygon.opacity,
                        color: data.polygon.border_color,
                        weight: 2,
                        dashArray: data.polygon.severity === 'critical' ? '4, 4' : undefined,
                      }}
                    >
                      <Popup>
                        <div style={{ fontSize: '11px', color: '#0f172a' }}>
                          <strong>{data.polygon.zone_label}</strong>
                          <div>Radius: ~{data.polygon.radius_meters}m perimeter</div>
                        </div>
                      </Popup>
                    </Polygon>
                  )}

                  {/* Route Polyline */}
                  {data.route_path && data.route_path.length > 0 && (
                    <Polyline
                      positions={data.route_path}
                      pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.8, dashArray: '6, 6' }}
                    />
                  )}

                  {/* Moving Rescue Vehicle Marker */}
                  <Marker position={vehicleCoords} icon={ambulanceIcon}>
                    <Popup>
                      <div style={{ fontSize: '11px', fontWeight: 600 }}>
                        🚨 Lead Emergency Unit en route
                        <div>Speed: {data.vehicle_speed_kmh} km/h</div>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Incident Target Destination */}
                  <Marker position={data.incident_coords} icon={incidentPinIcon}>
                    <Popup>
                      <div style={{ fontSize: '11px', fontWeight: 700 }}>
                        📍 Incident Location ({data.tracking_code})
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>

              <div className="text-[11px] text-slate-500 px-1">
                ℹ️ Translucent colored polygon indicates the computed danger zone. Streets and roadways remain visible beneath for tactical navigation.
              </div>
            </div>

            {/* Right: Smart Auto-Dispatch Units Telemetry */}
            <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span>⚡</span> Smart Auto-Dispatched Fleet
                  </h4>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    3 Units Rolling
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {data.dispatched_units.map((unit, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5 transition hover:border-slate-300"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{unit.unit_type === 'police' ? '🚓' : unit.unit_type === 'ambulance' ? '🚑' : '🚒'}</span>
                          {unit.callsign}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          ETA: {unit.eta_minutes} mins
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">{unit.agency}</div>
                      <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-200/60">
                        <span>Base: {unit.base_station}</span>
                        <span className="font-semibold text-emerald-700">● {unit.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolved / Review Call-to-action */}
              {data.current_stage >= 8 && onOpenReview && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 space-y-2 text-center">
                  <div className="text-xs font-bold text-emerald-900">
                    ✓ Rescue Operation Completed Successfully
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    {data.resolution_notes || 'All affected persons evacuated safely.'}
                  </p>
                  <button
                    type="button"
                    onClick={onOpenReview}
                    className="w-full rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition"
                  >
                    ⭐ Submit Citizen Post-Rescue Review
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 bg-slate-100 p-3 px-5 flex items-center justify-between">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Encrypted Live Stream • National Disaster Operations Grid</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  )
}
