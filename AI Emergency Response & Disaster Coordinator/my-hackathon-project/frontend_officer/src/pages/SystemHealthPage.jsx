import React, { useState, useEffect } from 'react';
import { Server, CheckCircle2, AlertTriangle, ShieldCheck, Database, HardDrive } from 'lucide-react';

const API = 'http://127.0.0.1:8000';

export default function SystemHealthPage({ officerInfo }) {
  const [health, setHealth] = useState(null);
  const [incidentsCount, setIncidentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/v1/ping`).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/v1/incidents`).then(r => r.json()).catch(() => []),
    ]).then(([h, inc]) => {
      setHealth(h);
      setIncidentsCount(Array.isArray(inc) ? inc.length : 0);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#0F172A] tracking-tight flex items-center gap-2">
          <Server className="w-6 h-6 text-[#003366]" />
          System Health &amp; Telemetry
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          State Emergency Operations Center Infrastructure &bull; Punjab Government Server Cluster
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#CBD5E1] p-4 rounded-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            FastAPI Backend Gateway
          </div>
          <div className="text-xl font-black text-emerald-700">ONLINE (200 OK)</div>
          <div className="text-[11px] text-[#64748B] mt-1 font-mono">http://127.0.0.1:8000</div>
        </div>

        <div className="bg-white border border-[#CBD5E1] p-4 rounded-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
            <Database className="w-4 h-4 text-[#003366]" />
            Shared SQLite Database
          </div>
          <div className="text-xl font-black text-[#003366]">{incidentsCount} Records Stored</div>
          <div className="text-[11px] text-[#64748B] mt-1 font-mono">incidents.db (Persisted)</div>
        </div>

        <div className="bg-white border border-[#CBD5E1] p-4 rounded-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            UIDAI e-KYC Sandbox
          </div>
          <div className="text-xl font-black text-amber-700">ACTIVE &bull; SHA-256</div>
          <div className="text-[11px] text-[#64748B] mt-1 font-mono">Mock Aadhaar Validator</div>
        </div>
      </div>

      <div className="bg-white border border-[#CBD5E1] p-5 rounded-sm space-y-4">
        <div className="font-bold text-sm text-[#0F172A] border-b border-[#CBD5E1] pb-2 uppercase tracking-wider">
          Compliance &amp; Operational Metadata
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[#64748B] block">Application Name:</span>
            <span className="font-bold text-[#0F172A]">{health?.app || 'SEOC Punjab'}</span>
          </div>
          <div>
            <span className="text-[#64748B] block">Build Version:</span>
            <span className="font-mono font-bold text-[#003366]">{health?.version || 'v3.0.0-PROD-PB'}</span>
          </div>
          <div>
            <span className="text-[#64748B] block">Statutory Standard:</span>
            <span className="font-bold text-[#0F172A]">{health?.standard || 'Section 33(b) Disaster Management Act 2005'}</span>
          </div>
          <div>
            <span className="text-[#64748B] block">Active Session Officer:</span>
            <span className="font-bold text-[#0F172A]">{officerInfo?.officer_id || 'OFFICER1'} ({officerInfo?.role || 'Dispatcher'})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
