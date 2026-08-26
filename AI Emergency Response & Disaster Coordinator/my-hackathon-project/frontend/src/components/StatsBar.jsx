import React, { useMemo } from 'react';
import { Activity, ShieldAlert, Flame, AlertTriangle, CheckCircle, Database, RefreshCw, ShieldCheck, Lock, UserCheck } from 'lucide-react';

export default function StatsBar({ incidents, onSeed, onRefresh, seeding, refreshing, aiStatus, currentOfficer, onOpenGovLogin, onGovLogout }) {
  const counts = useMemo(() => {
    const total = incidents.length;
    const critical = incidents.filter((i) => i.severity === 'critical' && i.status !== 'resolved').length;
    const high = incidents.filter((i) => i.severity === 'high' && i.status !== 'resolved').length;
    const mediumLow = incidents.filter((i) => (i.severity === 'medium' || i.severity === 'low') && i.status !== 'resolved').length;
    const resolved = incidents.filter((i) => i.status === 'resolved').length;
    const aadhaarVerifiedCount = incidents.filter((i) => i.aadhaar_verified).length;

    return { total, critical, high, mediumLow, resolved, aadhaarVerifiedCount };
  }, [incidents]);

  return (
    <div className="space-y-3.5">
      {/* Top Multi-Zone Security & AI Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">Operational Triage:</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-sm">
                {aiStatus || 'AI Triage Online'}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40 shadow-sm flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                UIDAI Aadhaar Verified
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live Punjab Disaster Command Center • Multi-Layer Anti-Tamper & Security Engine
            </p>
          </div>
        </div>

        {/* Government Officer Authentication Card */}
        <div className="flex items-center gap-2">
          {currentOfficer ? (
            <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-950 to-blue-950 border border-indigo-500/50 px-3 py-1.5 rounded-xl shadow-md">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <div className="text-right">
                <div className="text-[11px] font-extrabold text-white leading-none">{currentOfficer.officer_name}</div>
                <div className="text-[10px] text-amber-300 font-mono font-semibold leading-tight">{currentOfficer.badge_number}</div>
              </div>
              <button
                onClick={onGovLogout}
                className="ml-2 text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-800 hover:bg-red-900/80 text-slate-300 hover:text-white transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenGovLogin}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-950 transition hover:scale-105"
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              Govt Official Login 🇮🇳
            </button>
          )}

          {incidents.length === 0 && (
            <button
              onClick={onSeed}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold transition border border-slate-700 shadow"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              {seeding ? 'Seeding...' : 'Load Punjab Scenarios'}
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold transition border border-slate-700 shadow"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* High-Contrast Dynamic KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Reports</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">{counts.total}</div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            {counts.aadhaarVerifiedCount} Aadhaar Verified
          </div>
        </div>

        {/* Critical */}
        <div className={`bg-gradient-to-br from-red-950/70 via-slate-900 to-red-950/40 border border-red-500/40 rounded-2xl p-4 shadow-lg hover:border-red-500/60 transition ${
          counts.critical > 0 ? 'ring-2 ring-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.25)]' : ''
        }`}>
          <div className="flex items-center justify-between text-red-300 mb-1">
            <span className="text-xs font-black uppercase tracking-wider">Critical</span>
            <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
          </div>
          <div className="text-3xl font-black font-mono text-red-400">{counts.critical}</div>
          <div className="text-[10px] text-red-300/80 mt-1 font-semibold">Immediate Danger</div>
        </div>

        {/* High */}
        <div className="bg-gradient-to-br from-orange-950/60 via-slate-900 to-orange-950/30 border border-orange-500/40 rounded-2xl p-4 shadow-lg hover:border-orange-500/60 transition">
          <div className="flex items-center justify-between text-orange-300 mb-1">
            <span className="text-xs font-black uppercase tracking-wider">High Alert</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-3xl font-black font-mono text-orange-400">{counts.high}</div>
          <div className="text-[10px] text-orange-300/80 mt-1 font-semibold">Urgent Dispatch</div>
        </div>

        {/* Medium/Low */}
        <div className="bg-gradient-to-br from-amber-950/50 via-slate-900 to-amber-950/30 border border-amber-500/40 rounded-2xl p-4 shadow-lg hover:border-amber-500/60 transition">
          <div className="flex items-center justify-between text-amber-300 mb-1">
            <span className="text-xs font-black uppercase tracking-wider">Med / Low</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-300">{counts.mediumLow}</div>
          <div className="text-[10px] text-amber-300/80 mt-1 font-semibold">Active Monitoring</div>
        </div>

        {/* Resolved */}
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-emerald-950/30 border border-emerald-500/40 rounded-2xl p-4 shadow-lg hover:border-emerald-500/60 transition">
          <div className="flex items-center justify-between text-emerald-300 mb-1">
            <span className="text-xs font-black uppercase tracking-wider">Resolved</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">{counts.resolved}</div>
          <div className="text-[10px] text-emerald-300/80 mt-1 font-semibold">Threat Neutralized</div>
        </div>
      </div>
    </div>
  );
}
