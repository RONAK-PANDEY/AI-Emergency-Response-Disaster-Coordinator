import React, { useState } from 'react';
import { Shield, AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react';

const API = 'http://127.0.0.1:8000';

const DEMO_CREDENTIALS = [
  { label: 'OFFICER1 / 1234', officer_id: 'OFFICER1', pin: '1234' },
  { label: 'OFFICER2 / 5678', officer_id: 'OFFICER2', pin: '5678' },
  { label: 'ADMIN / 0000', officer_id: 'ADMIN', pin: '0000' },
];

export default function LoginPage({ onLoginSuccess }) {
  const [officerId, setOfficerId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function fillDemo(cred) {
    setOfficerId(cred.officer_id);
    setPin(cred.pin);
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!officerId.trim() || !pin.trim()) {
      setError('Officer ID and Security PIN are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/v1/auth/officer-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officer_id: officerId.trim(), pin: pin.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || data?.message || `Authentication failed (${res.status})`);
      }
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || 'Authentication service unavailable. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* LEFT: GOVERNMENT BRANDING PANEL */}
      <div className="w-1/2 bg-[#003366] flex flex-col items-center justify-center px-12 relative overflow-hidden">
        <div className="relative z-10 text-center max-w-sm">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 border-2 border-amber-400/60 flex items-center justify-center">
              <div className="w-14 h-14 border border-amber-400/40 flex items-center justify-center">
                <Shield className="w-8 h-8 text-amber-300" />
              </div>
            </div>
          </div>

          <div className="text-amber-300 text-[10px] font-bold tracking-[0.3em] uppercase mb-3">
            Government of Punjab
          </div>
          <h1 className="text-white text-2xl font-black tracking-tight leading-tight mb-2">
            State Emergency<br />Operations Center
          </h1>
          <div className="w-16 h-0.5 bg-amber-400 mx-auto my-4" />
          <p className="text-white/70 text-xs font-medium leading-relaxed mb-6">
            SEOC Command Console &bull; Tactical Disaster Response Platform
          </p>

          <div className="border border-amber-400/30 bg-amber-400/10 px-4 py-3 rounded-sm text-left mb-6 text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
              <div>
                <div className="text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                  Restricted Official Access
                </div>
                <p className="text-white/70 text-[11px] leading-relaxed">
                  Authorized SEOC personnel only. Section 33(b) Disaster Management Act 2005.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-[10px] text-white/40 font-mono">
            <span className="border border-white/20 px-2 py-0.5 rounded-sm">CONFIDENTIAL</span>
            <span>v3.0.0-PROD</span>
          </div>
        </div>
      </div>

      {/* RIGHT: AUTHENTICATION PANEL */}
      <div className="w-1/2 bg-[#F8FAFC] flex items-center justify-center px-12">
        <div className="w-full max-w-md bg-white border border-[#CBD5E1] p-8 rounded-sm shadow-sm">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-[#003366]" />
              <span className="text-[10px] font-bold text-[#003366] uppercase tracking-widest">
                Official Gateway
              </span>
            </div>
            <h2 className="text-2xl font-black text-[#0F172A] leading-tight">
              Officer Authentication
            </h2>
            <p className="text-[#64748B] text-xs mt-1">
              Sign in with your SEOC Officer Badge ID and Security PIN.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-900 text-xs px-4 py-3 rounded-sm flex items-start gap-2 mb-5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase tracking-wider" htmlFor="officer-id">
                Officer ID
              </label>
              <input
                id="officer-id"
                type="text"
                className="w-full px-3 py-2 border border-[#CBD5E1] rounded-sm focus:outline-none focus:border-[#003366] text-[#0F172A] font-mono uppercase"
                placeholder="e.g. OFFICER1"
                value={officerId}
                onChange={e => setOfficerId(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1 uppercase tracking-wider" htmlFor="pin">
                Security PIN
              </label>
              <div className="relative">
                <input
                  id="pin"
                  type={showPin ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 border border-[#CBD5E1] rounded-sm focus:outline-none focus:border-[#003366] text-[#0F172A] font-mono"
                  placeholder="Enter PIN"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#334155]"
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs rounded-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating Officer...
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Authenticate &amp; Access Console
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-[#E2E8F0]">
            <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2 text-center">
              1-Click Demo Profiles
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.officer_id}
                  type="button"
                  onClick={() => fillDemo(cred)}
                  disabled={loading}
                  className="text-[10px] font-bold border border-[#CBD5E1] text-[#003366] bg-[#F8FAFC] px-2 py-1.5 rounded-sm hover:bg-[#003366] hover:text-white transition-colors text-center"
                >
                  {cred.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
