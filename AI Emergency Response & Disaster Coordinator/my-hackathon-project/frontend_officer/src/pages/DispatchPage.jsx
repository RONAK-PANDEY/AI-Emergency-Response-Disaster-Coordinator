import React, { useState, useEffect } from 'react';
import { Truck, Send, CheckCircle2, AlertTriangle, Shield, Clock } from 'lucide-react';
import IncidentDossier, { SeverityBadge, StatusBadge, TypeBadge } from '../components/IncidentDossier';

const API = 'http://127.0.0.1:8000';

export default function DispatchPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${API}/api/v1/incidents`);
      const data = await res.json();
      setIncidents(Array.isArray(data) ? data : []);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const pending = incidents.filter(i => ['new', 'reported'].includes((i.status || '').toLowerCase()));
  const active = incidents.filter(i => (i.status || '').toLowerCase() === 'dispatched');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#0F172A] tracking-tight flex items-center gap-2">
          <Truck className="w-6 h-6 text-[#003366]" />
          Tactical Dispatch Command
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Coordinate Emergency First-Responders: SDRF &bull; Police &bull; Fire Brigade &bull; Ambulances
        </p>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Dispatch Queue */}
        <div className="bg-white border border-[#CBD5E1] rounded-sm p-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#CBD5E1]">
            <span className="font-bold text-sm text-[#B91C1C] flex items-center gap-1.5 uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4" />
              Pending Dispatch Queue ({pending.length})
            </span>
          </div>

          <div className="mt-3 space-y-2.5 max-h-[500px] overflow-y-auto">
            {pending.length === 0 ? (
              <p className="text-xs text-[#94A3B8] text-center py-8">No pending incidents requiring dispatch.</p>
            ) : (
              pending.map(inc => (
                <div
                  key={inc.id}
                  onClick={() => setSelected(inc)}
                  className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] hover:border-[#003366] rounded-sm cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-xs text-[#003366]">PB-INC-{String(inc.id).padStart(4, '0')}</span>
                    <SeverityBadge severity={inc.severity} />
                  </div>
                  <p className="text-xs text-[#0F172A] font-medium line-clamp-2">{inc.description}</p>
                  <div className="mt-2 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>Required: <strong className="capitalize text-[#003366]">{inc.required_team || 'Police'}</strong></span>
                    <span className="text-[#003366] font-bold">Deploy &rarr;</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Field Operations */}
        <div className="bg-white border border-[#CBD5E1] rounded-sm p-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#CBD5E1]">
            <span className="font-bold text-sm text-[#D97706] flex items-center gap-1.5 uppercase tracking-wide">
              <Send className="w-4 h-4" />
              Active Field Deployments ({active.length})
            </span>
          </div>

          <div className="mt-3 space-y-2.5 max-h-[500px] overflow-y-auto">
            {active.length === 0 ? (
              <p className="text-xs text-[#94A3B8] text-center py-8">No active units in transit.</p>
            ) : (
              active.map(inc => (
                <div
                  key={inc.id}
                  onClick={() => setSelected(inc)}
                  className="p-3 bg-[#FFFBEB] border border-amber-200 hover:border-amber-400 rounded-sm cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-xs text-[#003366]">PB-INC-{String(inc.id).padStart(4, '0')}</span>
                    <StatusBadge status={inc.status} />
                  </div>
                  <p className="text-xs text-[#0F172A] font-medium line-clamp-2">{inc.description}</p>
                  <div className="mt-2 pt-2 border-t border-amber-200 flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>Assigned: <strong className="capitalize text-[#003366]">{inc.required_team}</strong></span>
                    <span className="text-emerald-700 font-bold">Review &rarr;</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

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
