import React, { useState } from 'react';
import { X, Shield, Lock, CheckCircle, AlertTriangle, Key, Building2, UserCheck } from 'lucide-react';

const DEMO_OFFICERS = [
  {
    badge: 'PB-POLICE-7721',
    name: 'Inspector Harpreet Singh',
    dept: 'Punjab Police Emergency Control',
    color: 'from-blue-600 to-indigo-600',
    icon: '👮‍♂️',
  },
  {
    badge: 'PB-DISASTER-1088',
    name: 'Dr. Amandeep Kaur',
    dept: 'Punjab State Disaster Management Authority',
    color: 'from-amber-600 to-red-600',
    icon: '🛡️',
  },
  {
    badge: 'PB-FIRE-4029',
    name: 'Chief Rajesh Sharma',
    dept: 'Punjab Fire & Rescue Command',
    color: 'from-red-600 to-orange-600',
    icon: '🚒',
  },
  {
    badge: 'PB-HEALTH-5510',
    name: 'Dr. Jaswinder Verma',
    dept: 'Punjab 108 Emergency Medical Services',
    color: 'from-emerald-600 to-teal-600',
    icon: '🚑',
  },
];

export default function GovtLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [badgeNumber, setBadgeNumber] = useState('PB-POLICE-7721');
  const [accessKey, setAccessKey] = useState('PUNJAB_GOV_2026');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!badgeNumber.trim()) {
      setErrorMsg('Please provide a valid Government Officer Badge ID.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/gov-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          badge_number: badgeNumber.trim(),
          access_key: accessKey.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error('Authentication failed. Check your credentials.');
      }

      const data = await res.json();
      onLoginSuccess(data.officer);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (badge) => {
    setBadgeNumber(badge);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="bg-slate-900 border-2 border-indigo-500/50 w-full max-w-lg rounded-3xl shadow-[0_0_50px_rgba(79,70,229,0.3)] overflow-hidden text-slate-100 space-y-0 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Official Crest Header */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-b border-indigo-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-indigo-600 flex items-center justify-center shadow-lg border border-amber-400/40">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Govt of Punjab 🇮🇳
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">Official Response Gateway</h3>
              <p className="text-xs text-slate-400">Restricted Emergency Dispatch & Security Authorization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Official Demo Profiles */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" /> Quick Select Verified Officer Profile:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_OFFICERS.map((off) => (
                <button
                  key={off.badge}
                  type="button"
                  onClick={() => handleSelectDemo(off.badge)}
                  className={`text-left p-3 rounded-xl border transition flex items-start gap-2.5 ${
                    badgeNumber === off.badge
                      ? 'bg-indigo-950/80 border-indigo-400 ring-2 ring-indigo-500/50 shadow-md'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">{off.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-100 truncate">{off.name}</div>
                    <div className="text-[10px] text-indigo-300 font-mono font-semibold">{off.badge}</div>
                    <div className="text-[10px] text-slate-400 truncate">{off.dept}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                Officer Badge / Service ID
              </label>
              <input
                type="text"
                value={badgeNumber}
                onChange={(e) => setBadgeNumber(e.target.value)}
                placeholder="e.g. PB-POLICE-7721"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                Department Access Key / Token
              </label>
              <input
                type="password"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Enter authorized key"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-indigo-950 transition"
            >
              {loading ? 'Authenticating Official...' : 'Authorize Government Access 🇮🇳'}
            </button>
          </form>
        </div>

        {/* Footer Security Notice */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            🔒 Protected under Section 43/66 IT Act. Unauthorized access or data alteration is strictly monitored and logged.
          </p>
        </div>
      </div>
    </div>
  );
}
