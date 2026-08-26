import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertTriangle, Activity, ShieldAlert, CheckCircle2, Clock, Send, Database } from 'lucide-react';
import IncidentDossier, { SeverityBadge, StatusBadge, TypeBadge } from '../components/IncidentDossier';

const API = 'http://127.0.0.1:8000';
const REFRESH_INTERVAL = 20000;

function KpiCard({ label, value, color, sub, icon: Icon }) {
  return (
    <div className="bg-white border border-[#CBD5E1] p-4 rounded-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-[#94A3B8]" />}
      </div>
      <div className="text-3xl font-black tracking-tight" style={{ color }}>{value ?? 0}</div>
      {sub && <div className="text-[11px] text-[#94A3B8] mt-1">{sub}</div>}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: color }} />
    </div>
  );
}

export default function DashboardPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/v1/incidents`);
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.incidents || []);
      setIncidents(list);
      setLastRefresh(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const timer = setInterval(fetchIncidents, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchIncidents]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch(`${API}/api/v1/seed`, { method: 'POST' });
      if (!res.ok) throw new Error('Seeding failed');
      await fetchIncidents();
    } catch (e) {
      setError(e.message);
    } finally {
      setSeeding(false);
    }
  };

  // KPI computations
  const total = incidents.length;
  const critical = incidents.filter(i => (i.severity || '').toLowerCase() === 'critical').length;
  const dispatched = incidents.filter(i => (i.status || '').toLowerCase() === 'dispatched').length;
  const resolved = incidents.filter(i => (i.status || '').toLowerCase() === 'resolved').length;
  const pending = incidents.filter(i => ['new', 'reported'].includes((i.status || '').toLowerCase())).length;

  const recent = [...incidents].slice(0, 12);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight flex items-center gap-2">
            Operations Dashboard
            <span className="text-xs bg-[#003366] text-white px-2 py-0.5 rounded-sm font-semibold uppercase tracking-wider">
              SEOC Punjab
            </span>
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Real-time Tactical Incident Monitoring &bull; Section 33(b) Disaster Management Act 2005
            {lastRefresh && (
              <span className="ml-2 font-mono text-[#003366]">
                &bull; Updated: {lastRefresh.toLocaleTimeString('en-IN')} IST
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#003366] border border-[#003366] text-xs font-bold rounded-sm hover:bg-[#F0F7FF] transition-colors disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5" />
            {seeding ? 'Seeding...' : 'Seed Punjab Scenarios'}
          </button>
          <button
            onClick={() => { setLoading(true); fetchIncidents(); }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003366] text-white text-xs font-bold rounded-sm hover:bg-[#002244] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-900 text-xs px-4 py-3 rounded-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span><strong>Connection Error:</strong> {error}. Ensure backend is running on port 8000.</span>
          </div>
          <button onClick={fetchIncidents} className="text-xs font-bold underline hover:text-red-700">Retry Now</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Total Logged" value={total} color="#003366" sub="Active Registry" icon={Activity} />
        <KpiCard label="Critical Severity" value={critical} color="#B91C1C" sub="Immediate Hazard" icon={ShieldAlert} />
        <KpiCard label="Dispatched Units" value={dispatched} color="#D97706" sub="Response En-Route" icon={Send} />
        <KpiCard label="Pending Triage" value={pending} color="#6B21A8" sub="Awaiting Action" icon={Clock} />
        <KpiCard label="Resolved Dockets" value={resolved} color="#15803D" sub="Closed Successfully" icon={CheckCircle2} />
      </div>

      {/* Recent Incidents Table */}
      <div className="bg-white border border-[#CBD5E1] rounded-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Recent Incident Dossiers
            </span>
            <span className="text-[11px] text-[#64748B]">({recent.length} displayed)</span>
          </div>
          <span className="text-[11px] text-[#64748B]">Click any row to open full tactical dossier</span>
        </div>

        {loading && incidents.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#64748B] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#003366]" />
            Loading live incidents from SEOC server...
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center text-[#64748B]">
            <Activity className="w-8 h-8 mx-auto mb-2 text-[#94A3B8]" />
            <p className="text-sm font-semibold text-[#0F172A]">No Incidents in Database</p>
            <p className="text-xs text-[#64748B] mt-1 mb-4">Click "Seed Punjab Scenarios" above to populate test emergency events.</p>
            <button onClick={handleSeed} className="px-4 py-2 bg-[#003366] text-white text-xs font-bold rounded-sm">
              Seed Demo Dataset
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] border-b border-[#CBD5E1] text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Docket #</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Required Squad</th>
                  <th className="py-2.5 px-3">Reporter</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {recent.map((inc) => {
                  const idStr = `PB-INC-${String(inc.id || 0).padStart(4, '0')}`;
                  const lat = parseFloat(inc.latitude || 0).toFixed(3);
                  const lon = parseFloat(inc.longitude || 0).toFixed(3);
                  return (
                    <tr
                      key={inc.id}
                      onClick={() => setSelected(inc)}
                      className="hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-[#003366] whitespace-nowrap">
                        {idStr}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <TypeBadge type={inc.type} />
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <SeverityBadge severity={inc.severity} />
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-[#334155]" title={inc.description}>
                        {inc.description}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#64748B] whitespace-nowrap">
                        {lat}, {lon}
                      </td>
                      <td className="py-2.5 px-3 text-[#475569] capitalize whitespace-nowrap">
                        {inc.required_team || 'Police'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {inc.is_verified ? (
                          <span className="text-[10px] bg-green-100 text-green-800 border border-green-300 px-1.5 py-0.5 rounded-sm font-bold uppercase">
                            Verified
                          </span>
                        ) : inc.is_anonymous ? (
                          <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-300 px-1.5 py-0.5 rounded-sm font-semibold uppercase">
                            Anonymous
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-sm font-semibold uppercase">
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <StatusBadge status={inc.status} />
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelected(inc); }}
                          className="px-2 py-1 bg-[#003366] text-white text-[10px] font-bold rounded-sm hover:bg-[#002244] transition-colors"
                        >
                          View Dossier
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
