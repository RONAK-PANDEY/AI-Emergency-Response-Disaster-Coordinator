import React from 'react';

const NAV_ITEMS = [
  { id: 'report', label: 'File New Report', icon: '📋' },
  { id: 'status', label: 'Track My Reports', icon: '🔍' },
  { id: 'guidelines', label: 'Reporting Guidelines', icon: '📖' },
];

export default function ReporterLayout({ children, activePage, onPageChange, reporterInfo, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6]">
      {/* Slim Utility Bar */}
      <div className="h-8 bg-[#0F172A] flex items-center justify-between px-4 text-[10px] text-[#94A3B8] shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white uppercase tracking-wider">Government of Punjab</span>
          <span className="text-[#334155]">|</span>
          <span>Department of Disaster Management &amp; Civil Defence</span>
          <span className="text-[#334155]">|</span>
          <span className="text-amber-400 font-medium">EMERGENCY HELPLINE: 1077 &nbsp;|&nbsp; POLICE: 112 &nbsp;|&nbsp; AMBULANCE: 108</span>
        </div>
        <div className="flex items-center gap-3">
          {reporterInfo ? (
            <>
              <span className="text-[#94A3B8]">Citizen: <span className="text-white">{reporterInfo.name}</span></span>
              <span className="text-[#334155]">|</span>
              <button onClick={onLogout} className="text-[#94A3B8] hover:text-white transition-colors">
                End Session
              </button>
            </>
          ) : (
            <span className="text-[#94A3B8]">Public Portal — Unauthenticated Session</span>
          )}
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-[#003366] text-white shrink-0">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-sm flex items-center justify-center text-lg font-bold">
              🏛️
            </div>
            <div>
              <div className="font-semibold text-base leading-tight">Citizen Emergency Reporting System</div>
              <div className="text-blue-200 text-xs font-normal">State Emergency Operations Center (SEOC) — Punjab</div>
            </div>
          </div>
          <div className="text-right text-xs text-blue-200">
            <div className="font-medium text-white">Authorized Public Filing Portal</div>
            <div>Disaster Management Act, 2005 — Section 33(b)</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-t border-blue-800">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activePage === item.id
                  ? 'border-amber-400 bg-white/10 text-white'
                  : 'border-transparent text-blue-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-6 px-4">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#CBD5E1] shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#94A3B8]">
          <div className="flex items-center gap-4">
            <span className="font-medium text-[#334155]">Government of Punjab — SEOC</span>
            <a href="#" className="hover:text-[#003366] hover:underline">Data Privacy Policy</a>
            <a href="#" className="hover:text-[#003366] hover:underline">WCAG AAA Accessibility</a>
            <a href="#" className="hover:text-[#003366] hover:underline">RTI Act Disclosures</a>
          </div>
          <div>System v3.0.0-PROD-PB &nbsp;|&nbsp; NIC / MeitY Compliant</div>
        </div>
      </footer>
    </div>
  );
}
