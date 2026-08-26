import React, { useMemo } from "react"

type IncidentSeverity = "low" | "medium" | "high" | "critical"
type IncidentStatus =
  | "new"
  | "reported"
  | "investigating"
  | "in_progress"
  | "resolved"
  | "closed"

interface Incident {
  id: number
  severity: IncidentSeverity
  status: IncidentStatus
  [key: string]: unknown
}

interface AnalyticsSummary {
  total_incidents: number
  active_incidents: number
  critical: number
  high: number
  medium: number
  low: number
  total_affected: number
  insight?: { summary?: string; response_pressure?: string; top_type?: string }
}

interface StatsBarProps {
  incidents: Incident[]
  analytics?: AnalyticsSummary | null
}

const ACTIVE_STATUSES: IncidentStatus[] = [
  "new",
  "reported",
  "investigating",
  "in_progress",
]

interface CardConfig {
  key: string
  label: string
  value: number
  icon: string
  accentText: string
  accentBg: string
  accentBorder: string
  glow?: string
}

export default function StatsBar({ incidents, analytics }: StatsBarProps) {
  const counts = useMemo(() => {
    if (analytics) {
      return {
        total: analytics.active_incidents,
        critical: analytics.critical,
        high: analytics.high,
        medLow: analytics.medium + analytics.low,
        affected: analytics.total_affected,
      }
    }

    const active = incidents.filter((i) =>
      ACTIVE_STATUSES.includes(i.status as IncidentStatus)
    )
    const critical = active.filter((i) => i.severity === "critical").length
    const high = active.filter((i) => i.severity === "high").length
    const medLow = active.filter(
      (i) => i.severity === "medium" || i.severity === "low"
    ).length

    return {
      total: active.length,
      critical,
      high,
      medLow,
      affected: incidents.reduce((sum, i) => sum + Number(i.people_affected ?? 0), 0),
    }
  }, [analytics, incidents])

  const cards: CardConfig[] = [
    {
      key: "total",
      label: "Total Active",
      value: counts.total,
      icon: "📊",
      accentText: "text-blue-400",
      accentBg: "bg-blue-950",
      accentBorder: "border-blue-800",
    },
    {
      key: "critical",
      label: "Critical",
      value: counts.critical,
      icon: "🚨",
      accentText: "text-red-400",
      accentBg: "bg-red-950",
      accentBorder: "border-red-800",
      glow: "shadow-lg shadow-red-500/50",
    },
    {
      key: "high",
      label: "High",
      value: counts.high,
      icon: "🔥",
      accentText: "text-orange-400",
      accentBg: "bg-orange-950",
      accentBorder: "border-orange-800",
    },
    {
      key: "medLow",
      label: "Medium / Low",
      value: counts.medLow,
      icon: "⚠️",
      accentText: "text-yellow-400",
      accentBg: "bg-slate-900",
      accentBorder: "border-slate-800",
    },
  ]

  const nearbySafety = useMemo(() => {
    const center = { latitude: 31.1048, longitude: 75.8022 }
    const radiusKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const toRad = (value: number) => (value * Math.PI) / 180
      const earthRadius = 6371
      const dLat = toRad(lat2 - lat1)
      const dLon = toRad(lon2 - lon1)
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }

    return incidents
      .map((incident) => ({
        ...incident,
        distance: radiusKm(center.latitude, center.longitude, Number(incident.latitude ?? center.latitude), Number(incident.longitude ?? center.longitude)),
      }))
      .filter((incident) => incident.distance <= 10)
      .sort((a, b) => Number(a.distance) - Number(b.distance))
      .slice(0, 3)
  }, [incidents])

  const correlationInsight = useMemo(() => {
    const groups = incidents.reduce<Record<string, number>>((acc, incident) => {
      const key = (incident.type ?? "other").toLowerCase()
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})

    const topType = Object.entries(groups).sort((a, b) => b[1] - a[1])[0]
    const mergedReports = incidents.filter((item) => Number(item.report_count ?? 1) > 1).length

    return {
      topType: topType ? topType[0] : "other",
      mergedReports,
      summary: mergedReports > 0 ? `${mergedReports} grouped reports indicate same-incident clustering.` : "No strong duplicate clusters identified yet.",
    }
  }, [incidents])

  return (
    <div className="p-6 border-b border-slate-800 bg-slate-950/80">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Response overview</div>
          <div className="mt-1 text-sm text-slate-300">
            {analytics?.insight?.summary ?? "Live field conditions monitored continuously."}
          </div>
        </div>
        <div className="rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3 py-1 text-xs font-medium text-emerald-300">
          {counts.affected} people impacted
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.key}
            className={`p-6 rounded-xl border ${card.accentBorder} ${card.accentBg} ${card.glow || ""}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-3xl mb-2">{card.icon}</div>
                <div className="text-sm font-medium text-slate-400">{card.label}</div>
              </div>
            </div>
            <div className={`text-4xl font-bold ${card.accentText}`}>{card.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-emerald-300">Safety around me</div>
          <div className="space-y-2 text-sm text-slate-300">
            {nearbySafety.length > 0 ? (
              nearbySafety.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between border-b border-slate-800 pb-2 last:border-b-0 last:pb-0">
                  <div>
                    <div className="font-medium text-slate-100">{String(incident.type).replace(/_/g, " ")}</div>
                    <div className="text-xs text-slate-400">{incident.severity} · {incident.people_affected ?? 0} affected</div>
                  </div>
                  <div className="text-xs text-cyan-300">{Number(incident.distance).toFixed(1)} km</div>
                </div>
              ))
            ) : (
              <div className="text-slate-400">No incidents detected within the 10 km radius.</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-violet-300">Incident correlation</div>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="rounded-lg border border-violet-800 bg-violet-950/40 p-3">
              <div className="text-violet-200 font-medium">Top cluster</div>
              <div className="mt-1 text-slate-100">{correlationInsight.topType.replace(/_/g, " ")}</div>
            </div>
            <div className="text-slate-300">{correlationInsight.summary}</div>
            <div className="text-xs text-slate-400">
              Privacy-first mode: exact reporter data is never exposed publicly, and each alert remains reviewable by operators.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
