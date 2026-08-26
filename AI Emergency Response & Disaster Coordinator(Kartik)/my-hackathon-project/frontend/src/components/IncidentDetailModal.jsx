import React, { useState } from 'react';
import { X, AlertTriangle, Users, MapPin, Clock, Sparkles, CheckCircle2, Truck, ShieldAlert, ShieldCheck, UserCheck, Lock, Building2 } from 'lucide-react';

export default function IncidentDetailModal({ incident, isOpen, onClose, onUpdateStatus, currentOfficer, onOpenGovLogin }) {
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !incident) return null;

  const handleAction = async (newStatus) => {
    setUpdating(true);
    await onUpdateStatus(incident.id, newStatus);
    setUpdating(false);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="bg-slate-900 border-2 border-slate-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden text-slate-100 space-y-0 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-red-950/70 border border-red-500/40 text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black capitalize text-white">{incident.type} Emergency File</h3>
                <span className="text-xs font-mono text-slate-400">#{incident.id}</span>
              </div>
              <p className="text-xs text-slate-400">Verified Incident Telemetry & Response Hub</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Status & Severity Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Severity:</span>
              <span
                className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                  incident.severity === 'critical'
                    ? 'bg-red-950 text-red-300 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                    : incident.severity === 'high'
                    ? 'bg-orange-950 text-orange-300 border border-orange-500/50'
                    : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                }`}
              >
                {incident.severity}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Status:</span>
              <span
                className={`text-xs font-black uppercase px-3 py-1 rounded-lg ${
                  incident.status === 'resolved'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : incident.status === 'dispatched'
                    ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                    : 'bg-red-950 text-red-300 border border-red-500/40'
                }`}
              >
                {incident.status}
              </span>
            </div>
          </div>

          {/* Citizen Aadhaar Authentication Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/50 via-slate-900 to-indigo-950/50 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-indigo-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Citizen Verification Record (UIDAI)
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                {incident.verification_badge || 'Citizen Verified 🛡️'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block">Reported By:</span>
                <span className="font-bold text-slate-100">{incident.citizen_name || 'Verified Citizen'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Aadhaar (Masked):</span>
                <span className="font-mono font-bold text-indigo-300">{incident.citizen_aadhaar_masked || 'XXXX-XXXX-XXXX'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Phone Contact:</span>
                <span className="font-mono text-slate-300">
                  {currentOfficer ? (incident.citizen_phone || '+91 98140 XXXXX') : 'Protected (Govt View Only)'}
                </span>
              </div>
            </div>
          </div>

          {/* Emergency Description */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Emergency Details:</span>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-sm text-slate-200 leading-relaxed">
              {incident.description}
            </div>
          </div>

          {/* Metric Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Casualties / People */}
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                <Users className="w-4 h-4 text-slate-400" /> People Affected
              </div>
              <div className="text-2xl font-black font-mono text-white">{incident.people_affected || 0}</div>
            </div>

            {/* GPS Coordinates */}
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                <MapPin className="w-4 h-4 text-indigo-400" /> Coordinates
              </div>
              <div className="text-xs font-mono text-slate-200 pt-1">
                {incident.latitude?.toFixed(4)}, {incident.longitude?.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Required Dispatch Teams */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Designated Emergency Units:</span>
            <div className="flex flex-wrap gap-2">
              {incident.required_teams?.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-xl bg-slate-800 text-indigo-300 border border-slate-700 text-xs font-bold uppercase tracking-wide"
                >
                  🚒 {t.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Audit Log Stamp */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Audit Trail: <strong className="text-slate-200">{incident.audit_updated_by || 'System Initial Triage'}</strong></span>
            <span className="font-mono text-[10px]">
              {incident.audit_updated_at ? new Date(incident.audit_updated_at).toLocaleTimeString() : 'Logged'}
            </span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-t border-slate-800 bg-slate-950/90">
          <div>
            {!currentOfficer ? (
              <button
                onClick={() => { onClose(); onOpenGovLogin(); }}
                className="flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-amber-200 underline"
              >
                <Lock className="w-3.5 h-3.5" /> Login as Official to modify file
              </button>
            ) : (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> Authorized: {currentOfficer.badge_number}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentOfficer && (
              <>
                {incident.status !== 'investigating' && (
                  <button
                    onClick={() => handleAction('investigating')}
                    disabled={updating}
                    className="px-3.5 py-2 rounded-xl bg-violet-800 hover:bg-violet-700 text-white text-xs font-bold transition shadow"
                  >
                    Investigating
                  </button>
                )}

                {incident.status !== 'dispatched' && (
                  <button
                    onClick={() => handleAction('dispatched')}
                    disabled={updating}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-lg transition"
                  >
                    <Truck className="w-4 h-4" />
                    Dispatch Units
                  </button>
                )}

                {incident.status !== 'resolved' && (
                  <button
                    onClick={() => handleAction('resolved')}
                    disabled={updating}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Resolve Case
                  </button>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
