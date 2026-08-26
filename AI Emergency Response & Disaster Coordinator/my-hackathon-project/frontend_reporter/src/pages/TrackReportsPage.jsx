import React, { useState } from 'react';
import { Search, ShieldAlert, CheckCircle2, Clock, MapPin, User, AlertTriangle } from 'lucide-react';

const API = 'http://127.0.0.1:8000';

export default function TrackReportsPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Clean query: e.g. "PB-INC-0001" -> 1
    const cleanId = query.replace(/\D/g, '');
    if (!cleanId) {
      setError('Please enter a valid docket number (e.g. PB-INC-0001 or 1).');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API}/api/v1/incidents/${cleanId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error(`No incident record found with reference #${query}.`);
        throw new Error(`Lookup failed (${res.status})`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Track Incident Status</h1>
        <p className="text-xs text-[#64748B] mt-1">
          Look up the real-time operational status of any filed emergency report using your official Docket Number.
        </p>
      </div>

      <div className="card p-5">
        <form onSubmit={handleSearch} className="space-y-3">
          <label className="label">Docket Reference Number</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="input-field font-mono"
              placeholder="e.g. PB-INC-0001 or 1"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button type="submit" className="btn-primary shrink-0" disabled={loading}>
              {loading ? 'Searching...' : 'Track Docket'}
            </button>
          </div>
          <p className="text-[11px] text-[#94A3B8]">
            Your docket reference number was issued on the confirmation receipt after filing.
          </p>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-900 text-xs p-4 rounded-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="card p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#CBD5E1]">
            <div>
              <span className="font-mono font-bold text-sm text-[#003366]">PB-INC-{String(result.id).padStart(4, '0')}</span>
              <div className="text-[11px] text-[#64748B]">Emergency Type: <strong className="uppercase">{result.type}</strong></div>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-sm bg-blue-100 text-blue-800 border border-blue-300">
              {result.status}
            </span>
          </div>

          <div>
            <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Description</div>
            <p className="text-xs text-[#0F172A] leading-relaxed bg-[#F8FAFC] p-3 border border-[#CBD5E1] rounded-sm">{result.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#64748B] block">Severity Triage:</span>
              <span className="font-bold text-[#0F172A] uppercase">{result.severity}</span>
            </div>
            <div>
              <span className="text-[#64748B] block">Assigned Squads:</span>
              <span className="font-bold text-[#003366] capitalize">{result.required_team || 'Police'}</span>
            </div>
            <div>
              <span className="text-[#64748B] block">Location Coords:</span>
              <span className="font-mono">{result.latitude}, {result.longitude}</span>
            </div>
            <div>
              <span className="text-[#64748B] block">Filed Timestamp:</span>
              <span className="font-mono text-[11px]">{new Date(result.created_at).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
