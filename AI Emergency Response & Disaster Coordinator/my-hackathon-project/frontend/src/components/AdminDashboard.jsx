import React, { useState, useMemo } from 'react';
import { ShieldAlert, Users, Clock, Filter, ArrowUpDown, CheckCircle, Truck, Search, Eye, Lock, ShieldCheck, UserCheck } from 'lucide-react';

const SEVERITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1, unclassified: 0 };

const TYPE_ICONS = {
  fire: '🔥',
  flood: '🌊',
  accident: '🚧',
  medical: '🚑',
  security: '🛡️',
  hazmat: '☣️',
  power_outage: '⚡',
  other: '⚠️',
};

export default function AdminDashboard({ incidents, onSelectIncident, onUpdateStatus, currentOfficer, onOpenGovLogin }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('severity');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = incidents.filter((item) => {
      if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const descMatch = item.description?.toLowerCase().includes(term);
        const locMatch = item.location_name?.toLowerCase().includes(term);
        const typeMatch = item.type?.toLowerCase().includes(term);
        const nameMatch = item.citizen_name?.toLowerCase().includes(term);
        if (!descMatch && !locMatch && !typeMatch && !nameMatch) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'severity') {
        cmp = (SEVERITY_ORDER[a.severity] || 0) - (SEVERITY_ORDER[b.severity] || 0);
      } else if (sortKey === 'people_affected') {
        cmp = (a.people_affected || 0) - (b.people_affected || 0);
      } else if (sortKey === 'created_at') {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        cmp = String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [incidents, severityFilter, statusFilter, searchTerm, sortKey, sortDir]);

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
      {/* Government Access Status Banner */}
      {!currentOfficer ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/40 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
              <Lock className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="font-bold text-white text-sm flex items-center gap-2">
                Restricted Government Operations Mode
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Read Only View
                </span>
              </div>
              <p className="text-slate-400">
                To dispatch response units, update statuses, or inspect unmasked citizen coordinates, please verify as an authorized Government Official.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenGovLogin}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold shadow-lg transition hover:scale-105"
          >
            Authenticate Officer 🇮🇳
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/40 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/40">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-bold text-white text-sm flex items-center gap-2">
                Authorized Government Operations Active
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-extrabold">
                  {currentOfficer.badge_number}
                </span>
              </div>
              <p className="text-slate-300">
                Signed in as <strong>{currentOfficer.officer_name}</strong> ({currentOfficer.department}). All dispatch actions are cryptographically audited.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span>Operations Command Table</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
              {filteredAndSorted.length} of {incidents.length} incidents
            </span>
          </h2>
          <p className="text-xs text-slate-400">Sort, filter, and dispatch emergency response units in real-time.</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-52">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search keyword or citizen..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="dispatched">Dispatched</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 shadow-inner">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3.5 px-3.5">Type & Verification</th>
              <th className="py-3.5 px-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('severity')}>
                <div className="flex items-center gap-1">
                  Severity <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Description & Location</th>
              <th className="py-3.5 px-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('people_affected')}>
                <div className="flex items-center gap-1">
                  Casualties <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-3">Citizen Verification</th>
              <th className="py-3.5 px-3">Status</th>
              <th className="py-3.5 px-3 cursor-pointer hover:text-slate-200" onClick={() => handleSort('created_at')}>
                <div className="flex items-center gap-1">
                  Time <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">Government Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500 text-xs">
                  No incidents matching current filters.
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((inc) => (
                <tr
                  key={inc.id}
                  onClick={() => onSelectIncident(inc)}
                  className="hover:bg-slate-800/50 cursor-pointer transition"
                >
                  {/* Type */}
                  <td className="py-3.5 px-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 font-bold text-slate-200 capitalize">
                      <span className="text-base">{TYPE_ICONS[inc.type] || '⚠️'}</span>
                      <span>{inc.type}</span>
                    </span>
                  </td>

                  {/* Severity */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                        inc.severity === 'critical'
                          ? 'bg-red-950 text-red-300 border border-red-500/50 animate-pulse'
                          : inc.severity === 'high'
                          ? 'bg-orange-950 text-orange-300 border border-orange-500/50'
                          : inc.severity === 'medium'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        inc.severity === 'critical' ? 'bg-red-400' : inc.severity === 'high' ? 'bg-orange-400' : 'bg-amber-400'
                      }`} />
                      {inc.severity}
                    </span>
                  </td>

                  {/* Description & Location */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-slate-200 truncate">{inc.description}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>📍 {inc.location_name || `${inc.latitude.toFixed(2)}, ${inc.longitude.toFixed(2)}`}</span>
                    </div>
                  </td>

                  {/* People Affected */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-mono">
                    <span className="flex items-center gap-1 font-bold text-slate-200">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {inc.people_affected}
                    </span>
                  </td>

                  {/* Citizen Verification */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="space-y-0.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                        {inc.verification_badge || 'Citizen Verified 🛡️'}
                      </span>
                      <div className="text-[10px] font-mono text-slate-400">
                        {inc.citizen_aadhaar_masked || 'XXXX-XXXX-XXXX'}
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg ${
                        inc.status === 'resolved'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : inc.status === 'dispatched'
                          ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                          : inc.status === 'investigating'
                          ? 'bg-violet-950 text-violet-300 border border-violet-500/40'
                          : 'bg-red-950 text-red-300 border border-red-500/40'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </td>

                  {/* Time */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                    {formatTime(inc.created_at)}
                  </td>

                  {/* Quick Action Buttons */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {currentOfficer ? (
                        <>
                          {inc.status !== 'dispatched' && inc.status !== 'resolved' && (
                            <button
                              onClick={() => onUpdateStatus(inc.id, 'dispatched')}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold shadow transition flex items-center gap-1"
                            >
                              <Truck className="w-3 h-3" />
                              Dispatch
                            </button>
                          )}
                          {inc.status !== 'resolved' && (
                            <button
                              onClick={() => onUpdateStatus(inc.id, 'resolved')}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shadow transition flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Resolve
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={onOpenGovLogin}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-900/80 text-indigo-300 rounded-lg text-[10px] font-bold border border-slate-700 flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" />
                          Login to Act
                        </button>
                      )}
                      <button
                        onClick={() => onSelectIncident(inc)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                        title="View Full Incident File"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
