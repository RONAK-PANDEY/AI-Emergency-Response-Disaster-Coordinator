import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, Users, Shield, Clock, ExternalLink, ShieldCheck } from 'lucide-react';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#10b981',
  default: '#64748b',
};

const TYPE_EMOJIS = {
  fire: '🔥',
  flood: '🌊',
  accident: '🚧',
  medical: '🚑',
  security: '🛡️',
  hazmat: '☣️',
  power_outage: '⚡',
  other: '⚠️',
};

function createPinIcon(severity, type, aadhaarVerified) {
  const color = SEVERITY_COLORS[severity?.toLowerCase()] || SEVERITY_COLORS.default;
  const emoji = TYPE_EMOJIS[type?.toLowerCase()] || TYPE_EMOJIS.other;
  const isCritical = severity?.toLowerCase() === 'critical';

  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        ${isCritical ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: ${color}; opacity: 0.45; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
        <div style="
          background: ${color};
          width: 34px;
          height: 34px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid #ffffff;
          box-shadow: 0 6px 16px rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <span style="transform: rotate(45deg); font-size: 16px; user-select: none;">${emoji}</span>
          ${aadhaarVerified ? `<span style="position: absolute; top: -4px; right: -4px; transform: rotate(45deg); font-size: 10px; background: #047857; color: white; border-radius: 50%; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; border: 1px solid white;">✓</span>` : ''}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
}

export default function PunjabMap({ incidents, onSelectIncident }) {
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const filteredIncidents = incidents.filter((inc) => {
    if (filterType !== 'all' && inc.type !== filterType) return false;
    if (filterSeverity !== 'all' && inc.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="relative w-full h-[550px] rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-950">
      {/* Dynamic Map Filter Overlay */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-xl p-2.5 rounded-2xl border border-slate-700/80 shadow-2xl text-xs">
        <span className="font-extrabold text-white px-1">Punjab Intel Map:</span>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="bg-slate-950 text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
        >
          <option value="all">All Severities</option>
          <option value="critical">🔴 Critical</option>
          <option value="high">🟠 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-950 text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
        >
          <option value="all">All Hazards</option>
          <option value="fire">Fire 🔥</option>
          <option value="flood">Flood 🌊</option>
          <option value="accident">Accident 🚧</option>
          <option value="medical">Medical 🚑</option>
          <option value="other">Other ⚠️</option>
        </select>

        <span className="text-indigo-300 font-mono text-[11px] px-2 py-0.5 bg-slate-800/80 rounded-lg border border-slate-700 font-bold">
          {filteredIncidents.length} active pins
        </span>
      </div>

      {/* Map Canvas */}
      <MapContainer
        center={[31.1471, 75.3412]}
        zoom={8}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {filteredIncidents.map((incident) => (
          <Marker
            key={incident.id}
            position={[Number(incident.latitude), Number(incident.longitude)]}
            icon={createPinIcon(incident.severity, incident.type, incident.aadhaar_verified)}
          >
            <Popup>
              <div className="p-1 space-y-2.5 text-slate-100 min-w-[220px] max-w-[280px]">
                <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-2">
                  <div className="flex items-center gap-1.5 font-extrabold uppercase tracking-wide text-xs text-white">
                    <span>{TYPE_EMOJIS[incident.type] || '⚠️'}</span>
                    <span>{incident.type}</span>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      incident.severity === 'critical'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : incident.severity === 'high'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {incident.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                  {incident.description}
                </p>

                {/* Aadhaar verified ribbon */}
                <div className="flex items-center justify-between text-[10px] bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {incident.aadhaar_verified ? 'Verified Citizen' : 'Public Report'}
                  </span>
                  <span className="font-mono text-slate-400">{incident.citizen_aadhaar_masked || 'XXXX-XXXX-XXXX'}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{incident.people_affected}</strong> casualties
                  </span>
                  <span className="capitalize font-mono font-bold text-indigo-400">
                    {incident.status}
                  </span>
                </div>

                <button
                  onClick={() => onSelectIncident(incident)}
                  className="w-full flex items-center justify-center gap-1.5 mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-md transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Inspect & Dispatch
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
