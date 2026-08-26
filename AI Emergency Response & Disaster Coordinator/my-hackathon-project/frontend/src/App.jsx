import React, { useState, useEffect, useCallback } from 'react';
import { Map, AlertCircle, FileText, Activity, Radio, Shield, Sparkles, Lock, ShieldCheck, UserCheck, LogOut, CheckCircle2 } from 'lucide-react';
import StatsBar from './components/StatsBar';
import PunjabMap from './components/PunjabMap';
import ReportForm from './components/ReportForm';
import AdminDashboard from './components/AdminDashboard';
import IncidentDetailModal from './components/IncidentDetailModal';
import GovtLoginModal from './components/GovtLoginModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'board' | 'report'
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [aiEngineStatus, setAiEngineStatus] = useState('Checking AI status...');
  const [isGovLoginOpen, setIsGovLoginOpen] = useState(false);
  const [currentOfficer, setCurrentOfficer] = useState(null);

  // Check health and AI engine status
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/ping');
      if (res.ok) {
        const data = await res.json();
        setAiEngineStatus(data.ai_engine || 'AI Engine Online');
      }
    } catch {
      setAiEngineStatus('Local Server Connected');
    }
  }, []);

  // Fetch incidents
  const fetchIncidents = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch('/api/incidents');
      if (res.ok) {
        const data = await res.json();
        setIncidents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching incidents:', err);
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  // Load saved officer session if present
  useEffect(() => {
    const saved = localStorage.getItem('gov_officer_session');
    if (saved) {
      try {
        setCurrentOfficer(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Initial load + auto seeding if empty + periodic polling
  useEffect(() => {
    checkHealth();
    fetchIncidents();

    // Auto-seed if database is empty on initial startup
    fetch('/api/seed', { method: 'POST' })
      .then(() => fetchIncidents(true))
      .catch(() => {});

    const interval = setInterval(() => {
      fetchIncidents(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [checkHealth, fetchIncidents]);

  // Seed Punjab scenarios
  const handleSeed = async () => {
    setSeeding(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
      await fetchIncidents();
    } catch (err) {
      console.error('Seeding error:', err);
    } finally {
      setSeeding(false);
    }
  };

  // Update incident status (Audited with Government Officer Badge)
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const officerLabel = currentOfficer
        ? `${currentOfficer.officer_name} (${currentOfficer.badge_number})`
        : 'Authorized Govt Official';

      const res = await fetch(`/api/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          officer_name: officerLabel,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setIncidents((prev) => prev.map((item) => (item.id === id ? updated : item)));
        if (selectedIncident && selectedIncident.id === id) {
          setSelectedIncident(updated);
        }
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleGovLoginSuccess = (officer) => {
    setCurrentOfficer(officer);
    localStorage.setItem('gov_officer_session', JSON.stringify(officer));
    setActiveTab('board');
  };

  const handleGovLogout = () => {
    setCurrentOfficer(null);
    localStorage.removeItem('gov_officer_session');
  };

  // When a new report is submitted
  const handleReportSubmitted = (newIncident) => {
    setIncidents((prev) => [newIncident, ...prev]);
    setActiveTab('map');
    setSelectedIncident(newIncident);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Government Official Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Government Emblem */}
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-red-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-950 border border-amber-400/40">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  AI Emergency Response & Disaster Coordinator
                </h1>
                <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40">
                  Govt of Punjab 🇮🇳
                </span>
              </div>
              <p className="text-[11px] text-slate-400">UIDAI Aadhaar Verified Citizen Reporting & Secure Dispatch Command</p>
            </div>
          </div>

          {/* Center / Right Controls & Navigation */}
          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-inner text-xs font-bold">
              <button
                onClick={() => setActiveTab('map')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
                  activeTab === 'map'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Map className="w-4 h-4" />
                Live Map
              </button>
              <button
                onClick={() => setActiveTab('board')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
                  activeTab === 'board'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Activity className="w-4 h-4" />
                Operations Board
                {currentOfficer && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
                  activeTab === 'report'
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg shadow-red-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                Report Emergency
              </button>
            </div>

            {/* Officer Quick Login / Status Button */}
            {!currentOfficer ? (
              <button
                onClick={() => setIsGovLoginOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800 hover:from-indigo-600 hover:to-blue-600 text-white text-xs font-black shadow-lg shadow-indigo-950 transition hover:scale-105 border border-indigo-500/40"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                Official Login
              </button>
            ) : (
              <button
                onClick={handleGovLogout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500/50 text-xs font-bold transition"
                title="Logout Government Officer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Exit Officer Mode
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Stats & Security Control Bar */}
        <StatsBar
          incidents={incidents}
          onSeed={handleSeed}
          onRefresh={() => fetchIncidents(false)}
          seeding={seeding}
          refreshing={refreshing}
          aiStatus={aiEngineStatus}
          currentOfficer={currentOfficer}
          onOpenGovLogin={() => setIsGovLoginOpen(true)}
          onGovLogout={handleGovLogout}
        />

        {/* Tab 1: Live Interactive Punjab Map */}
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <PunjabMap
                incidents={incidents}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
              />
            </div>

            {/* Live Triage Stream */}
            <div className="space-y-4">
              <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-3xl p-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-3.5">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-black text-white">Live Incident Stream</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 rounded-full text-indigo-300 border border-slate-700">
                    Live Polling
                  </span>
                </div>

                <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                  {incidents.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      No active emergency reports in database.
                    </div>
                  ) : (
                    incidents.slice(0, 8).map((inc) => (
                      <div
                        key={inc.id}
                        onClick={() => setSelectedIncident(inc)}
                        className="p-3.5 bg-slate-950/80 hover:bg-slate-850 hover:border-indigo-500/50 border border-slate-800/80 rounded-2xl cursor-pointer transition space-y-2 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold text-slate-100 capitalize flex items-center gap-1.5">
                            <span>{inc.type === 'fire' ? '🔥' : inc.type === 'flood' ? '🌊' : inc.type === 'accident' ? '🚧' : '🚑'}</span>
                            <span>{inc.type}</span>
                          </span>
                          <div className="flex items-center gap-1">
                            {inc.aadhaar_verified && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                                🛡️ Verified
                              </span>
                            )}
                            <span
                              className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                inc.severity === 'critical'
                                  ? 'bg-red-950 text-red-300 border border-red-500/50'
                                  : inc.severity === 'high'
                                  ? 'bg-orange-950 text-orange-300 border border-orange-500/50'
                                  : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {inc.severity}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{inc.description}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>📍 {inc.location_name || 'Punjab Region'}</span>
                          <span className="font-mono text-indigo-400 uppercase font-extrabold">{inc.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Operations Board (RBAC Governed) */}
        {activeTab === 'board' && (
          <AdminDashboard
            incidents={incidents}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            onUpdateStatus={handleUpdateStatus}
            currentOfficer={currentOfficer}
            onOpenGovLogin={() => setIsGovLoginOpen(true)}
          />
        )}

        {/* Tab 3: Report Incident with Aadhaar Verification */}
        {activeTab === 'report' && (
          <div className="max-w-2xl mx-auto">
            <ReportForm onReportSubmitted={handleReportSubmitted} />
          </div>
        )}
      </main>

      {/* Incident Detail Drawer/Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        isOpen={Boolean(selectedIncident)}
        onClose={() => setSelectedIncident(null)}
        onUpdateStatus={handleUpdateStatus}
        currentOfficer={currentOfficer}
        onOpenGovLogin={() => setIsGovLoginOpen(true)}
      />

      {/* Government Official Login Modal */}
      <GovtLoginModal
        isOpen={isGovLoginOpen}
        onClose={() => setIsGovLoginOpen(false)}
        onLoginSuccess={handleGovLoginSuccess}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/90 py-5 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>Punjab Emergency Response & Disaster Management System • Secure Government Edition</span>
          <span className="text-slate-400">UIDAI Aadhaar Verified Protocol • Anti-Tampering Engine Active</span>
        </div>
      </footer>
    </div>
  );
}
