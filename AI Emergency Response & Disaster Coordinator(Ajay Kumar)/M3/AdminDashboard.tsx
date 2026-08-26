import React, { useEffect, useMemo, useState, useCallback } from "react";

/**
 * AdminDashboard
 * Fetches incidents from GET /api/incidents and renders a sortable,
 * dark-themed operations table.
 *
 * Design notes:
 * - Palette is built around an "ops room at night" feel: near-black slate
 *   background, cool steel borders, and a severity ramp that runs
 *   amber -> orange -> red -> deep crimson so the eye reads danger by
 *   temperature, not just by label.
 * - Data-dense typography uses a monospace face for numbers/timestamps
 *   (tabular alignment matters in a scan-table) paired with a plain
 *   sans for labels.
 * - Command-center pass: dot-grid backdrop, beveled panel edges, glow on
 *   critical severity, sharper hover/active states.
 */

type Severity = "low" | "medium" | "high" | "critical";
type Status = "open" | "investigating" | "monitoring" | "resolved";

interface Incident {
  id: string;
  type: string;
  severity: Severity;
  location: string;
  peopleAffected: number;
  status: Status;
  time: string; // ISO timestamp
}

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const SEVERITY_STYLES: Record<Severity, string> = {
  critical:
    "bg-red-950 text-red-300 ring-1 ring-inset ring-red-500/50 shadow-[0_0_12px_-2px_rgba(239,68,68,0.6)]",
  high: "bg-orange-950 text-orange-300 ring-1 ring-inset ring-orange-500/50",
  medium: "bg-amber-950 text-amber-300 ring-1 ring-inset ring-amber-500/40",
  low: "bg-slate-800 text-slate-300 ring-1 ring-inset ring-slate-500/40",
};

const SEVERITY_DOT: Record<Severity, string> = {
  critical: "bg-red-500 shadow-[0_0_6px_1px_rgba(239,68,68,0.8)] animate-pulse",
  high: "bg-orange-500",
  medium: "bg-amber-400",
  low: "bg-slate-400",
};

const STATUS_STYLES: Record<Status, string> = {
  open: "text-red-300",
  investigating: "text-amber-300",
  monitoring: "text-sky-300",
  resolved: "text-emerald-400",
};

const STATUS_LABEL: Record<Status, string> = {
  open: "Open",
  investigating: "Investigating",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

const TYPE_ICON: Record<string, string> = {
  fire: "🔥",
  flood: "🌊",
  earthquake: "🌎",
  medical: "🚑",
  power_outage: "⚡",
  security: "🛡️",
  hazmat: "☣️",
  traffic: "🚧",
  storm: "🌪️",
  default: "⚠️",
};

function typeIcon(type: string): string {
  const key = type.toLowerCase().replace(/\s+/g, "_");
  return TYPE_ICON[key] ?? TYPE_ICON.default;
}

function formatType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type SortKey = "type" | "severity" | "location" | "peopleAffected" | "status" | "time";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "type", label: "Type" },
  { key: "severity", label: "Severity" },
  { key: "location", label: "Location" },
  { key: "peopleAffected", label: "People Affected" },
  { key: "status", label: "Status" },
  { key: "time", label: "Time" },
];

export default function AdminDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("severity");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/incidents");
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const data = await res.json();
      const list: Incident[] = Array.isArray(data) ? data : data.incidents ?? [];
      setIncidents(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    const copy = [...incidents];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "severity":
          cmp = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
          break;
        case "peopleAffected":
          cmp = a.peopleAffected - b.peopleAffected;
          break;
        case "time":
          cmp = new Date(a.time).getTime() - new Date(b.time).getTime();
          break;
        default:
          cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [incidents, sortKey, sortDir]);

  const criticalCount = incidents.filter((i) => i.severity === "critical").length;
  const openCount = incidents.filter((i) => i.status !== "resolved").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-8 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.06)_1px,transparent_0)] bg-[size:24px_24px]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-slate-100 [text-shadow:0_0_20px_rgba(148,163,184,0.15)]">
              Incident Board
            </h1>
            <span className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              live
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Real-time feed of reported incidents, sorted by severity.
          </p>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Total incidents" value={incidents.length} tone="neutral" />
          <SummaryCard label="Critical" value={criticalCount} tone="critical" />
          <SummaryCard label="Unresolved" value={openCount} tone="warn" />
        </div>

        {/* Table card */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden shadow-[inset_0_1px_0_0_rgba(148,163,184,0.08)] ring-1 ring-black/20">
          {error && (
            <div className="px-5 py-4 border-b border-slate-800 bg-red-950/40 text-red-300 text-sm flex items-center justify-between">
              <span>Couldn't load incidents — {error}</span>
              <button
                onClick={loadIncidents}
                className="text-xs font-medium px-2.5 py-1 rounded border border-red-500/40 hover:bg-red-500/10 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className={`text-left px-5 py-3 ${
                        sortKey === col.key ? "bg-slate-800/30" : ""
                      }`}
                    >
                      <button
                        onClick={() => handleSort(col.key)}
                        className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {col.label}
                        <SortIndicator active={sortKey === col.key} dir={sortDir} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                {!loading && !error && sorted.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-5 py-10 text-center text-slate-500">
                      No incidents reported. All clear.
                    </td>
                  </tr>
                )}
                {!loading &&
                  sorted.map((incident) => (
                    <tr
                      key={incident.id}
                      className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/40 hover:ring-1 hover:ring-inset hover:ring-slate-700/50 transition-colors"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span className="text-base leading-none" aria-hidden>
                            {typeIcon(incident.type)}
                          </span>
                          <span className="text-slate-200">{formatType(incident.type)}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium capitalize ${SEVERITY_STYLES[incident.severity]}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_DOT[incident.severity]}`} />
                          {incident.severity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">{incident.location}</td>
                      <td className="px-5 py-3.5 font-mono tabular-nums text-slate-300">
                        {incident.peopleAffected.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`font-medium ${STATUS_STYLES[incident.status]}`}>
                          {STATUS_LABEL[incident.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {formatTime(incident.time)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      className={`transition-transform ${active ? "text-slate-300" : "text-slate-700"} ${
        active && dir === "asc" ? "rotate-180" : ""
      }`}
      fill="none"
    >
      <path d="M2 3.5L5 7L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-800/60">
      {COLUMNS.map((col) => (
        <td key={col.key} className="px-5 py-3.5">
          <div className="h-3.5 w-20 rounded bg-slate-800 animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "critical" | "warn";
}) {
  const toneStyles = {
    neutral: "text-slate-100",
    critical: "text-red-400 border-t-2 border-t-red-500/40",
    warn: "text-amber-400",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 hover:border-slate-700 transition-colors">
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-mono tabular-nums font-semibold ${toneStyles}`}>{value}</div>
    </div>
  );
}
