// app/lecturer/alerts/page.tsx
"use client";


/*
  Lecturer – Alerts & Notifications
  ================================
  Purpose:
  - Show alerts history from DB (real API)
  - Filter by team + severity
  - Summary counters (red/yellow/pending)
  - Consistent UI (Tailwind) like other lecturer pages

  Data source (DB via API):
  - GET /api/alerts                -> all alerts
  - GET /api/alerts?teamId=TEAM-01 -> alerts for specific team
  - GET /api/teams                 -> teams list (for filter dropdown + links)
*/

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Team = {
  teamId: string;
  projectName?: string;
  status?: "green" | "yellow" | "red";
};

type Alert = {
  _id: string;
  teamId: string;
  severity: "yellow" | "red";
  message: string;
  emailTo?: string;
  emailStatus?: string; // "pending" | "sent" | "failed" | ...
  createdAt?: string;
};

export default function LecturerAlertsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "yellow" | "red">(
    "all"
  );

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        // teams (for filter + display)
        const teamsRes = await fetch("/api/teams", { cache: "no-store" });
        const teamsJson = await teamsRes.json();
        const teamsArr: Team[] = Array.isArray(teamsJson?.teams) ? teamsJson.teams : [];
        if (alive) setTeams(teamsArr);

        // alerts (real DB via API)
        const url =
          teamFilter === "all"
            ? "/api/alerts"
            : `/api/alerts?teamId=${encodeURIComponent(teamFilter)}`;

        const alertsRes = await fetch(url, { cache: "no-store" });
        const alertsJson = await alertsRes.json();
        const alertsArr: Alert[] = Array.isArray(alertsJson?.alerts) ? alertsJson.alerts : [];

        if (alive) setAlerts(alertsArr);
      } catch (e) {
        console.error("Failed to load alerts", e);
        if (alive) {
          setTeams([]);
          setAlerts([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [teamFilter, refreshKey]);

  const teamsMap = useMemo(() => {
    const m = new Map<string, Team>();
    teams.forEach((t) => m.set(t.teamId, t));
    return m;
  }, [teams]);

  const filteredAlerts = useMemo(() => {
    if (severityFilter === "all") return alerts;
    return alerts.filter((a) => a?.severity === severityFilter);
  }, [alerts, severityFilter]);

  const summary = useMemo(() => {
    const total = filteredAlerts.length;
    const red = filteredAlerts.filter((a) => a?.severity === "red").length;
    const yellow = filteredAlerts.filter((a) => a?.severity === "yellow").length;
    const pending = filteredAlerts.filter((a) => (a?.emailStatus || "").toLowerCase() === "pending")
      .length;

    return { total, red, yellow, pending };
  }, [filteredAlerts]);

  return (
    <main className="min-h-screen bg-gray-100 px-10 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Alerts & Notifications</h1>

        <Link
          href="/lecturer/dashboard"
          className="text-blue-600 hover:underline text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full lg:max-w-3xl">
            {/* Team filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Team</label>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="w-full border rounded px-3 py-2 bg-white"
              >
                <option value="all">All Teams</option>
                {teams.map((t) => (
                  <option key={t.teamId} value={t.teamId}>
                    {t.teamId}
                    {t.projectName ? ` — ${t.projectName}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Severity</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as "all" | "yellow" | "red")}
                className="w-full border rounded px-3 py-2 bg-white"
              >
                <option value="all">All</option>
                <option value="red">Critical (Red)</option>
                <option value="yellow">Warning (Yellow)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="px-4 py-2 rounded bg-gray-900 text-white hover:bg-black transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <StatCard label="Total" value={summary.total} />
          <StatCard label="Critical (Red)" value={summary.red} tone="red" />
          <StatCard label="Warning (Yellow)" value={summary.yellow} tone="yellow" />
          <StatCard label="Email Pending" value={summary.pending} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Alerts History</h2>
          <p className="text-sm text-gray-600 mt-1">
            All rows are loaded from the database via the API.
          </p>
        </div>

        {loading ? (
          <div className="p-6 text-gray-600">Loading alerts…</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-6 text-gray-600">No alerts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 border-b">Date</th>
                  <th className="text-left px-6 py-3 border-b">Team</th>
                  <th className="text-left px-6 py-3 border-b">Severity</th>
                  <th className="text-left px-6 py-3 border-b">Message</th>
                  <th className="text-left px-6 py-3 border-b">Email</th>
                  <th className="text-left px-6 py-3 border-b">Email Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredAlerts.map((a) => {
                  const t = teamsMap.get(a.teamId);
                  return (
                    <tr key={a._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 border-b text-sm text-gray-700">
                        {a.createdAt
                          ? new Date(a.createdAt).toLocaleString()
                          : "—"}
                      </td>

                      <td className="px-6 py-4 border-b">
                        <div className="flex flex-col">
                          <Link
                            href={`/lecturer/teams/${a.teamId}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {a.teamId}
                          </Link>
                          {t?.projectName ? (
                            <span className="text-xs text-gray-500">
                              {t.projectName}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-6 py-4 border-b">
                        <SeverityBadge severity={a.severity} />
                      </td>

                      <td className="px-6 py-4 border-b text-gray-800">
                        {a.message || "—"}
                      </td>

                      <td className="px-6 py-4 border-b text-sm text-gray-700">
                        {a.emailTo || "—"}
                      </td>

                      <td className="px-6 py-4 border-b">
                        <EmailStatusBadge status={a.emailStatus} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

/* ---------- Small UI Components ---------- */

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "red" | "yellow";
}) {
  const toneClass =
    tone === "red"
      ? "border-red-200 bg-red-50"
      : tone === "yellow"
      ? "border-yellow-200 bg-yellow-50"
      : "border-gray-200 bg-gray-50";

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="text-sm text-gray-700">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: "yellow" | "red" }) {
  const map = {
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
  };

  const label = severity === "red" ? "Critical (Red)" : "Warning (Yellow)";

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${map[severity]}`}>
      {label}
    </span>
  );
}

function EmailStatusBadge({ status }: { status?: string }) {
  const s = (status || "").toLowerCase();

  let cls = "bg-gray-100 text-gray-700";
  if (s === "pending") cls = "bg-yellow-100 text-yellow-700";
  if (s === "sent") cls = "bg-green-100 text-green-700";
  if (s === "failed") cls = "bg-red-100 text-red-700";

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${cls}`}>
      {status ? status.toUpperCase() : "—"}
    </span>
  );
}
