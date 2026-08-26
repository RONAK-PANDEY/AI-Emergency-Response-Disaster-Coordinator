import React, { useState } from 'react';
import { X, MapPin, ShieldCheck, User, Clock, AlertTriangle, CheckCircle2, Send, Trash2, Cpu, ExternalLink } from 'lucide-react';

const API = 'http://127.0.0.1:8000';

export function SeverityBadge({ severity }) {
  const s = (severity || '').toLowerCase();
  const classes = {
    critical: 'bg-red-100 text-red-800 border-red-300 font-bold',
    high: 'bg-orange-100 text-orange-800 border-orange-300 font-semibold',
    medium: 'bg-amber-100 text-amber-800 border-amber-300',
    low: 'bg-green-100 text-green-800 border-green-300',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] rounded-sm border uppercase tracking-wider ${classes[s] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
      {severity || 'Unclassified'}
    </span>
  );
}

export function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  const classes = {
    new: 'bg-blue-100 text-blue-800 border-blue-300 font-bold',
    reported: 'bg-purple-100 text-purple-800 border-purple-300 font-semibold',
    dispatched: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
    resolved: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] rounded-sm border uppercase tracking-wider ${classes[s] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
      {status || 'Unknown'}
    </span>
  );
}

export function TypeBadge({ type }) {
  const t = (type || '').toLowerCase();
  const colors = {
    fire: 'bg-red-700 text-white',
    flood: 'bg-blue-700 text-white',
    medical: 'bg-emerald-700 text-white',
    accident: 'bg-amber-700 text-white',
    other: 'bg-slate-700 text-white',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-sm ${colors[t] || 'bg-slate-700 text-white'}`}>
      {type || 'General'}
    </span>
  );
}

export default function IncidentDossier({ incident, onClose, onUpdate }) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  if (!incident) return null;

  const idStr = `PB-INC-${String(incident.id || 0).padStart(4, '0')}`;
  const lat = parseFloat(incident.latitude || 0).toFixed(4);
  const lon = parseFloat(incident.longitude || 0).toFixed(4);
  const confidence = Math.round((incident.confidence || 0.94) * 100);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/v1/incidents/${incident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`Status update failed (${res.status})`);
      onUpdate && onUpdate();
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently expunge docket ${idStr}?`)) return;
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/v1/incidents/${incident.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      onUpdate && onUpdate();
      onClose && onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/40 backdrop-blur-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white h-full border-l border-[#CBD5E1] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#003366] text-white p-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-amber-400 text-[#003366] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                Official Dossier
              </span>
              <span className="font-mono font-bold text-sm tracking-wider">{idStr}</span>
            </div>
            <p className="text-[11px] text-white/70 mt-0.5">Disaster Management Record &bull; State of Punjab</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-sm hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-900 p-3 rounded-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Classification Header */}
          <div className="bg-[#F8FAFC] border border-[#CBD5E1] p-3 rounded-sm">
            <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
              Incident Classification
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-[#94A3B8] block">Emergency Type</span>
                <span className="font-bold text-sm text-[#0F172A] uppercase">{incident.type || 'General'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] block">Severity Class</span>
                <div className="mt-0.5"><SeverityBadge severity={incident.severity} /></div>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] block">Operational Status</span>
                <div className="mt-0.5"><StatusBadge status={incident.status} /></div>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] block">Casualties / Affected</span>
                <span className="font-bold text-sm text-[#B91C1C]">{incident.people_affected || 0} Persons</span>
              </div>
            </div>
          </div>

          {/* Incident Description */}
          <div>
            <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
              Field Report Description
            </div>
            <div className="p-3 bg-white border border-[#CBD5E1] rounded-sm text-sm text-[#0F172A] leading-relaxed">
              {incident.description}
            </div>
          </div>

          {/* AI Triage & Analysis */}
          <div className="border border-[#CBD5E1] bg-[#F0FDF4] p-3 rounded-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-emerald-700" />
                AI Multilingual NLP Triage Engine
              </span>
              <span className="font-mono font-bold text-emerald-800">{confidence}% Confidence</span>
            </div>
            <div className="space-y-1.5 text-[#334155]">
              <div><strong>Assigned Response Team:</strong> <span className="capitalize text-[#003366] font-semibold">{incident.required_team || 'Police, SDRF'}</span></div>
              <div><strong>Triage Directive:</strong> <span className="text-emerald-900">Priority Level {(incident.severity || 'HIGH').toUpperCase()} &mdash; Rapid Deployment Mandate</span></div>
            </div>
          </div>

          {/* Location & GPS */}
          <div>
            <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#003366]" />
              Geospatial Coordinates
            </div>
            <div className="p-3 bg-white border border-[#CBD5E1] rounded-sm flex items-center justify-between">
              <div>
                <div className="font-mono font-bold text-xs text-[#0F172A]">{lat}&deg; N, {lon}&deg; E</div>
                <div className="text-[10px] text-[#64748B] mt-0.5">Punjab State Jurisdiction &bull; Leaflet GIS Pin</div>
              </div>
              <a
                href={`https://www.google.com/maps?q=${lat},${lon}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-[#003366] border border-[#003366] text-xs font-semibold rounded-sm hover:bg-[#F0F7FF] transition-colors"
              >
                Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Reporter Identity */}
          <div>
            <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#003366]" />
              Citizen Reporter Verification
            </div>
            <div className="p-3 bg-white border border-[#CBD5E1] rounded-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Identity Status:</span>
                {incident.is_verified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-800 border border-green-300 px-2 py-0.5 rounded-sm font-bold uppercase">
                    <ShieldCheck className="w-3 h-3 text-green-700" />
                    UIDAI Aadhaar Verified
                  </span>
                ) : incident.is_anonymous ? (
                  <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded-sm font-bold uppercase">
                    Anonymous Whistleblower
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-sm font-bold uppercase">
                    Unverified Citizen
                  </span>
                )}
              </div>
              {incident.reporter_name && (
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Citizen Name:</span>
                  <span className="font-semibold text-[#0F172A]">{incident.reporter_name}</span>
                </div>
              )}
              {incident.reporter_phone && (
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Contact Phone:</span>
                  <span className="font-mono text-[#0F172A]">{incident.reporter_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="text-[11px] text-[#64748B] space-y-1 pt-2 border-t border-[#CBD5E1]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Logged Timestamp:</span>
              <span className="font-mono">{incident.created_at ? new Date(incident.created_at).toLocaleString('en-IN') : '—'}</span>
            </div>
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 bg-[#F8FAFC] border-t border-[#CBD5E1] space-y-2 shrink-0">
          <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
            Officer Tactical Dispatch Controls
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleStatusChange('dispatched')}
              disabled={updating || (incident.status || '').toLowerCase() === 'dispatched'}
              className="inline-flex items-center justify-center gap-1.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-sm transition-colors disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              Dispatch Squads
            </button>
            <button
              onClick={() => handleStatusChange('resolved')}
              disabled={updating || (incident.status || '').toLowerCase() === 'resolved'}
              className="inline-flex items-center justify-center gap-1.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-sm transition-colors disabled:opacity-40"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark Resolved
            </button>
          </div>
          <button
            onClick={handleDelete}
            disabled={updating}
            className="w-full py-1.5 bg-white hover:bg-red-50 text-red-700 border border-red-300 text-xs font-bold rounded-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Expunge Incident Record
          </button>
        </div>
      </div>
    </div>
  );
}
