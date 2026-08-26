import 'leaflet/dist/leaflet.css'
import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet'
import L from 'leaflet'

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
  severity: string
  latitude: number
  longitude: number
  description: string
  summary?: string
  people_affected?: number
  priority?: number
  report_count?: number
  status?: string
  assigned_team?: string | null
  resolution_notes?: string | null
  polygon?: HazardPolygon | null
  created_at: string
}

interface EmergencyMapProps {
  onTrackIncident?: (incidentId: number, trackingCode?: string) => void
}

function createColorIcon(color: string, severity: string) {
  const isCritical = severity === 'critical'
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: ${isCritical ? '28px' : '24px'};
        height: ${isCritical ? '28px' : '24px'};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid #ffffff;
        box-shadow: 0 0 ${isCritical ? '12px rgba(220,38,38,0.9)' : '5px rgba(0,0,0,0.5)'};
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  })
}

const TYPE_ICONS: Record<string, { emoji: string; color: string }> = {
  fire: { emoji: '🔥', color: '#dc2626' },
  flood: { emoji: '🌊', color: '#0284c7' },
  accident: { emoji: '🚧', color: '#ea580c' },
  medical: { emoji: '🚑', color: '#16a34a' },
  natural_disaster: { emoji: '⛈️', color: '#7c3aed' },
  infrastructure: { emoji: '🏢', color: '#d97706' },
  public_health: { emoji: '⚕️', color: '#0891b2' },
  security: { emoji: '🛡️', color: '#4f46e5' },
  other: { emoji: '📍', color: '#475569' },
}
const DEFAULT_ICON = { emoji: '📍', color: '#475569' }

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#16a34a',
}

const DISPATCH_STATIONS = [
  { name: 'NDRF Base Command (Ludhiana)', type: 'ndrf', coords: [30.915, 75.835], status: 'Active Ready' },
  { name: 'Punjab Fire & Rescue HQ (Jalandhar)', type: 'fire', coords: [31.332, 75.580], status: 'Standby' },
  { name: 'Civil Hospital Emergency Trauma Center', type: 'medical', coords: [31.640, 74.885], status: 'Responding' },
  { name: 'SDRF Water Rescue Squad (Sutlej)', type: 'flood', coords: [31.025, 75.720], status: 'On Patrol' },
  { name: 'State Police QRT Headquarters (Mohali)', type: 'security', coords: [30.710, 76.730], status: 'Patrolling' },
]

export default function EmergencyMap({ onTrackIncident }: EmergencyMapProps) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/incidents')
        if (!response.ok) throw new Error('Failed to fetch')
        const data = await response.json()
        setIncidents(data.incidents || [])
      } catch (err) {
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchIncidents()
    const interval = setInterval(fetchIncidents, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <MapContainer
      center={[31.05, 75.8]}
      zoom={8}
      style={{ width: '100%', height: '100%', minHeight: '320px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors • Government GIS Grid'
      />

      {/* 1. Dynamic Hazard Disaster Danger Zone Polygons */}
      {incidents.map((incident) => {
        if (!incident.polygon || !incident.polygon.coordinates) return null
        return (
          <Polygon
            key={`poly-${incident.id}`}
            positions={incident.polygon.coordinates}
            pathOptions={{
              fillColor: incident.polygon.fill_color,
              fillOpacity: incident.polygon.opacity || 0.22,
              color: incident.polygon.border_color,
              weight: 2,
              dashArray: incident.severity === 'critical' ? '4, 4' : undefined,
            }}
          >
            <Popup>
              <div style={{ fontSize: '11px', color: '#0f172a', minWidth: '180px' }}>
                <strong style={{ color: incident.polygon.border_color }}>
                  {incident.polygon.zone_label}
                </strong>
                <div style={{ marginTop: '4px' }}>
                  Radius: ~{incident.polygon.radius_meters} meters
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>
                  Roads & infrastructure visible beneath overlay
                </div>
              </div>
            </Popup>
          </Polygon>
        )
      })}

      {/* 2. Response Stations & Units */}
      {DISPATCH_STATIONS.map((unit) => {
        const unitColor =
          unit.type === 'ndrf'
            ? '#2563eb'
            : unit.type === 'fire'
              ? '#ea580c'
              : unit.type === 'medical'
                ? '#16a34a'
                : unit.type === 'flood'
                  ? '#0284c7'
                  : '#4f46e5'

        return (
          <Marker
            key={unit.name}
            position={unit.coords as [number, number]}
            icon={L.divIcon({
              className: 'response-unit-marker',
              html: `<div style="
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: ${unitColor};
                border: 2px solid white;
                box-shadow: 0 0 6px rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                line-height: 1;
                color: #ffffff;
                font-weight: 800;
              ">${unit.type === 'fire' ? 'F' : unit.type === 'medical' ? 'M' : unit.type === 'ndrf' ? 'N' : 'P'}</div>`,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            })}
          >
            <Popup>
              <div style={{ minWidth: '180px', fontSize: '12px' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{unit.name}</div>
                <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'capitalize' }}>
                  {unit.type} Rapid Response Facility
                </div>
                <div style={{ marginTop: '6px', color: '#1e293b' }}>
                  Readiness: <strong style={{ color: '#0284c7' }}>{unit.status}</strong>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* 3. Incidents Point Markers */}
      {incidents.map((incident) => {
        const typeData = TYPE_ICONS[incident.type.toLowerCase()] || DEFAULT_ICON
        const icon = createColorIcon(typeData.color, incident.severity)

        return (
          <Marker
            key={incident.id}
            position={[incident.latitude, incident.longitude]}
            icon={icon}
          >
            <Popup>
              <div style={{ minWidth: '240px', maxWidth: '290px', fontSize: '12px', color: '#1e293b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <strong style={{ color: '#0f172a' }}>{typeData.emoji} {incident.type.replace('_', ' ').toUpperCase()}</strong>
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    backgroundColor: '#e2e8f0',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    color: '#0f172a'
                  }}>
                    {incident.tracking_code || `EMG-${incident.id}`}
                  </span>
                </div>

                <div style={{ marginBottom: '6px' }}>
                  <span style={{
                    display: 'inline-block',
                    backgroundColor: SEVERITY_COLORS[incident.severity] || '#64748b',
                    color: incident.severity === 'medium' ? '#000' : '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 7px',
                    borderRadius: '8px',
                  }}>
                    {incident.severity}
                  </span>
                  <span style={{ marginLeft: '6px', fontSize: '11px', color: '#64748b' }}>
                    Priority: <strong>{incident.priority || 50}/100</strong>
                  </span>
                </div>

                <div style={{ marginBottom: '8px', fontSize: '11px', color: '#334155', lineHeight: '1.4' }}>
                  {incident.summary || incident.description}
                </div>

                {incident.assigned_team && (
                  <div style={{ marginBottom: '6px', fontSize: '11px', color: '#0369a1', fontWeight: 600 }}>
                    🛡️ {incident.assigned_team}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    👥 {incident.people_affected || 0} affected
                  </span>

                  {onTrackIncident && (
                    <button
                      type="button"
                      onClick={() => onTrackIncident(incident.id, incident.tracking_code)}
                      style={{
                        backgroundColor: '#1e3a8a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      🚑 Live Telemetry
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
