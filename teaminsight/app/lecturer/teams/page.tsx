"use client";

/*
  Lecturer – Teams History Page
  =============================
  Course-aligned implementation
*/

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Team = {
  teamId: string;
  projectName: string;
  status: "green" | "yellow" | "red";
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Team["status"]>("all")

  type SortKey = "teamId" | "projectName" | "status";
  type SortDir = "asc" | "desc";

  const [sortKey, setSortKey] = useState<SortKey>("teamId");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedTeams = useMemo(() => {
    const statusRank: Record<Team["status"], number> = {
      red: 0,
      yellow: 1,
      green: 2,
    };

    const copy = [...teams];

    copy.sort((a, b) => {
      let cmp = 0;

      if (sortKey === "teamId") {

        const aNum = Number(a.teamId);
        const bNum = Number(b.teamId);

        if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
          cmp = aNum - bNum;
        } else {
          cmp = a.teamId.localeCompare(b.teamId, "he");
        }
      }

      if (sortKey === "projectName") {
        cmp = (a.projectName ?? "").localeCompare(b.projectName ?? "", "he");
      }

      if (sortKey === "status") {
        cmp = statusRank[a.status] - statusRank[b.status];
      }

      return sortDir === "asc" ? cmp : -cmp;
    });

    return copy;
  }, [teams, sortKey, sortDir]);

  useEffect(() => {
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setTeams(data.teams);
      })
      .finally(() => setLoading(false));
  }, []);

  const kpi = useMemo(() => {
    const total = teams.length;
    const green = teams.filter((t) => t.status === "green").length;
    const yellow = teams.filter((t) => t.status === "yellow").length;
    const red = teams.filter((t) => t.status === "red").length;
    return { total, green, yellow, red };
  }, [teams]);

  const visibleTeams = useMemo(() => {
    const q = query.trim().toLowerCase();

    return sortedTeams.filter((t) => {
      const matchesQuery =
        q.length === 0 ||
        t.teamId.toLowerCase().includes(q) ||
        t.projectName.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || t.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [sortedTeams, query, statusFilter]);

  return (
    <main className="min-h-screen bg-gray-100 w-full py-10">
      <div className="w-full px-4 md:px-8">
        {/* Header row */}
        <div className="flex items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Teams Overview</h1>
            <p className="text-gray-600 mt-1 text-sm">
              Monitor team status and quickly drill down into team details.
            </p>
          </div>

          <Link
            href="/lecturer/dashboard"
            className="text-blue-600 hover:underline text-sm whitespace-nowrap"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="text-gray-600">Loading teams...</div>
        ) : (
          <div className="w-full space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard title="Total Teams" value={kpi.total} />
              <KpiCard title="Green" value={kpi.green} tone="green" />
              <KpiCard title="Yellow" value={kpi.yellow} tone="yellow" />
              <KpiCard title="Red" value={kpi.red} tone="red" />
            </div>

            {/* Toolbar: Search + Filter */}
            <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-start">
              <div className="w-full md:max-w-md">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by Team ID or Project Name..."
                  className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | Team["status"])}
                  className="border rounded-md px-3 py-2 text-sm bg-white"
                >
                  <option value="all">All</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                  <option value="red">Red</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("all");
                  }}
                  className="text-sm px-3 py-2 rounded-md border hover:bg-gray-50 whitespace-nowrap"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Full width table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-6 py-3 border-b">
                        <button
                          type="button"
                          onClick={() => toggleSort("teamId")}
                          className="font-semibold hover:underline"
                        >
                          Team ID
                        </button>
                      </th>

                      <th className="text-left px-6 py-3 border-b">
                        <button
                          type="button"
                          onClick={() => toggleSort("projectName")}
                          className="font-semibold hover:underline"
                        >
                          Project Name
                        </button>
                      </th>

                      <th className="text-left px-6 py-3 border-b">
                        <button
                          type="button"
                          onClick={() => toggleSort("status")}
                          className="font-semibold hover:underline"
                        >
                          Status
                        </button>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleTeams.map((team) => (
                      <tr key={team.teamId} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 border-b font-medium text-blue-600">
                          <Link href={`/lecturer/teams/${team.teamId}`} className="hover:underline">
                            {team.teamId}
                          </Link>
                        </td>

                        <td className="px-6 py-4 border-b">{team.projectName}</td>

                        <td className="px-6 py-4 border-b">
                          <StatusBadge status={team.status} />
                        </td>
                      </tr>
                    ))}

                    {visibleTeams.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center px-6 py-10 text-gray-500">
                          No teams match your filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: Team["status"] }) {
  const config = {
    green: {
      dot: "bg-green-500",
      text: "OK",
      textColor: "text-green-700",
      bg: "bg-green-50",
    },
    yellow: {
      dot: "bg-yellow-400",
      text: "Warning",
      textColor: "text-yellow-700",
      bg: "bg-yellow-50",
    },
    red: {
      dot: "bg-red-500",
      text: "Risk",
      textColor: "text-red-700",
      bg: "bg-red-50",
    },
  }[status];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.textColor}`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
      {config.text}
    </div>
  );
}

function KpiCard({
  title,
  value,
  tone = "neutral",
}: {
  title: string;
  value: number;
  tone?: "neutral" | "green" | "yellow" | "red";
}) {
  const styles = {
    neutral: {
      bg: "bg-white",
      border: "border-gray-200",
      value: "text-gray-900",
      title: "text-gray-600",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      value: "text-green-700",
      title: "text-green-700",
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      value: "text-yellow-700",
      title: "text-yellow-700",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      value: "text-red-700",
      title: "text-red-700",
    },
  }[tone];

  return (
    <div
      className={`rounded-lg border ${styles.border} ${styles.bg} p-4 shadow-sm`}
    >
      <div className={`text-sm font-medium ${styles.title}`}>
        {title}
      </div>
      <div className={`text-3xl font-bold mt-1 ${styles.value}`}>
        {value}
      </div>
    </div>
  );
}

