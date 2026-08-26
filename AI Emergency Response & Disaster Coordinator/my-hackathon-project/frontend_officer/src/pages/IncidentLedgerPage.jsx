import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import IncidentDossier, { SeverityBadge, StatusBadge, TypeBadge } from '../components/IncidentDossier';

const API = 'http://127.0.0.1:8000';
const PAGE_SIZE = 15;

function exportCsv(incidents) {
  const headers = ['Docket_ID', 'Type', 'Severity', 'Status', 'People_Affected', 'Required_Team', 'Latitude', 'Longitude', 'Reporter_Name', 'Verified', 'Description', 'Created_At'];
  const rows = incidents.map(inc => {
    const idStr = `PB-INC-${String(inc.id || 0).padStart(4, '0')}`;
    const vals = [
      idStr,
      inc.type || 'General',
      inc.severity || 'Unclassified',
      inc.status || 'New',
      inc.people_affected || 0,
      inc.required_team || 'Police',
      inc.latitude || '',
      inc.longitude || '',
      inc.reporter_name || (inc.is_anonymous ? 'Anonymous' : 'Unverified'),
      inc.is_verified ? 'YES' : 'NO',
      `"${String(inc.description || '').replace(/"/g, '""')}"`,
      inc.created_at || ''
    ];
    return vals.join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `seoc_incident_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function IncidentLedgerPage() {
  const [allIncidents, setAllIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/incidents`);
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.incidents || []);
      setAllIncidents(list);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Filtering
  const filtered = allIncidents.filter(inc => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (inc.description || '').toLowerCase().includes(q) ||
      (inc.type || '').toLowerCase().includes(q) ||
      (inc.required_team || '').toLowerCase().includes(q) ||
      (inc.reporter_name || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || (inc.status || '').toLowerCase() === statusFilter.toLowerCase();
    const matchSeverity = !severityFilter || (inc.severity || '').toLowerCase() === severityFilter.toLowerCase();
    const matchType = !typeFilter || (inc.type || '').toLowerCase() === typeFilter.toLowerCase();
    return matchSearch && matchStatus && matchSeverity && matchType;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Incident Ledger</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Complete Incident Registry &bull; Search, Filter, Dispatch &amp; Export
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCsv(filtered)}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#003366] border border-[#003366] text-xs font-bold rounded-sm hover:bg-[#F0F7FF] transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV ({filtered.length})
          </button>
          <button
            onClick={fetchIncidents}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003366] text-white text-xs font-bold rounded-sm hover:bg-[#002244] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-900 text-xs px-4 py-3 rounded-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchIncidents} className="font-bold underline">Retry</button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white border border-[#CBD5E1] rounded-sm p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#CBD5E1] rounded-sm focus:outline-none focus:border-[#003366] text-[#0F172A]"
            placeholder="Search by keywords, incident type, response squad, citizen name..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1 text-[#64748B] font-bold">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </div>
          <select
            className="px-2.5 py-1.5 border border-[#CBD5E1] rounded-sm bg-white text-[#0F172A] focus:outline-none"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="reported">Reported</option>
            <option value="dispatched">Dispatched</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            className="px-2.5 py-1.5 border border-[#CBD5E1] rounded-sm bg-white text-[#0F172A] focus:outline-none"
            value={severityFilter}
            onChange={e => { setSeverityFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            className="px-2.5 py-1.5 border border-[#CBD5E1] rounded-sm bg-white text-[#0F172A] focus:outline-none"
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Types</option>
            <option value="fire">Fire</option>
            <option value="flood">Flood</option>
            <option value="medical">Medical</option>
            <option value="accident">Accident</option>
            <option value="other">Other</option>
          </select>

          {(search || statusFilter || severityFilter || typeFilter) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setSeverityFilter(''); setTypeFilter(''); setPage(1); }}
              className="text-[#B91C1C] hover:underline font-bold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white border border-[#CBD5E1] rounded-sm overflow-hidden">
        {loading && allIncidents.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#64748B]">Loading incidents...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[#64748B]">
            <p className="text-sm font-semibold text-[#0F172A]">No Matching Records</p>
            <p className="text-xs mt-1">Try relaxing search parameters or resetting filters.</p>
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
                {pageItems.map((inc) => {
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
                          className="px-2.5 py-1 bg-[#003366] text-white text-[10px] font-bold rounded-sm hover:bg-[#002244] transition-colors"
                        >
                          View
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

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-[#64748B]">
          <span>
            Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} total dockets
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-[#CBD5E1] bg-white rounded-sm disabled:opacity-40 hover:bg-[#F1F5F9]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-semibold">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-[#CBD5E1] bg-white rounded-sm disabled:opacity-40 hover:bg-[#F1F5F9]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

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
