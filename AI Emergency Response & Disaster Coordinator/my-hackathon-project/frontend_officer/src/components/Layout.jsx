import { useState } from 'react';
import {
  LayoutDashboard, List, Map, Truck, Server,
  LogOut, ChevronRight, Shield, Bell
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'incidents', label: 'Incident Ledger', icon: List },
  { id: 'map', label: 'Map View', icon: Map },
  { id: 'dispatch', label: 'Dispatch Units', icon: Truck },
  { id: 'health', label: 'System Health', icon: Server },
];

const PAGE_BREADCRUMBS = {
  dashboard: ['Home', 'Dashboard'],
  incidents: ['Home', 'Incident Ledger'],
  map: ['Home', 'Map View'],
  dispatch: ['Home', 'Dispatch Units'],
  health: ['Home', 'System Health'],
};

export default function Layout({ children, activePage, onNavigate, officerInfo, onLogout }) {
  const [loginTime] = useState(() => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));

  const breadcrumbs = PAGE_BREADCRUMBS[activePage] || ['Home'];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F3F4F6]">

      {/* ── TOP UTILITY BAR ─────────────────────────────────────────────── */}
      <header className="h-10 bg-[#003366] flex items-center justify-between px-4 shrink-0 border-b border-[#002244]">
        {/* Left */}
        <div className="flex items-center gap-3 text-white">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-bold tracking-wider uppercase text-amber-200">
              Government of Punjab
            </span>
          </div>
          <div className="w-px h-4 bg-[#1a4f8a]" />
          <span className="bg-amber-400 text-[#003366] text-[10px] font-black px-2 py-0.5 rounded-sm tracking-widest uppercase">
            SEOC
          </span>
          <div className="w-px h-4 bg-[#1a4f8a]" />
          <span className="text-xs font-semibold text-white/90 tracking-wide">
            State Emergency Operations Center — Command Console
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 text-white">
          <Bell className="w-3.5 h-3.5 text-white/50" />
          <div className="flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-white/80 font-medium">
              {officerInfo?.officer_id || 'OFFICER'}
            </span>
            <span className="text-white/50">|</span>
            <span className="text-white/60">Logged in {loginTime}</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-2 py-1 rounded-sm transition-colors duration-150"
          >
            <LogOut className="w-3 h-3" />
            Logout
          </button>
        </div>
      </header>

      {/* ── BODY: SIDEBAR + CONTENT ──────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR */}
        <aside className="w-60 bg-[#F3F4F6] border-r border-[#CBD5E1] flex flex-col shrink-0 overflow-y-auto">
          {/* Logo Block */}
          <div className="px-4 py-4 border-b border-[#CBD5E1] bg-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#003366] flex items-center justify-center rounded-sm">
                <Shield className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="text-xs font-black text-[#003366] tracking-wider uppercase leading-none">
                  SEOC Portal
                </div>
                <div className="text-[10px] text-[#94A3B8] font-medium mt-0.5">
                  Officer Command System
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-3">
            <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest px-2 mb-2">
              Navigation
            </div>
            <ul className="space-y-0.5">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                const isActive = activePage === id;
                return (
                  <li key={id}>
                    <button
                      onClick={() => onNavigate && onNavigate(id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors duration-150 text-left ${
                        isActive
                          ? 'bg-[#003366] text-white'
                          : 'text-[#334155] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-[#94A3B8]'}`} />
                      <span>{label}</span>
                      {isActive && <ChevronRight className="w-3 h-3 ml-auto text-amber-300" />}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* System Section */}
            <div className="mt-6">
              <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest px-2 mb-2">
                System
              </div>
              <div className="px-3 py-2 bg-white border border-[#CBD5E1] rounded-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[10px] font-semibold text-green-700 uppercase tracking-wider">
                    All Systems Operational
                  </span>
                </div>
                <div className="text-[10px] text-[#94A3B8]">
                  API: http://127.0.0.1:8000
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-0.5">
                  {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
          </nav>

          {/* Officer Info */}
          <div className="px-3 py-3 border-t border-[#CBD5E1] bg-white">
            <div className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider mb-1">
              Authenticated Officer
            </div>
            <div className="text-xs font-semibold text-[#0F172A]">
              {officerInfo?.officer_id || 'Unknown Officer'}
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-0.5">
              {officerInfo?.role || 'Field Officer'} &mdash; SEOC Punjab
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Breadcrumb */}
          <div className="px-6 py-2.5 border-b border-[#F3F4F6] bg-[#F9FAFB] flex items-center gap-1.5 shrink-0">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight className="w-3 h-3 text-[#94A3B8]" />}
                <span className={`text-xs ${idx === breadcrumbs.length - 1 ? 'text-[#003366] font-semibold' : 'text-[#94A3B8]'}`}>
                  {crumb}
                </span>
              </span>
            ))}
          </div>

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </main>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="h-8 bg-[#F3F4F6] border-t border-[#CBD5E1] flex items-center justify-center shrink-0">
        <div className="flex items-center gap-4 text-[10px] text-[#94A3B8] font-medium">
          <span>Data Privacy Policy</span>
          <span className="text-[#CBD5E1]">|</span>
          <span>WCAG AAA Compliant</span>
          <span className="text-[#CBD5E1]">|</span>
          <span>System v3.0</span>
          <span className="text-[#CBD5E1]">|</span>
          <span>Last Updated 2026-08-25</span>
          <span className="text-[#CBD5E1]">|</span>
          <span>&copy; 2026 Government of Punjab — SEOC</span>
        </div>
      </footer>
    </div>
  );
}
