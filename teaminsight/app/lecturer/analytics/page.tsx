"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/* ---------- Types ---------- */

type Team = {
  teamId: string;
  status: "green" | "yellow" | "red";
};

type Alert = {
  teamId: string;
  severity: "yellow" | "red";
};

type AlertsPerTeam = {
  teamId: string;
  yellow: number;
  red: number;
};

/* ---------- Page ---------- */

export default function TeamsAnalyticsPage() {
  const [statusData, setStatusData] = useState<
    { name: string; value: number }[]
  >([]);
  const [alertsData, setAlertsData] = useState<AlertsPerTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      /* ---------- Teams ---------- */
      const teamsRes = await fetch("/api/teams");
      const teamsJson = await teamsRes.json();
      const teams: Team[] = Array.isArray(teamsJson?.teams)
        ? teamsJson.teams
        : [];

      /* ---------- Status distribution (Pie) ---------- */
      const green = teams.filter(t => t.status === "green").length;
      const yellow = teams.filter(t => t.status === "yellow").length;
      const red = teams.filter(t => t.status === "red").length;

      setStatusData([
        { name: "Green", value: green },
        { name: "Yellow", value: yellow },
        { name: "Red", value: red },
      ]);

      /* ---------- Alerts per team (by severity) ---------- */
      const alertsPerTeam: AlertsPerTeam[] = [];

      for (const team of teams) {
        const res = await fetch(`/api/alerts?teamId=${team.teamId}`);
        const json = await res.json();
        const alerts: Alert[] = Array.isArray(json?.alerts)
          ? json.alerts
          : [];

        alertsPerTeam.push({
          team: team.teamId,
          yellow: alerts.filter(a => a.severity === "yellow").length,
          red: alerts.filter(a => a.severity === "red").length,
        });
      }

      setAlertsData(alertsPerTeam);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading analytics…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-10 py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">Teams Analytics</h1>
        <Link
          href="/lecturer/dashboard"
          className="text-blue-600 hover:underline text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 mb-12">
        {/* Status distribution – PIE */}
        <ChartCard title="Teams Status Distribution">
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                label
              >
                <Cell fill="#22c55e" />
                <Cell fill="#eab308" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Alerts per team */}
        <ChartCard title="Alerts per Team (by Severity)">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={alertsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="yellow"
                fill="#eab308"
                name="Warning (Yellow)"
              />
              <Bar
                dataKey="red"
                fill="#ef4444"
                name="Critical (Red)"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Explanation */}
      <div className="bg-white rounded-lg shadow p-6 max-w-5xl">
        <h2 className="text-xl font-semibold mb-3">
          What These Analytics Show
        </h2>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Team health distribution based on current team status.</li>
          <li>Alerts are split by severity (yellow / red).</li>
          <li>All data is pulled directly from the database.</li>
        </ul>
      </div>
    </main>
  );
}

/* ---------- UI Helper ---------- */

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-semibold mb-5 text-center">
        {title}
      </h3>
      {children}
    </div>
  );
}
