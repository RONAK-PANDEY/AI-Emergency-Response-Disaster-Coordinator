import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { RefreshCw, AlertTriangle, MapPin, Layers } from 'lucide-react';
import IncidentDossier from '../components/IncidentDossier';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

const API = 'http://127.0.0.1:8000';

const DISTRICTS = [
  { label: 'Punjab Overview', lat: 31.1471, lon: 75.3412, zoom: 8 },
  { label: 'Ludhiana', lat: 30.9010, lon: 75.8573, zoom: 12 },
  { label: 'Jalandhar', lat: 31.3260, lon: 75.5762, zoom: 12 },
  { label: 'Amritsar', lat: 31.6340, lon: 74.8723, zoom: 12 },
  { label: 'Patiala', lat: 30.3398, lon: 76.3869, zoom: 12 },
  { label: 'Bathinda', lat: 30.2110, lon: 74.9455, zoom: 12 },
];

const TYPE_COLORS = {
  fire: '#DC2626',
  flood: '#2563EB',
  medical: '#16A34A',
  accident: '#EA580C',
  other: '#475569',
};

function getTypeColor(type) {
  const t = (type || '').toLowerCase();
  return TYPE_COLORS[t] || TYPE_COLORS.other;
}

export default function MapViewPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [activeDistrict, setActiveDistrict] = useState('Punjab Overview');

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/v1/incidents`);
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.incidents || []);
      setIncidents(list);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;
    const map = L.map(mapRef.current, {
      center: [31.1471, 75.3412],
      zoom: 8,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors &bull; SEOC Punjab GIS',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;
    fetchIncidents();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [fetchIncidents]);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    incidents.forEach(inc => {
      const lat = parseFloat(inc.latitude);
      const lon = parseFloat(inc.longitude);
      if (isNaN(lat) || isNaN(lon)) return;

      const color = getTypeColor(inc.type);
      const isCritical = (inc.severity || '').toLowerCase() === 'critical';
      const radius = isCritical ? 11 : 8;

      const marker = L.circleMarker([lat, lon], {
        radius,
        fillColor: color,
        color: '#FFFFFF',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      });

      const idStr = `PB-INC-${String(inc.id || 0).padStart(4, '0')}`;
      const descSnippet = (inc.description || '').slice(0, 90);

      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;font-size:12px;min-width:200px;padding:4px 0">
          <div style="font-size:10px;color:#003366;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px">
            ${idStr} &bull; ${(inc.type || 'GENERAL').toUpperCase()}
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <span style="background:${color};color:white;font-size:9px;font-weight:700;padding:1px 6px;border-radius:2px">
              ${(inc.severity || 'HIGH').toUpperCase()}
            </span>
            <span style="font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase">
              ${(inc.status || 'NEW').toUpperCase()}
            </span>
          </div>
          <div style="font-size:11px;color:#334155;margin-bottom:8px;line-height:1.4">
            ${descSnippet}${inc.description?.length > 90 ? '...' : ''}
          </div>
          <button
            id="btn-view-${inc.id}"
            style="background:#003366;color:white;border:none;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;border-radius:2px;width:100%"
          >
            Open Incident Dossier &rarr;
          </button>
        </div>
      `, { maxWidth: 260 });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-view-${inc.id}`);
        if (btn) {
          btn.onclick = () => {
            setSelected(inc);
            map.closePopup();
          };
        }
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [incidents]);

  const flyTo = (d) => {
    setActiveDistrict(d.label);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([d.lat, d.lon], d.zoom, { duration: 1.2 });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">GIS Tactical Situation Map</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Real-time Geospatial Incident Plotting &bull; State of Punjab Operations
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchIncidents(); }}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003366] text-white text-xs font-bold rounded-sm hover:bg-[#002244] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh GIS
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-900 text-xs px-4 py-2 rounded-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* District Quick-Jump */}
      <div className="bg-white border border-[#CBD5E1] p-3 rounded-sm flex items-center gap-2 flex-wrap text-xs">
        <span className="font-bold text-[#64748B] uppercase text-[10px] tracking-wider flex items-center gap-1 mr-1">
          <MapPin className="w-3 h-3 text-[#003366]" />
          District Focus:
        </span>
        {DISTRICTS.map(d => (
          <button
            key={d.label}
            onClick={() => flyTo(d)}
            className={`px-3 py-1.5 rounded-sm font-bold border transition-colors ${
              activeDistrict === d.label
                ? 'bg-[#003366] text-white border-[#003366]'
                : 'bg-[#F8FAFC] text-[#334155] border-[#CBD5E1] hover:bg-white'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Leaflet Map Box */}
      <div className="bg-white border border-[#CBD5E1] rounded-sm overflow-hidden relative">
        <div ref={mapRef} style={{ height: '520px', width: '100%' }} />

        {/* Legend */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-white border border-[#CBD5E1] rounded-sm p-3 shadow-md text-xs">
          <div className="font-bold text-[10px] text-[#64748B] uppercase tracking-wider mb-2 flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#003366]" />
            Incident Legend
          </div>
          <div className="space-y-1.5">
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: color }} />
                <span className="font-semibold text-[#334155] uppercase text-[10px]">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-[999]">
            <div className="flex items-center gap-2 text-sm text-[#003366] font-bold">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading GIS Incidents...
            </div>
          </div>
        )}
      </div>

      {/* Slide-out Dossier Drawer */}
      {selected && (
        <IncidentDossier
          incident={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => { setSelected(null); fetchIncidents(); }}
        />
      )}
    </div>
  );
}
