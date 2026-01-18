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
import type { TeamBasic, AlertBasic } from "@/types";

/* ---------- Page ---------- */

export default function TeamsAnalyticsPage() {
  const [statusData, setStatusData] = useState<
    { name: string; value: number }[]
  >([]);
  const [alertsData, setAlertsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      /* ---------- Fetch teams and alerts in parallel ---------- */
      const [teamsRes, alertsRes] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/alerts"),
      ]);

      const teamsJson = await teamsRes.json();
      const alertsJson = await alertsRes.json();

      const teams: TeamBasic[] = Array.isArray(teamsJson?.teams)
        ? teamsJson.teams
        : [];

      const allAlerts: AlertBasic[] = Array.isArray(alertsJson?.alerts)
        ? alertsJson.alerts
        : [];

      /* ---------- Status distribution (Pie) ---------- */
      const green = teams.filter((t) => t.status === "green").length;
      const yellow = teams.filter((t) => t.status === "yellow").length;
      const red = teams.filter((t) => t.status === "red").length;

      setStatusData([
        { name: "Green", value: green },
        { name: "Yellow", value: yellow },
        { name: "Red", value: red },
      ]);

      /* ---------- Alerts per team (by severity) ---------- */
      const alertsPerTeam = teams.map((team) => {
        const teamAlerts = allAlerts.filter((a) => a.teamId === team.teamId);

        return {
          team: team.teamId,
          yellow: teamAlerts.filter((a) => a.severity === "yellow").length,
          red: teamAlerts.filter((a) => a.severity === "red").length,
        };
      });

      setAlertsData(alertsPerTeam);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center text-gray-600">
        Loading analytics…
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 px-10 py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Teams Analytics</h1>
          <p className="text-gray-600 mt-1">Visual insights and statistics</p>
        </div>
        <Link
          href="/lecturer/dashboard"
          className="text-purple-600 hover:text-purple-700 hover:underline text-sm font-medium"
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
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-5xl">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">
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
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-5 text-center text-gray-800">
        {title}
      </h3>
      {children}
    </div>
  );
}
