import React, { useMemo } from "react";
import { AlertTriangle, Flame, Activity, ShieldAlert } from "lucide-react";

type IncidentSeverity = "low" | "medium" | "high" | "critical";
type IncidentStatus =
  | "reported"
  | "investigating"
  | "in_progress"
  | "resolved"
  | "closed";

interface Incident {
  id: number;
  severity: IncidentSeverity;
  status: IncidentStatus;
  [key: string]: unknown;
}

interface StatsBarProps {
  incidents: Incident[];
}

const ACTIVE_STATUSES: IncidentStatus[] = [
  "reported",
  "investigating",
  "in_progress",
];

interface CardConfig {
  key: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  glow?: string;
}

export default function StatsBar({ incidents }: StatsBarProps) {
  const counts = useMemo(() => {
    const active = incidents.filter((i) =>
      ACTIVE_STATUSES.includes(i.status)
    );
    const critical = active.filter((i) => i.severity === "critical").length;
    const high = active.filter((i) => i.severity === "high").length;
    const medLow = active.filter(
      (i) => i.severity === "medium" || i.severity === "low"
    ).length;

    return {
      total: active.length,
      critical,
      high,
      medLow,
    };
  }, [incidents]);

  const cards: CardConfig[] = [
    {
      key: "total",
      label: "Total Active",
      value: counts.total,
      icon: <Activity className="h-5 w-5" />,
      accentText: "text-control-200",
      accentBg: "bg-control-800",
      accentBorder: "border-control-700",
    },
    {
      key: "critical",
      label: "Critical",
      value: counts.critical,
      icon: <ShieldAlert className="h-5 w-5" />,
      accentText: "text-critical-400",
      accentBg: "bg-critical-950",
      accentBorder: "border-critical-800",
      glow: "shadow-glow-critical",
    },
    {
      key: "high",
      label: "High",
      value: counts.high,
      icon: <Flame className="h-5 w-5" />,
      accentText: "text-high-400",
      accentBg: "bg-high-950",
      accentBorder: "border-high-800",
      glow: "shadow-glow-high",
    },
    {
      key: "medLow",
      label: "Medium / Low",
      value: counts.medLow,
      icon: <AlertTriangle className="h-5 w-5" />,
      accentText: "text-medium-400",
      accentBg: "bg-control-800",
      accentBorder: "border-control-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`relative overflow-hidden rounded-lg border ${card.accentBorder} ${card.accentBg} p-4 ${
            card.glow ?? ""
          } ${
            card.key === "critical" && card.value > 0
              ? "animate-pulse-critical"
              : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-control-400">
              {card.label}
            </span>
            <span className={card.accentText}>{card.icon}</span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-bold tabular-nums ${card.accentText}`}>
              {card.value}
            </span>
            {card.key !== "total" && (
              <span className="text-xs text-control-500">
                incident{card.value === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {/* Redundant text-label encoding for CVD accessibility */}
          <div className="mt-1 text-[10px] uppercase tracking-wider text-control-600">
            {card.key === "critical" && "Requires immediate response"}
            {card.key === "high" && "Elevated priority"}
            {card.key === "medLow" && "Standard monitoring"}
            {card.key === "total" && "Across all severities"}
          </div>
        </div>
      ))}
    </div>
  );
}
